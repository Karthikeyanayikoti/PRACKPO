const suppliers = [
  {
    id: "SUP-101",
    name: "AquaPure Water Plant",
    distanceKm: 1.8,
    rating: 4.7,
    pricePerCan: 35,
    deliveryTime: "30-45 mins",
    status: "available",
    slots: ["06:00-08:00", "09:00-11:00", "14:00-16:00"]
  },
  {
    id: "SUP-102",
    name: "BlueDrop Supplies",
    distanceKm: 3.4,
    rating: 4.5,
    pricePerCan: 32,
    deliveryTime: "45-60 mins",
    status: "busy",
    slots: ["08:00-10:00", "12:00-14:00", "17:00-19:00"]
  },
  {
    id: "SUP-103",
    name: "FreshSpring Water",
    distanceKm: 4.1,
    rating: 4.2,
    pricePerCan: 30,
    deliveryTime: "60-90 mins",
    status: "available",
    slots: ["07:00-09:00", "11:00-13:00", "16:00-18:00"]
  },
  {
    id: "SUP-104",
    name: "CityTank Delivery",
    distanceKm: 5.6,
    rating: 4.0,
    pricePerCan: 28,
    deliveryTime: "90 mins",
    status: "closed",
    slots: []
  }
  ,
  {
    id: "SUP-105",
    name: "RiverFlow Bottlers",
    distanceKm: 2.7,
    rating: 4.3,
    pricePerCan: 33,
    deliveryTime: "35-50 mins",
    status: "available",
    slots: ["07:00-09:00", "11:00-13:00", "15:00-17:00"]
  },
  {
    id: "SUP-106",
    name: "PureWell Services",
    distanceKm: 6.8,
    rating: 4.1,
    pricePerCan: 29,
    deliveryTime: "80-100 mins",
    status: "available",
    slots: ["08:00-10:00", "13:00-15:00", "18:00-20:00"]
  }
];

const bookings = [
  {
    bookingId: "BK-9001",
    customer: "Ramesh",
    supplierId: "SUP-101",
    quantity: 20,
    date: "2026-02-25",
    slot: "09:00-11:00",
    payment: "UPI",
    status: "Confirmed"
  },
  {
    bookingId: "BK-9002",
    customer: "Lakshmi",
    supplierId: "SUP-102",
    quantity: 12,
    date: "2026-02-25",
    slot: "12:00-14:00",
    payment: "Card",
    status: "Pending"
  }
];

const refs = {
  authSection: document.getElementById("authSection"),
  appShell: document.getElementById("appShell"),
  authTitle: document.getElementById("authTitle"),
  customerAuthBtn: document.getElementById("customerAuthBtn"),
  ownerAuthBtn: document.getElementById("ownerAuthBtn"),
  signInTabBtn: document.getElementById("signInTabBtn"),
  signUpTabBtn: document.getElementById("signUpTabBtn"),
  authForm: document.getElementById("authForm"),
  authSubmitBtn: document.getElementById("authSubmitBtn"),
  authEmail: document.getElementById("authEmail"),
  authPassword: document.getElementById("authPassword"),
  authName: document.getElementById("authName"),
  nameRow: document.getElementById("nameRow"),
  ownerSupplierRow: document.getElementById("ownerSupplierRow"),
  ownerSupplierAuth: document.getElementById("ownerSupplierAuth"),
  authStatus: document.getElementById("authStatus"),
  welcomeName: document.getElementById("welcomeName"),
  customerModeBtn: document.getElementById("customerModeBtn"),
  ownerModeBtn: document.getElementById("ownerModeBtn"),
  customerSection: document.getElementById("customerSection"),
  ownerSection: document.getElementById("ownerSection"),
  locationInput: document.getElementById("locationInput"),
  searchBtn: document.getElementById("searchBtn"),
  detectBtn: document.getElementById("detectBtn"),
  locationStatus: document.getElementById("locationStatus"),
  supplierList: document.getElementById("supplierList"),
  comparisonBox: document.getElementById("comparisonBox"),
  selectedSupplier: document.getElementById("selectedSupplier"),
  quantity: document.getElementById("quantity"),
  deliveryDate: document.getElementById("deliveryDate"),
  timeSlot: document.getElementById("timeSlot"),
  phone: document.getElementById("phone"),
  address: document.getElementById("address"),
  bankDetailsBlock: document.getElementById("bankDetailsBlock"),
  accountHolderName: document.getElementById("accountHolderName"),
  bankName: document.getElementById("bankName"),
  accountNumber: document.getElementById("accountNumber"),
  confirmAccountNumber: document.getElementById("confirmAccountNumber"),
  ifscCode: document.getElementById("ifscCode"),
  totalAmount: document.getElementById("totalAmount"),
  bookingForm: document.getElementById("bookingForm"),
  proceedPaymentBtn: document.getElementById("proceedPaymentBtn"),
  bookingStatus: document.getElementById("bookingStatus"),
  orderSlipCard: document.getElementById("orderSlipCard"),
  orderSlipContent: document.getElementById("orderSlipContent"),
  paymentModal: document.getElementById("paymentModal"),
  paymentSummary: document.getElementById("paymentSummary"),
  paymentForm: document.getElementById("paymentForm"),
  paymentStatus: document.getElementById("paymentStatus"),
  cancelPaymentBtn: document.getElementById("cancelPaymentBtn"),
  payNowBtn: document.getElementById("payNowBtn"),
  bookingTableBody: document.getElementById("bookingTableBody"),
  ownerStats: document.getElementById("ownerStats"),
  ownerSupplier: document.getElementById("ownerSupplier"),
  ownerStatus: document.getElementById("ownerStatus"),
  availabilityForm: document.getElementById("availabilityForm"),
  ownerStatusMsg: document.getElementById("ownerStatusMsg")
};

