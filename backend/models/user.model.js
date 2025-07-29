import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minLength: 6,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Static method to seed admin user
userSchema.statics.seedAdmin = async function () {
  try {
    // Check if admin already exists
    const adminExists = await this.findOne({ role: "admin" });
    
    if (!adminExists) {
      // Create default admin
      const admin = await this.create({
        username: "admin",
        email: "admin@gmail.com",
        password: "123456",
        role: "admin",
      });
      
      console.log("✅ Default admin created:", admin.email);
      return admin;
    }
    
    console.log("ℹ️ Admin already exists, skipping seed");
    return adminExists;
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
    throw error;
  }
};

const User = mongoose.model("User", userSchema);

// Seed admin when model is imported
User.seedAdmin().catch(console.error);

export default User;
