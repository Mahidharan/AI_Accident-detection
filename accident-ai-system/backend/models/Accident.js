const mongoose = require("mongoose");

const accidentSchema = new mongoose.Schema(
  {
    vehicleNumber: {
      type: String,
      required: true,
    },
    location: {
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    airbagDeployed: {
      type: Boolean,
      default: false,
    },
    emailSentTo: [
      {
        type: String,
      },
    ],
    notifiedContacts: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Accident", accidentSchema);
