import express from "express";
import {
  sendSensorData,
  getRelayCommands,
  getPrayerTimes,
  getWorkingHours,
  getCurrentSensorData,
  getSensorHistory,
} from "../controllers/esp32.controller.js";

const router = express.Router();

// ESP32 endpoints (no authentication required)
router.post("/sensors", sendSensorData);
router.get("/relays", getRelayCommands);
router.get("/prayer-times", getPrayerTimes);
router.get("/working-hours", getWorkingHours);
router.get("/sensors/current", getCurrentSensorData);
router.get("/sensors/history", getSensorHistory);

export default router;
