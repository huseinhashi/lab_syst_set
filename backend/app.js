import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { PORT } from "./config/env.js";
import routes from "./routes/index.js";
import connectToDatabase from "./database/db.js";
import errorMiddleware from "./middlewares/error.middleware.js";

const app = express();

// CORS configuration

const corsOptions = {
  origin: "*", // Allow all origins during development
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Mount all routes from index.js
app.use("/", routes);

// Error Middleware (should be last)
app.use(errorMiddleware);

app.get("/", (req, res) => {
  res.send("Welcome to the Lab System API!");
});

// Start server
app.listen(PORT, "0.0.0.0", async () => {
  console.log(
    `Lab System API is running on http://localhost:${PORT}`
  );
  // Connect to database
  await connectToDatabase();
});

export default app;
