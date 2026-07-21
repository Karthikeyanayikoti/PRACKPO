const path = require("path");
const crypto = require("crypto");
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const Razorpay = require("razorpay");
require("dotenv").config();

const User = require("./models/User");
const Payment = require("./models/Payment");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "";
const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT || 10);
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
const PLATFORM_PAYOUT_MODE = process.env.PLATFORM_PAYOUT_MODE || "admin_collect_and_settle";
const RAZORPAY_ROUTE_ENABLED = String(process.env.RAZORPAY_ROUTE_ENABLED || "false").toLowerCase() === "true";

const razorpay = RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET
  ? new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET })
  : null;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: true }));

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ message: "Invalid JSON payload." });
  }
  return next(error);
});

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password, role = "customer", supplierId = null } = req.body;
    const normalizedRole = String(role).trim().toLowerCase();
    const normalizedSupplierId = supplierId ? String(supplierId).trim() : null;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    if (!["customer", "owner"].includes(normalizedRole)) {
      return res.status(400).json({ message: "Role must be either customer or owner." });
    }

    if (normalizedRole === "owner" && !normalizedSupplierId) {
      return res.status(400).json({ message: "Supplier is required for owner sign up." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });

    if (existing) {
      return res.status(409).json({ message: "User already exists. Please sign in." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: normalizedRole,
      supplierId: normalizedRole === "owner" ? normalizedSupplierId : null
    });

    return res.status(201).json({
      message: "Account created successfully.",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        supplierId: newUser.supplierId
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error during sign up." });
  }
});

app.post("/api/auth/signin", async (req, res) => {
  try {
    const { email, password, role = "customer" } = req.body;
    const normalizedRole = String(role).trim().toLowerCase();

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    if (!["customer", "owner"].includes(normalizedRole)) {
      return res.status(400).json({ message: "Role must be either customer or owner." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const userRole = user.role || "customer";

    if (userRole !== normalizedRole) {
      return res.status(403).json({ message: `This account is registered as ${userRole}. Please use the correct login mode.` });
    }

    return res.status(200).json({
      message: "Sign in successful.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: userRole,
        supplierId: user.supplierId
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error during sign in." });
  }
});

function validatePaymentInput(payload) {
  const {
    bookingId,
    customerName,
    supplierId,
    paymentMethod,
    amount,
    bankDetails,
    orderDetails
  } = payload;

  if (!bookingId || !customerName || !supplierId || !paymentMethod || !amount) {
    return { ok: false, message: "bookingId, customerName, supplierId, paymentMethod and amount are required." };
  }

  const normalizedMethod = String(paymentMethod).trim();
  if (!["UPI", "Card", "NetBanking"].includes(normalizedMethod)) {
    return { ok: false, message: "Only UPI, Card, and NetBanking payments are supported." };
  }

  const grossAmount = Number(amount);
  if (!Number.isFinite(grossAmount) || grossAmount <= 0) {
    return { ok: false, message: "Amount must be a valid number greater than zero." };
  }

  let validatedBankDetails = null;
  if (normalizedMethod === "NetBanking") {
    const accountHolderName = String(bankDetails?.accountHolderName || "").trim();
    const bankName = String(bankDetails?.bankName || "").trim();
    const accountNumber = String(bankDetails?.accountNumber || "").trim();
    const ifscCode = String(bankDetails?.ifscCode || "").trim().toUpperCase();

    const accountNumberPattern = /^\d{9,18}$/;
    const ifscPattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;

    if (!accountHolderName || !bankName || !accountNumber || !ifscCode) {
      return { ok: false, message: "Bank details are required for NetBanking payment." };
    }

    if (!accountNumberPattern.test(accountNumber)) {
      return { ok: false, message: "Account number must be between 9 and 18 digits." };
    }

    if (!ifscPattern.test(ifscCode)) {
      return { ok: false, message: "Please provide a valid IFSC code." };
    }

    validatedBankDetails = {
      accountHolderName,
      bankName,
      accountNumberLast4: accountNumber.slice(-4),
      ifscCode
    };
  }

  let validatedOrderDetails = null;
  if (orderDetails) {
    const quantity = Number(orderDetails.quantity);
    const deliveryDate = String(orderDetails.deliveryDate || "").trim();
    const timeSlot = String(orderDetails.timeSlot || "").trim();
    const phone = String(orderDetails.phone || "").trim();
    const address = String(orderDetails.address || "").trim();

    if (!Number.isFinite(quantity) || quantity < 1) {
      return { ok: false, message: "Order quantity must be a valid number greater than zero." };
    }

    if (!deliveryDate || !timeSlot || !phone || !address) {
      return { ok: false, message: "Delivery date, time slot, phone, and address are required in order details." };
    }

    if (!/^\d{10}$/.test(phone)) {
      return { ok: false, message: "Phone must be a valid 10-digit number." };
    }

    validatedOrderDetails = {
      quantity,
      deliveryDate,
      timeSlot,
      phone,
      address
    };
  }

  return {
    ok: true,
    value: {
      bookingId: String(bookingId).trim(),
      customerName: String(customerName).trim(),
      supplierId: String(supplierId).trim(),
      paymentMethod: normalizedMethod,
      grossAmount,
      bankDetails: validatedBankDetails,
      orderDetails: validatedOrderDetails
    }
  };
}

app.post("/api/payments/create-order", async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(500).json({
        message: "Payment gateway is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env."
      });
    }

    const validation = validatePaymentInput(req.body);
    if (!validation.ok) {
      return res.status(400).json({ message: validation.message });
    }

    const {
      bookingId,
      customerName,
      supplierId,
      paymentMethod,
      grossAmount,
      bankDetails,
      orderDetails
    } = validation.value;

    const existingByBooking = await Payment.findOne({ bookingId, status: "Paid" });
    if (existingByBooking) {
      return res.status(409).json({ message: `Booking ${bookingId} has already been paid.` });
    }

    const safeFeePercent = Math.min(100, Math.max(0, PLATFORM_FEE_PERCENT));
    const platformFeeAmount = Number(((grossAmount * safeFeePercent) / 100).toFixed(2));
    const ownerPayoutAmount = Number((grossAmount - platformFeeAmount).toFixed(2));

    const order = await razorpay.orders.create({
      amount: Math.round(grossAmount * 100),
      currency: "INR",
      receipt: bookingId,
      notes: {
        bookingId,
        supplierId,
        customerName
      }
    });

    const payoutMode = RAZORPAY_ROUTE_ENABLED && PLATFORM_PAYOUT_MODE === "direct_split"
      ? "direct_split"
      : "admin_collect_and_settle";

    await Payment.create({
      gateway: "Razorpay",
      gatewayOrderId: order.id,
      bookingId,
      customerName,
      supplierId,
      paymentMethod,
      grossAmount,
      platformFeePercent: safeFeePercent,
      platformFeeAmount,
      ownerPayoutAmount,
      payoutMode,
      ownerSettlementStatus: payoutMode === "direct_split" ? "completed" : "pending",
      bankDetails,
      orderDetails,
      status: "Created"
    });

    return res.status(201).json({
      message: "Payment order created.",
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        bookingId,
        customerName,
        supplierId,
        paymentMethod,
        grossAmount,
        orderDetails,
        platformFeePercent: safeFeePercent,
        platformFeeAmount,
        ownerPayoutAmount,
        payoutMode
      },
      gateway: {
        name: "Razorpay",
        keyId: RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    console.error("Payment order creation error:", error.message, error.stack);
    return res.status(500).json({ 
      message: "Server error while creating payment order.",
      debug: error.message 
    });
  }
});

app.post("/api/payments/verify", async (req, res) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      bookingId,
      paymentMethod,
      bankDetails
    } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !bookingId || !paymentMethod) {
      return res.status(400).json({ message: "Missing required verification details." });
    }

    if (!RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ message: "Payment gateway secret is missing on server." });
    }

    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      await Payment.updateOne(
        { gatewayOrderId: razorpayOrderId },
        {
          $set: {
            status: "Failed",
            paymentMethod: String(paymentMethod).trim()
          }
        }
      );
      return res.status(400).json({ message: "Payment verification failed. Invalid signature." });
    }

    const validation = validatePaymentInput({
      bookingId,
      customerName: "verified-customer",
      supplierId: "verified-supplier",
      paymentMethod,
      amount: 1,
      bankDetails,
      orderDetails: null
    });

    if (!validation.ok) {
      return res.status(400).json({ message: validation.message });
    }

    const payment = await Payment.findOne({ gatewayOrderId: razorpayOrderId, bookingId: String(bookingId).trim() });
    if (!payment) {
      return res.status(404).json({ message: "Payment order not found." });
    }

    if (payment.status === "Paid") {
      return res.status(200).json({
        message: "Payment already verified.",
        payment: {
          transactionId: payment.transactionId,
          bookingId: payment.bookingId,
          paymentMethod: payment.paymentMethod,
          grossAmount: payment.grossAmount,
          orderDetails: payment.orderDetails,
          platformFeePercent: payment.platformFeePercent,
          platformFeeAmount: payment.platformFeeAmount,
          ownerPayoutAmount: payment.ownerPayoutAmount,
          payoutMode: payment.payoutMode,
          ownerSettlementStatus: payment.ownerSettlementStatus,
          bankDetails: payment.paymentMethod === "NetBanking" && payment.bankDetails?.bankName && payment.bankDetails?.accountNumberLast4
            ? {
                bankName: payment.bankDetails.bankName,
                accountNumberLast4: payment.bankDetails.accountNumberLast4,
                ifscCode: payment.bankDetails.ifscCode
              }
            : null,
          status: payment.status
        }
      });
    }

    const normalizedMethod = String(paymentMethod).trim();
    payment.transactionId = razorpayPaymentId;
    payment.gatewayPaymentId = razorpayPaymentId;
    payment.gatewaySignature = razorpaySignature;
    payment.paymentMethod = normalizedMethod;
    payment.bankDetails = normalizedMethod === "NetBanking" ? validation.value.bankDetails : null;
    payment.status = "Paid";
    await payment.save();

    return res.status(200).json({
      message: "Payment verified successfully.",
      payment: {
        transactionId: payment.transactionId,
        bookingId: payment.bookingId,
        paymentMethod: payment.paymentMethod,
        grossAmount: payment.grossAmount,
        orderDetails: payment.orderDetails,
        platformFeePercent: payment.platformFeePercent,
        platformFeeAmount: payment.platformFeeAmount,
        ownerPayoutAmount: payment.ownerPayoutAmount,
        payoutMode: payment.payoutMode,
        ownerSettlementStatus: payment.ownerSettlementStatus,
        bankDetails: payment.paymentMethod === "NetBanking" && payment.bankDetails?.bankName && payment.bankDetails?.accountNumberLast4
          ? {
              bankName: payment.bankDetails.bankName,
              accountNumberLast4: payment.bankDetails.accountNumberLast4,
              ifscCode: payment.bankDetails.ifscCode
            }
          : null,
        status: payment.status
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error during payment verification." });
  }
});

app.get("/api/owners/dashboard", async (req, res) => {
  try {
    const ownerId = String(req.query.ownerId || "").trim();
    if (!ownerId) {
      return res.status(400).json({ message: "ownerId is required." });
    }

    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({ message: "ownerId is invalid." });
    }

    const owner = await User.findById(ownerId).lean();
    if (!owner || owner.role !== "owner" || !owner.supplierId) {
      return res.status(403).json({ message: "Owner not authorized for dashboard data." });
    }

    const payments = await Payment.find({ supplierId: owner.supplierId })
      .sort({ createdAt: -1 })
      .lean();

    const orders = payments.map((payment) => ({
      bookingId: payment.bookingId,
      customerName: payment.customerName,
      supplierId: payment.supplierId,
      quantity: payment.orderDetails?.quantity || null,
      deliveryDate: payment.orderDetails?.deliveryDate || "-",
      timeSlot: payment.orderDetails?.timeSlot || "-",
      phone: payment.orderDetails?.phone || "-",
      address: payment.orderDetails?.address || "-",
      amount: payment.grossAmount,
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId || "Pending",
      paymentStatus: payment.status,
      createdAt: payment.createdAt
    }));

    const stats = {
      totalOrders: orders.length,
      paidOrders: orders.filter((order) => order.paymentStatus === "Paid").length,
      pendingOrders: orders.filter((order) => order.paymentStatus !== "Paid").length,
      totalRevenue: orders
        .filter((order) => order.paymentStatus === "Paid")
        .reduce((sum, order) => sum + (Number(order.amount) || 0), 0)
    };

    return res.status(200).json({
      owner: {
        id: owner._id,
        name: owner.name,
        email: owner.email,
        supplierId: owner.supplierId
      },
      stats,
      orders
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error while loading owner dashboard." });
  }
});

app.use(express.static(path.join(__dirname, "../frontend")));

app.get(["/owner-login", "/owner-login/", "/owner-login.html"], (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/owner-login.html"));
});

app.get(["/owner-dashboard", "/owner-dashboard/", "/owner-dashboard.html"], (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/owner-dashboard.html"));
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

async function startServer() {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI is missing. Add it in .env file.");
    }

    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected successfully.");
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Startup error:", error.message);
    process.exit(1);
  }
}

startServer();
