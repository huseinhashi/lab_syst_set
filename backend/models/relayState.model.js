import mongoose from "mongoose";

const relayStateSchema = new mongoose.Schema(
  {
    relay1: {
      type: Boolean,
      default: false,
    },
    relay2: {
      type: Boolean,
      default: false,
    },
    relay3: {
      type: Boolean,
      default: false,
    },
    relay4: {
      type: Boolean,
      default: false,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Add index for efficient queries
relayStateSchema.index({ lastUpdated: -1 });

const RelayState = mongoose.model("RelayState", relayStateSchema);
export default RelayState; 