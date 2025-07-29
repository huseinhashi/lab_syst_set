import express from "express";
import {
  // Relay Management
  getRelayStates,
  updateRelayStates,
  toggleRelay,
  setAllRelays,
  // Prayer Time Management
  getPrayerTimes,
  createPrayerTime,
  getPrayerTime,
  updatePrayerTime,
  deletePrayerTime,
} from "../controllers/management.controller.js";
import { isAuthenticated, isAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(isAuthenticated);

// Relay Management Routes
router.get("/relays", getRelayStates);
router.put("/relays", updateRelayStates);
router.post("/relays/toggle/:relayId", toggleRelay);
router.post("/relays/all-on", setAllRelays);
router.post("/relays/all-off", setAllRelays);

// Prayer Time Management Routes (Admin only)
router.get("/prayer-times", getPrayerTimes);
router.post("/prayer-times", isAdmin, createPrayerTime);
router.get("/prayer-times/:id", getPrayerTime);
router.put("/prayer-times/:id", isAdmin, updatePrayerTime);
router.delete("/prayer-times/:id", isAdmin, deletePrayerTime);

export default router; 