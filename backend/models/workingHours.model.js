import mongoose from "mongoose";

const workingHoursSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      default: "Working Hours"
    },
    startHour: {
      type: Number,
      required: [true, "Start hour is required"],
      min: [0, "Start hour cannot be negative"],
      max: [23, "Start hour cannot exceed 23"],
    },
    startMinute: {
      type: Number,
      required: [true, "Start minute is required"],
      min: [0, "Start minute cannot be negative"],
      max: [59, "Start minute cannot exceed 59"],
    },
    endHour: {
      type: Number,
      required: [true, "End hour is required"],
      min: [0, "End hour cannot be negative"],
      max: [23, "End hour cannot exceed 23"],
    },
    endMinute: {
      type: Number,
      required: [true, "End minute is required"],
      min: [0, "End minute cannot be negative"],
      max: [59, "End minute cannot exceed 59"],
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Add index for efficient queries
workingHoursSchema.index({ isActive: 1, createdAt: -1 });

const WorkingHours = mongoose.model("WorkingHours", workingHoursSchema);
export default WorkingHours;