let selectedSupplierId = null;
let authMode = "signin";
let authRole = "customer";
let currentUserName = "Customer";
let currentUserRole = "customer";
let currentOwnerSupplierId = null;
let userPrivateLocation = null;
let pendingBookingDraft = null;
const API_BASE = window.location.origin.includes("localhost:5000") ? "" : "http://localhost:5000";

function formatAreaFromReverseGeocode(result) {
  const area = result.locality || result.city || result.principalSubdivision || "";
  const country = result.countryName || "";

  if (area && country) return `${area}, ${country}`;
  if (area) return area;
  if (country) return country;
  return "Current Area";
}

async function getAreaFromCoordinates(latitude, longitude) {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&localityLanguage=en`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Unable to fetch area name from current location.");
  }

  const data = await response.json();
  return formatAreaFromReverseGeocode(data);
}

function currency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

function getSupplierById(id) {
  return suppliers.find((supplier) => supplier.id === id);
}

function setMessage(element, text, type = "info") {
  if (!element) return;
  element.textContent = text;
  if (type === "success") element.style.color = "#0f9d58";
  else if (type === "error") element.style.color = "#d92d20";
  else element.style.color = "#667085";
}

function switchAuthMode(mode) {
  authMode = mode;
  const isSignIn = mode === "signin";

  refs.signInTabBtn.classList.toggle("active", isSignIn);
  refs.signUpTabBtn.classList.toggle("active", !isSignIn);
  refs.signInTabBtn.setAttribute("aria-selected", String(isSignIn));
  refs.signUpTabBtn.setAttribute("aria-selected", String(!isSignIn));

  refs.authTitle.textContent = `${authRole === "owner" ? "Owner" : "User"} ${isSignIn ? "Sign In" : "Sign Up"}`;
  refs.authSubmitBtn.textContent = isSignIn ? "Sign In" : "Create Account";
  refs.nameRow.classList.toggle("hidden", isSignIn);
  refs.ownerSupplierRow.classList.toggle("hidden", !(authRole === "owner" && !isSignIn));
}

function switchAuthRole(role) {
  authRole = role === "owner" ? "owner" : "customer";
  const isOwner = authRole === "owner";

  refs.customerAuthBtn.classList.toggle("active", !isOwner);
  refs.ownerAuthBtn.classList.toggle("active", isOwner);
  refs.customerAuthBtn.setAttribute("aria-selected", String(!isOwner));
  refs.ownerAuthBtn.setAttribute("aria-selected", String(isOwner));
  switchAuthMode(authMode);
}

function openAppForUser(user) {
  currentUserName = user?.name || "Customer";
  currentUserRole = user?.role || "customer";
  currentOwnerSupplierId = user?.supplierId || null;

  if (currentUserRole === "owner") {
    localStorage.setItem("ownerSession", JSON.stringify({
      id: user?.id,
      name: user?.name,
      email: user?.email,
      supplierId: user?.supplierId
    }));
    window.location.href = "/owner-dashboard.html";
    return;
  }

  refs.welcomeName.textContent = `Welcome, ${currentUserName}`;
  refs.authSection.classList.add("hidden");
  refs.appShell.classList.remove("hidden");

  const isOwner = currentUserRole === "owner";
  refs.customerModeBtn.classList.toggle("hidden", isOwner);
  refs.ownerModeBtn.classList.toggle("hidden", !isOwner);

  if (isOwner) {
    if (currentOwnerSupplierId) {
      refs.ownerSupplier.value = currentOwnerSupplierId;
    }
    refs.ownerSupplier.disabled = true;
    switchMode("owner");
  } else {
    refs.ownerSupplier.disabled = false;
    switchMode("customer");
  }

  renderBookingTable();
  renderOwnerStats();
}

async function authRequest(path, payload) {
  let response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    throw new Error("Cannot reach server. Start backend and MongoDB, then try again.");
  }

  const rawText = await response.text();
  let data = null;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch (error) {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.message || rawText || "Authentication failed.");
  }

  return data;
}

async function createPaymentOrder(payload) {
  let response;

  try {
    response = await fetch(`${API_BASE}/api/payments/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    throw new Error("Cannot create payment order now. Please check server connection.");
  }

  const rawText = await response.text();
  let data = null;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch (error) {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.message || rawText || "Unable to create payment order.");
  }

  return data;
}

