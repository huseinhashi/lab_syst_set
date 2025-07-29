import mongoose from "mongoose";

const prayerTimeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Prayer name is required"],
      trim: true,
      unique: true,
    },
    hour: {
      type: Number,
      required: [true, "Hour is required"],
      min: [0, "Hour must be between 0 and 23"],
      max: [23, "Hour must be between 0 and 23"],
    },
    minute: {
      type: Number,
      required: [true, "Minute is required"],
      min: [0, "Minute must be between 0 and 59"],
      max: [59, "Minute must be between 0 and 59"],
    },
    duration: {
      type: Number,
      required: [true, "Duration is required"],
      min: [1, "Duration must be at least 1 minute"],
      max: [120, "Duration cannot exceed 120 minutes"],
      default: 30,
    },
  },
  { timestamps: true }
);

// Add index for efficient queries
prayerTimeSchema.index({ hour: 1, minute: 1 });

const PrayerTime = mongoose.model("PrayerTime", prayerTimeSchema);
export default PrayerTime; 