const express = require("express");
const router = express.Router();
const Accident = require("../models/Accident");
const User = require("../models/User");
const { findNearestServices } = require("../services/emergencyService");
const { sendEmergencyAlert } = require("../services/emailService");

// POST /api/accident/trigger
router.post("/trigger", async (req, res) => {
  try {
    const { vehicleNumber, latitude, longitude, airbagDeployed, timestamp } =
      req.body;

    if (!vehicleNumber || latitude == null || longitude == null) {
      return res.status(400).json({
        message: "vehicleNumber, latitude, and longitude are required",
      });
    }

    // Normalize vehicle number
    const normalizedVehicle = vehicleNumber.replace(/\s+/g, "").toUpperCase();

    // Find the user who registered this vehicle
    const user = await User.findOne({ vehicleNumber: normalizedVehicle });

    // Create an accident record
    const accident = new Accident({
      vehicleNumber: normalizedVehicle,
      location: { latitude, longitude },
      airbagDeployed: airbagDeployed || false,
      timestamp: timestamp || Date.now(),
    });

    // Lookup nearest emergency services
    const { nearestHospital, nearestPolice } = await findNearestServices(
      latitude,
      longitude,
    );

    // Build Google Maps link
    const mapLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
    const emailSentTo = [];
    const notifiedContacts = [];

    if (user) {
      // Professional Protocol: Send email alert to the specific management email AND the emergency contact
      const recipients = [...new Set([user.emergencyContactEmail, "ganesandeepake85@gmail.com"].filter(Boolean))];
      
      for (const recipient of recipients) {
        const sent = await sendEmergencyAlert(
          recipient,
          user.name,
          normalizedVehicle,
          airbagDeployed || false,
          mapLink,
          {
            latitude,
            longitude,
            hospitalName: nearestHospital?.name || null,
            policeName:   nearestPolice?.name   || null,
          }
        );
        if (sent) emailSentTo.push(recipient);
      }

      // Update user's last known location
      await User.findOneAndUpdate(
        { vehicleNumber: normalizedVehicle },
        { lastKnownLocation: { latitude, longitude, updatedAt: new Date() } }
      );
    }

    // 3. Log nearest hospital notification (email not applicable for services)
    if (nearestHospital) {
      const hospitalIdentifier = `Hospital: ${nearestHospital.name}`;
      notifiedContacts.push(hospitalIdentifier);
      console.log(`[ALERT] Nearest hospital notified: ${hospitalIdentifier} at ${mapLink}`);
    }

    // 4. Log nearest police notification
    if (nearestPolice) {
      const policeIdentifier = `Police: ${nearestPolice.name}`;
      notifiedContacts.push(policeIdentifier);
      console.log(`[ALERT] Nearest police notified: ${policeIdentifier} at ${mapLink}`);
    }

    accident.emailSentTo = emailSentTo;
    accident.notifiedContacts = [...emailSentTo, ...notifiedContacts];
    await accident.save();

    res.status(201).json({
      message: "Accident detected via airbag deployment. Email alerts sent.",
      accident,
      emailSentTo,
      nearestHospital,
      nearestPolice,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

// GET /api/accident/stats
router.get("/stats", async (req, res) => {
  try {
    const vehicleNumber = req.query.vehicleNumber;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayFilter = vehicleNumber
      ? { vehicleNumber, timestamp: { $gte: todayStart } }
      : { timestamp: { $gte: todayStart } };

    const alertsSent = await Accident.aggregate([
      { $match: todayFilter },
      { $project: { count: { $size: { $ifNull: ["$emailSentTo", []] } } } },
      { $group: { _id: null, total: { $sum: "$count" } } },
    ]);

    res.json({
      alertsSent: alertsSent.length > 0 ? alertsSent[0].total : 0,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

// GET /api/accident/activity
router.get("/activity", async (req, res) => {
  try {
    const vehicleNumber = req.query.vehicleNumber;

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const accidentFilter = vehicleNumber
      ? { vehicleNumber, timestamp: { $gte: oneDayAgo } }
      : { timestamp: { $gte: oneDayAgo } };

    const recentAccidents = await Accident.find(accidentFilter)
      .sort({ timestamp: -1 })
      .limit(20);

    const activities = recentAccidents.map((acc) => ({
      vehicleNumber: acc.vehicleNumber,
      airbagDeployed: acc.airbagDeployed,
      emailSentTo: acc.emailSentTo,
      location: acc.location,
      timestamp: acc.timestamp,
    }));

    res.json(activities);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

// GET /api/accident
router.get("/", async (req, res) => {
  try {
    const vehicleNumber = req.query.vehicleNumber;
    const filter = vehicleNumber ? { vehicleNumber } : {};
    const accidents = await Accident.find(filter).sort({ timestamp: -1 });
    res.json(accidents);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
