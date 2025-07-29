import SensorData from "../models/sensorData.model.js";
import RelayState from "../models/relayState.model.js";
import PrayerTime from "../models/prayerTime.model.js";

// Send sensor data from ESP32
export const sendSensorData = async (req, res, next) => {
  try {
    const { temperature, humidity, lightLevel } = req.body;

    // Validate required fields
    if (temperature === undefined || humidity === undefined || lightLevel === undefined) {
      return res.status(400).json({
        success: false,
        message: "Temperature, humidity, and lightLevel are required",
      });
    }

    // Delete all existing sensor data (keep only latest)
    await SensorData.deleteMany({});

    // Create new sensor data
    const sensorData = await SensorData.create({
      temperature,
      humidity,
      lightLevel,
    });

    res.status(200).json({
      success: true,
      message: "Sensor data received successfully",
      data: sensorData,
    });
  } catch (error) {
    next(error);
  }
};

// Get current sensor data
export const getCurrentSensorData = async (req, res, next) => {
  try {
    const sensorData = await SensorData.findOne().sort({ createdAt: -1 });

    if (!sensorData) {
      return res.status(404).json({
        success: false,
        message: "No sensor data available",
      });
    }

    res.status(200).json({
      success: true,
      data: sensorData,
    });
  } catch (error) {
    next(error);
  }
};

// Get sensor history (optional, for debugging)
export const getSensorHistory = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const sensorData = await SensorData.find()
      .sort({ createdAt: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      data: sensorData,
    });
  } catch (error) {
    next(error);
  }
};

// Get relay commands for ESP32
export const getRelayCommands = async (req, res, next) => {
  try {
    let relayState = await RelayState.findOne().sort({ lastUpdated: -1 });

    // If no relay state exists, create a default one
    if (!relayState) {
      relayState = await RelayState.create({
        relay1: false,
        relay2: false,
        relay3: false,
        relay4: false,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        relay1: relayState.relay1,
        relay2: relayState.relay2,
        relay3: relayState.relay3,
        relay4: relayState.relay4,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get prayer times for ESP32
export const getPrayerTimes = async (req, res, next) => {
  try {
    const prayerTimes = await PrayerTime.find().sort({ hour: 1, minute: 1 });

    res.status(200).json({
      success: true,
      data: prayerTimes,
    });
  } catch (error) {
    next(error);
  }
}; 