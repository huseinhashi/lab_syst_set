import mongoose from "mongoose";

const sensorDataSchema = new mongoose.Schema(
  {
    temperature: {
      type: Number,
      required: [true, "Temperature is required"],
      min: [-50, "Temperature cannot be below -50°C"],
      max: [100, "Temperature cannot be above 100°C"],
    },
    humidity: {
      type: Number,
      required: [true, "Humidity is required"],
      min: [0, "Humidity cannot be negative"],
      max: [100, "Humidity cannot exceed 100%"],
    },
    lightLevel: {
      type: Number,
      required: [true, "Light level is required"],
      enum: [0, 1], // 0 = night, 1 = day
    },
    flameStatus: {
      type: Number,
      required: [true, "Flame status is required"],
      enum: [0, 1], // 0 = no flame, 1 = flame detected
    },
  },
  { timestamps: true }
);

// Add index for efficient queries by timestamp
sensorDataSchema.index({ createdAt: -1 });

const SensorData = mongoose.model("SensorData", sensorDataSchema);
export default SensorData; 