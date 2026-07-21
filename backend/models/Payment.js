const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      sparse: true,
      index: true
    },
    gateway: {
      type: String,
      required: true,
      enum: ["Razorpay", "Stripe"],
      default: "Razorpay"
    },
    gatewayOrderId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    gatewayPaymentId: {
      type: String,
      sparse: true,
      index: true
    },
    gatewaySignature: {
      type: String,
      trim: true
    },
    bookingId: {
      type: String,
      required: true,
      index: true
    },
    customerName: {
      type: String,
      required: true,
      trim: true
    },
    supplierId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["UPI", "Card", "NetBanking"]
    },
    grossAmount: {
      type: Number,
      required: true,
      min: 1
    },
    platformFeePercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    platformFeeAmount: {
      type: Number,
      required: true,
      min: 0
    },
    ownerPayoutAmount: {
      type: Number,
      required: true,
      min: 0
    },
    payoutMode: {
      type: String,
      required: true,
      enum: ["direct_split", "admin_collect_and_settle"],
      default: "admin_collect_and_settle"
    },
    ownerSettlementStatus: {
      type: String,
      required: true,
      enum: ["pending", "completed", "not_required"],
      default: "pending"
    },
    bankDetails: {
      type: {
        accountHolderName: {
          type: String,
          trim: true
        },
        bankName: {
          type: String,
          trim: true
        },
        accountNumberLast4: {
          type: String,
          trim: true
        },
        ifscCode: {
          type: String,
          trim: true,
          uppercase: true
        }
      },
      default: null
    },
    orderDetails: {
      type: {
        quantity: {
          type: Number,
          min: 1
        },
        deliveryDate: {
          type: String,
          trim: true
        },
        timeSlot: {
          type: String,
          trim: true
        },
        phone: {
          type: String,
          trim: true
        },
        address: {
          type: String,
          trim: true
        }
      },
      default: null
    },
    status: {
      type: String,
      required: true,
      enum: ["Created", "Paid", "Failed"],
      default: "Created"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Payment", paymentSchema);