async function verifyPayment(payload) {
  let response;

  try {
    response = await fetch(`${API_BASE}/api/payments/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    throw new Error("Cannot verify payment now. Please check server connection.");
  }

  const rawText = await response.text();
  let data = null;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch (error) {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.message || rawText || "Payment verification failed.");
  }

  return data;
}

function getGatewayMethodConfig(method) {
  if (method === "UPI") {
    return { upi: true, card: true, netbanking: true, wallet: true, paylater: true, emi: false };
  }
  if (method === "Card") {
    return { upi: false, card: true, netbanking: false, wallet: false, paylater: false, emi: false };
  }
  if (method === "NetBanking") {
    return { upi: false, card: false, netbanking: true, wallet: false, paylater: false, emi: false };
  }
  return { upi: true, card: false, netbanking: false, wallet: false, paylater: false, emi: false };
}

function supportsUpiIntentFlow() {
  const ua = navigator.userAgent || "";
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
}

function launchRazorpayCheckout({ keyId, order, customerName, paymentMethod, phone, bankDetails, bookingId }) {
  return new Promise((resolve, reject) => {
    if (!window.Razorpay) {
      reject(new Error("Razorpay Checkout SDK not loaded. Refresh page and try again."));
      return;
    }

    let settled = false;
    const complete = (cb) => (value) => {
      if (settled) return;
      settled = true;
      cb(value);
    };

    const options = {
      key: keyId,
      amount: order.amount,
      currency: order.currency,
      name: "Smart Water Supply Booking",
      description: `Water booking payment (${bookingId})`,
      order_id: order.id,
      method: getGatewayMethodConfig(paymentMethod),
      prefill: {
        name: customerName,
        contact: phone
      },
      theme: {
        color: "#1163ff"
      },
      modal: {
        ondismiss: () => {
          complete(reject)(new Error("Payment cancelled by user."));
        }
      },
      handler: async (response) => {
        try {
          const verifyResult = await verifyPayment({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            bookingId,
            paymentMethod,
            bankDetails
          });
          complete(resolve)(verifyResult);
        } catch (error) {
          complete(reject)(error);
        }
      }
    };

    if (paymentMethod === "UPI") {
      options.method = { upi: true, card: true, netbanking: true, wallet: true, paylater: true, emi: false };
      options.upi = {
        flow: supportsUpiIntentFlow() ? "intent" : "qr"
      };
      options.config = {
        display: {
          sequence: ["block.upi", "block.other"],
          blocks: {
            upi: {
              name: "Pay via UPI",
              instruments: [{ method: "upi" }]
            },
            other: {
              name: "Other methods",
              instruments: [{ method: "card" }, { method: "netbanking" }, { method: "wallet" }]
            }
          }
        }
      };
    }

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (response) => {
      const description = response?.error?.description || "Payment failed at gateway.";
      if (description.toLowerCase().includes("no appropriate payment method found")) {
        complete(reject)(new Error("UPI is not available for this order/device. Ensure UPI is enabled in Razorpay Dashboard and try on mobile with PhonePe/GPay/Paytm, or use UPI QR."));
        return;
      }
      if (description.toLowerCase().includes("temporary technical issue") && paymentMethod === "UPI") {
        complete(reject)(new Error("UPI is temporarily unavailable for this Razorpay account/key or gateway route. Enable UPI in Razorpay Dashboard for this mode (Test/Live), then retry. Until then, use Card/NetBanking."));
        return;
      }
      complete(reject)(new Error(description));
    });

    rzp.open();
  });
}

function renderSuppliers(list = suppliers) {
  refs.supplierList.innerHTML = "";

  list.forEach((supplier) => {
    const card = document.createElement("article");
    card.className = "supplier-card";

    card.innerHTML = `
      <div class="supplier-top">
        <div>
          <h3>${supplier.name}</h3>
          <p class="muted">${supplier.id}</p>
        </div>
        <span class="badge ${supplier.status}">${supplier.status.toUpperCase()}</span>
      </div>
      <p><strong>Distance:</strong> ${supplier.distanceKm} km</p>
      <p><strong>Rating:</strong> ⭐ ${supplier.rating}</p>
      <p><strong>Price:</strong> ₹${supplier.pricePerCan} / 20L can</p>
      <p><strong>Delivery ETA:</strong> ${supplier.deliveryTime}</p>
      <button class="btn ghost" data-supplier-id="${supplier.id}" ${supplier.status === "closed" ? "disabled" : ""}>Select Supplier</button>
    `;

    refs.supplierList.appendChild(card);
  });
}

function renderComparison(supplierId) {
  const supplier = getSupplierById(supplierId);

  if (!supplier) {
    refs.comparisonBox.innerHTML = '<p class="muted">No supplier selected yet.</p>';
    return;
  }

  refs.comparisonBox.innerHTML = `
    <div class="compare-item"><span>Supplier</span><strong>${supplier.name}</strong></div>
    <div class="compare-item"><span>Distance</span><strong>${supplier.distanceKm} km</strong></div>
    <div class="compare-item"><span>Rating</span><strong>⭐ ${supplier.rating}</strong></div>
    <div class="compare-item"><span>Price Per Can</span><strong>₹${supplier.pricePerCan}</strong></div>
    <div class="compare-item"><span>Delivery ETA</span><strong>${supplier.deliveryTime}</strong></div>
    <div class="compare-item"><span>Status</span><strong>${supplier.status.toUpperCase()}</strong></div>
  `;
}

function fillSlotOptions(supplierId) {
  refs.timeSlot.innerHTML = '<option value="">Select slot</option>';

  const supplier = getSupplierById(supplierId);
  if (!supplier) return;

  supplier.slots.forEach((slot) => {
    const option = document.createElement("option");
    option.value = slot;
    option.textContent = slot;
    refs.timeSlot.appendChild(option);
  });
}

function updateTotal() {
  const supplier = getSupplierById(selectedSupplierId);
  const quantity = Number(refs.quantity.value || 0);

  if (!supplier || quantity <= 0) {
    refs.totalAmount.textContent = currency(0);
    return;
  }

  refs.totalAmount.textContent = currency(quantity * supplier.pricePerCan);
}

function getSelectedPaymentMethod() {
  return document.querySelector('input[name="paymentMethod"]:checked')?.value || "UPI";
}

function toggleBankDetailsFields() {
  const selectedPayment = getSelectedPaymentMethod();
  const requiresBankDetails = selectedPayment === "NetBanking";

  refs.bankDetailsBlock.classList.toggle("hidden", !requiresBankDetails);

  [
    refs.accountHolderName,
    refs.bankName,
    refs.accountNumber,
    refs.confirmAccountNumber,
    refs.ifscCode
  ].forEach((input) => {
    input.required = requiresBankDetails;
    if (!requiresBankDetails) input.value = "";
  });
}

function collectBankDetails() {
  return {
    accountHolderName: refs.accountHolderName.value.trim(),
    bankName: refs.bankName.value.trim(),
    accountNumber: refs.accountNumber.value.trim(),
    confirmAccountNumber: refs.confirmAccountNumber.value.trim(),
    ifscCode: refs.ifscCode.value.trim().toUpperCase()
  };
}

function validateBankDetails(selectedPayment) {
  if (selectedPayment !== "NetBanking") {
    return { ok: true, details: null };
  }

  const details = collectBankDetails();
  const onlyDigits = /^\d{9,18}$/;
  const ifscPattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;

  if (!details.accountHolderName || !details.bankName || !details.accountNumber || !details.confirmAccountNumber || !details.ifscCode) {
    return { ok: false, message: "Please fill all bank details for Net Banking." };
  }

  if (!onlyDigits.test(details.accountNumber)) {
    return { ok: false, message: "Account number must be 9 to 18 digits." };
  }

  if (details.accountNumber !== details.confirmAccountNumber) {
    return { ok: false, message: "Account number and confirm account number do not match." };
  }

  if (!ifscPattern.test(details.ifscCode)) {
    return { ok: false, message: "Please enter a valid IFSC code." };
  }

  return {
    ok: true,
    details: {
      accountHolderName: details.accountHolderName,
      bankName: details.bankName,
      accountNumber: details.accountNumber,
      ifscCode: details.ifscCode
    }
  };
}

function resetPaymentModule() {
  refs.paymentForm.reset();
  toggleBankDetailsFields();
  setMessage(refs.paymentStatus, "");
}

function openPaymentModule(bookingDraft, amount) {
  pendingBookingDraft = { ...bookingDraft, amount };
  refs.paymentSummary.textContent = `${bookingDraft.customer} -> ${refs.selectedSupplier.value} | ${bookingDraft.quantity} cans | ${bookingDraft.date} ${bookingDraft.slot} | Total ${currency(amount)}`;
  refs.paymentModal.classList.remove("hidden");
  refs.paymentModal.setAttribute("aria-hidden", "false");
  resetPaymentModule();
}

function closePaymentModule() {
  refs.paymentModal.classList.add("hidden");
  refs.paymentModal.setAttribute("aria-hidden", "true");
  pendingBookingDraft = null;
  resetPaymentModule();
}

function renderOrderSlip(booking, paymentDetails) {
  if (!booking || !paymentDetails) return;

  const supplier = getSupplierById(booking.supplierId);
  const orderDateTime = `${booking.date} ${booking.slot}`;

  refs.orderSlipContent.innerHTML = `
    <div class="compare-item"><span>Slip No</span><strong>${booking.bookingId}</strong></div>
    <div class="compare-item"><span>Customer</span><strong>${booking.customer}</strong></div>
    <div class="compare-item"><span>Supplier</span><strong>${supplier ? supplier.name : booking.supplierId}</strong></div>
    <div class="compare-item"><span>Date & Time</span><strong>${orderDateTime}</strong></div>
    <div class="compare-item"><span>Delivery Place</span><strong>${booking.address || "-"}</strong></div>
    <div class="compare-item"><span>Phone</span><strong>${booking.phone || "-"}</strong></div>
    <div class="compare-item"><span>Quantity</span><strong>${booking.quantity} cans</strong></div>
    <div class="compare-item"><span>Payment Method</span><strong>${booking.payment}</strong></div>
    <div class="compare-item"><span>Total Money</span><strong>${currency(booking.amount || paymentDetails.grossAmount)}</strong></div>
    <div class="compare-item"><span>Transaction Id</span><strong>${paymentDetails.transactionId || "Pending"}</strong></div>
    <div class="compare-item"><span>Status</span><strong>${booking.status}</strong></div>
  `;

  refs.orderSlipCard.classList.remove("hidden");
}

function startPaymentFromBooking() {
  if (!selectedSupplierId) {
    setMessage(refs.bookingStatus, "Please select a supplier before booking.", "error");
    return;
  }

  const supplier = getSupplierById(selectedSupplierId);
  const quantityValue = Number(refs.quantity.value);
  const totalAmount = Number((quantityValue * (supplier?.pricePerCan || 0)).toFixed(2));

  if (!Number.isFinite(quantityValue) || quantityValue < 1) {
    setMessage(refs.bookingStatus, "Please enter a valid quantity.", "error");
    return;
  }

  const nextBooking = {
    bookingId: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
    customer: currentUserName,
    supplierId: selectedSupplierId,
    quantity: quantityValue,
    date: refs.deliveryDate.value,
    slot: refs.timeSlot.value,
    payment: "Pending",
    status: "Confirmed"
  };

  setMessage(refs.bookingStatus, "Opening payment interface...");
  openPaymentModule(nextBooking, totalAmount);
}

function switchMode(mode) {
  const isCustomer = mode === "customer";
  refs.customerSection.classList.toggle("active", isCustomer);
  refs.ownerSection.classList.toggle("active", !isCustomer);

  refs.customerModeBtn.classList.toggle("active", isCustomer);
  refs.ownerModeBtn.classList.toggle("active", !isCustomer);

  refs.customerModeBtn.setAttribute("aria-selected", String(isCustomer));
  refs.ownerModeBtn.setAttribute("aria-selected", String(!isCustomer));
}

function renderBookingTable() {
  refs.bookingTableBody.innerHTML = "";

  const visibleBookings = currentUserRole === "owner" && currentOwnerSupplierId
    ? bookings.filter((booking) => booking.supplierId === currentOwnerSupplierId)
    : bookings;

  visibleBookings
    .slice()
    .reverse()
    .forEach((booking) => {
      const supplier = getSupplierById(booking.supplierId);
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${booking.bookingId}</td>
        <td>${booking.customer}</td>
        <td>${supplier ? supplier.name : booking.supplierId}</td>
        <td>${booking.quantity} cans</td>
        <td>${booking.date}</td>
        <td>${booking.slot}</td>
        <td>${booking.phone || "-"}</td>
        <td>${booking.address || "-"}</td>
        <td>${currency(booking.amount || ((supplier?.pricePerCan || 0) * (booking.quantity || 0)))}</td>
        <td>${booking.payment}</td>
        <td>${booking.status}</td>
      `;

      refs.bookingTableBody.appendChild(row);
    });
}

