const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Helper to normalize vehicle numbers (remove spaces and uppercase)
const normalizeVehicle = (num) => (num ? num.replace(/\s+/g, "").toUpperCase() : "");

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      vehicleNumber,
      emergencyContactEmail,
    } = req.body;

    const normalizedVehicle = normalizeVehicle(vehicleNumber);

    // Check if email already exists
    let user = await User.findOne({ email });
    if (user)
      return res
        .status(400)
        .json({ message: "User already exists with this email" });

    // Check if vehicle already registered
    user = await User.findOne({ vehicleNumber: normalizedVehicle });
    if (user)
      return res
        .status(400)
        .json({ message: "Vehicle number already registered" });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword,
      vehicleNumber: normalizedVehicle,
      emergencyContactEmail,
    });

    await user.save();

    // Generate JWT
    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET || "secret123", {
      expiresIn: "1h",
    });

    res.json({
      token,
      user: { id: user.id, name, email, vehicleNumber: normalizedVehicle, emergencyContactEmail },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid Credentials" });

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid Credentials" });

    // Generate JWT
    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET || "secret123", {
      expiresIn: "1h",
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        vehicleNumber: user.vehicleNumber,
        emergencyContactEmail: user.emergencyContactEmail,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// POST /api/auth/update-location
router.post("/update-location", async (req, res) => {
  try {
    const { vehicleNumber, latitude, longitude } = req.body;
    const normalizedVehicle = normalizeVehicle(vehicleNumber);

    if (!vehicleNumber || latitude == null || longitude == null) {
      return res.status(400).json({
        message: "vehicleNumber, latitude, and longitude are required",
      });
    }

    const user = await User.findOneAndUpdate(
      { vehicleNumber: normalizedVehicle },
      {
        lastKnownLocation: {
          latitude,
          longitude,
          updatedAt: new Date(),
        },
      },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.json({ message: "Location updated", location: user.lastKnownLocation });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// GET /api/auth/user/:vehicleNumber
router.get("/user/:vehicleNumber", async (req, res) => {
  try {
    const user = await User.findOne({
      vehicleNumber: req.params.vehicleNumber,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
