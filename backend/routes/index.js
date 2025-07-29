import express from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import esp32Routes from "./esp32.routes.js";
import managementRoutes from "./management.routes.js";

const router = express.Router();

// API Routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/esp32", esp32Routes);
router.use("/management", managementRoutes);

export default router;