function renderOwnerStats() {
  const ownerBookings = currentUserRole === "owner" && currentOwnerSupplierId
    ? bookings.filter((booking) => booking.supplierId === currentOwnerSupplierId)
    : bookings;

  const total = ownerBookings.length;
  const pending = ownerBookings.filter((booking) => booking.status === "Pending").length;
  const confirmed = ownerBookings.filter((booking) => booking.status === "Confirmed").length;
  const today = new Date().toISOString().slice(0, 10);
  const todaysOrders = ownerBookings.filter((booking) => booking.date === today).length;

  const stats = [
    { label: "Total Bookings", value: total },
    { label: "Confirmed", value: confirmed },
    { label: "Pending", value: pending },
    { label: "Today's Orders", value: todaysOrders }
  ];

  refs.ownerStats.innerHTML = stats
    .map(
      (stat) => `
        <div class="stat-card">
          <h3>${stat.label}</h3>
          <p>${stat.value}</p>
        </div>`
    )
    .join("");
}

function renderOwnerSupplierOptions() {
  const options = suppliers
    .map((supplier) => `<option value="${supplier.id}">${supplier.name}</option>`)
    .join("");

  refs.ownerSupplier.innerHTML = options;
  refs.ownerSupplierAuth.innerHTML = `<option value="">Select your plant</option>${options}`;
}

function attachEvents() {
  refs.customerAuthBtn.addEventListener("click", () => {
    switchAuthRole("customer");
    setMessage(refs.authStatus, "");
  });

  refs.ownerAuthBtn.addEventListener("click", () => {
    switchAuthRole("owner");
    setMessage(refs.authStatus, "");
  });

  refs.signInTabBtn.addEventListener("click", () => {
    switchAuthMode("signin");
    setMessage(refs.authStatus, "");
  });

  refs.signUpTabBtn.addEventListener("click", () => {
    switchAuthMode("signup");
    setMessage(refs.authStatus, "");
  });

  refs.authForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = refs.authEmail.value.trim();
    const password = refs.authPassword.value.trim();
    const name = refs.authName.value.trim();
    const supplierId = refs.ownerSupplierAuth.value;

    if (!email || !password) {
      setMessage(refs.authStatus, "Email and password are required.", "error");
      return;
    }

    if (authMode === "signup" && !name) {
      setMessage(refs.authStatus, "Full name is required for sign up.", "error");
      return;
    }

    if (authMode === "signup" && authRole === "owner" && !supplierId) {
      setMessage(refs.authStatus, "Please select your water plant for owner registration.", "error");
      return;
    }

    refs.authSubmitBtn.disabled = true;

    try {
      if (authMode === "signup") {
        const signupResult = await authRequest("/api/auth/signup", {
          name,
          email,
          password,
          role: authRole,
          supplierId: authRole === "owner" ? supplierId : null
        });
        setMessage(refs.authStatus, signupResult.message || "Account created successfully.", "success");
        openAppForUser(signupResult?.user || { name, role: authRole, supplierId });
      } else {
        const signinResult = await authRequest("/api/auth/signin", { email, password, role: authRole });
        setMessage(refs.authStatus, signinResult.message || "Sign in successful.", "success");
        openAppForUser(signinResult?.user || { name: email.split("@")[0], role: authRole });
      }
    } catch (error) {
      setMessage(refs.authStatus, error.message || "Unable to authenticate. Please try again.", "error");
    } finally {
      refs.authSubmitBtn.disabled = false;
    }
  });

  refs.customerModeBtn.addEventListener("click", () => switchMode("customer"));
  refs.ownerModeBtn.addEventListener("click", () => switchMode("owner"));

  refs.searchBtn.addEventListener("click", () => {
    const query = refs.locationInput.value.trim();

    if (!query && !userPrivateLocation) {
      setMessage(refs.locationStatus, "Please enter an area to search.", "error");
      return;
    }

    const filtered = suppliers
      .slice()
      .sort((a, b) => a.distanceKm - b.distanceKm);

    renderSuppliers(filtered);
    const searchTarget = query || "Current Area";
    setMessage(refs.locationStatus, `Showing nearby suppliers for: ${searchTarget}`, "success");
  });

  refs.detectBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      setMessage(refs.locationStatus, "Geolocation is not supported in this browser.", "error");
      return;
    }

    setMessage(refs.locationStatus, "Detecting your location...", "info");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        userPrivateLocation = { latitude, longitude, accuracy };

        let detectedArea = "Current Area";
        try {
          detectedArea = await getAreaFromCoordinates(latitude, longitude);
        } catch (error) {
          detectedArea = "Current Area";
        }

        refs.locationInput.value = detectedArea;
        const shuffled = suppliers.slice().sort((a, b) => a.distanceKm - b.distanceKm);
        renderSuppliers(shuffled);
        setMessage(refs.locationStatus, `Location detected: ${detectedArea}. Exact coordinates are kept private.`, "success");
      },
      () => {
        userPrivateLocation = null;
        setMessage(refs.locationStatus, "Could not access location. Please enter area manually.", "error");
      }
    );
  });

  refs.supplierList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-supplier-id]");
    if (!button) return;

    selectedSupplierId = button.getAttribute("data-supplier-id");
    const supplier = getSupplierById(selectedSupplierId);

    refs.selectedSupplier.value = supplier ? supplier.name : "";
    renderComparison(selectedSupplierId);
    fillSlotOptions(selectedSupplierId);
    updateTotal();
    setMessage(refs.bookingStatus, "Supplier selected. Complete the booking details.");
  });

  refs.quantity.addEventListener("input", updateTotal);
  document.querySelectorAll('input[name="paymentMethod"]').forEach((input) => {
    input.addEventListener("change", toggleBankDetailsFields);
  });

  refs.bookingForm.addEventListener("submit", (event) => {
    event.preventDefault();
    startPaymentFromBooking();
  });

  refs.proceedPaymentBtn.addEventListener("click", () => {
    startPaymentFromBooking();
  });

  refs.cancelPaymentBtn.addEventListener("click", () => {
    closePaymentModule();
    setMessage(refs.bookingStatus, "Payment was cancelled. You can continue editing booking details.");
  });

  refs.paymentForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!pendingBookingDraft) {
      setMessage(refs.paymentStatus, "No booking data found. Please retry from booking form.", "error");
      return;
    }

    const phoneValue = refs.phone.value.trim();
    if (!/^\d{10}$/.test(phoneValue)) {
      setMessage(refs.paymentStatus, "Please enter a valid 10-digit mobile number in booking details.", "error");
      return;
    }

    const addressValue = refs.address.value.trim();
    if (!refs.deliveryDate.value || !refs.timeSlot.value || !addressValue) {
      setMessage(refs.paymentStatus, "Please complete delivery date, slot and address in booking details.", "error");
      return;
    }

    pendingBookingDraft.date = refs.deliveryDate.value;
    pendingBookingDraft.slot = refs.timeSlot.value;
    pendingBookingDraft.phone = phoneValue;
    pendingBookingDraft.address = addressValue;

    const selectedPayment = getSelectedPaymentMethod();
    if (!["UPI", "Card", "NetBanking"].includes(selectedPayment)) {
      setMessage(refs.paymentStatus, "Please choose a valid payment method.", "error");
      return;
    }

    if (selectedPayment === "UPI" && !supportsUpiIntentFlow()) {
      setMessage(refs.paymentStatus, "Mobile UPI apps may not open directly here. Razorpay will show UPI QR so you can pay from PhonePe/GPay/Paytm.", "info");
    }

    const bankValidation = validateBankDetails(selectedPayment);
    if (!bankValidation.ok) {
      setMessage(refs.paymentStatus, bankValidation.message, "error");
      return;
    }

    refs.payNowBtn.disabled = true;

    try {
      const orderResult = await createPaymentOrder({
        bookingId: pendingBookingDraft.bookingId,
        customerName: pendingBookingDraft.customer,
        supplierId: pendingBookingDraft.supplierId,
        paymentMethod: selectedPayment,
        amount: pendingBookingDraft.amount,
        bankDetails: bankValidation.details,
        orderDetails: {
          quantity: pendingBookingDraft.quantity,
          deliveryDate: pendingBookingDraft.date,
          timeSlot: pendingBookingDraft.slot,
          phone: pendingBookingDraft.phone,
          address: pendingBookingDraft.address
        }
      });

      setMessage(refs.paymentStatus, "Opening secure payment gateway...");

      const paymentResult = await launchRazorpayCheckout({
        keyId: orderResult.gateway.keyId,
        order: orderResult.order,
        customerName: pendingBookingDraft.customer,
        paymentMethod: selectedPayment,
        phone: phoneValue,
        bankDetails: bankValidation.details,
        bookingId: pendingBookingDraft.bookingId
      });

      pendingBookingDraft.payment = selectedPayment;
      bookings.push(pendingBookingDraft);
      renderBookingTable();
      renderOwnerStats();

      const split = paymentResult.payment;
      const bankSummary =
        split.paymentMethod === "NetBanking" && split.bankDetails?.bankName && split.bankDetails?.accountNumberLast4
          ? `, Bank: ${split.bankDetails.bankName} (${split.bankDetails.accountNumberLast4})`
          : "";
      const payoutSummary =
        split.payoutMode === "direct_split"
          ? "Direct split: owner and admin shares settled via gateway"
          : "Full payment collected in admin account; owner share marked for separate transfer";
      setMessage(
        refs.bookingStatus,
        `Payment successful (${split.transactionId}). Website fee: ${currency(split.platformFeeAmount)}, Owner payout: ${currency(split.ownerPayoutAmount)}${bankSummary}. ${payoutSummary}. Booking ${pendingBookingDraft.bookingId} confirmed!`,
        "success"
      );
      renderOrderSlip(pendingBookingDraft, split);

      closePaymentModule();

      refs.bookingForm.reset();
      refs.selectedSupplier.value = getSupplierById(selectedSupplierId)?.name || "";
      refs.quantity.value = 1;
      fillSlotOptions(selectedSupplierId);
      updateTotal();
    } catch (error) {
      setMessage(refs.paymentStatus, error.message || "Payment failed. Please try again.", "error");
    } finally {
      refs.payNowBtn.disabled = false;
    }
  });

  refs.availabilityForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const supplier = getSupplierById(refs.ownerSupplier.value);
    if (!supplier) return;

    supplier.status = refs.ownerStatus.value;
    renderSuppliers();
    if (selectedSupplierId === supplier.id) renderComparison(selectedSupplierId);

    setMessage(refs.ownerStatusMsg, `${supplier.name} marked as ${supplier.status.toUpperCase()}.`, "success");
  });
}

function initialize() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  refs.deliveryDate.min = new Date().toISOString().slice(0, 10);
  refs.deliveryDate.value = tomorrow.toISOString().slice(0, 10);

  renderSuppliers();
  renderComparison();
  renderBookingTable();
  renderOwnerStats();
  renderOwnerSupplierOptions();
  updateTotal();
  switchAuthRole("customer");
  toggleBankDetailsFields();
  attachEvents();
}

initialize();
