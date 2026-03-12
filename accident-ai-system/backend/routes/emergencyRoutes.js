const express = require('express');
const router = express.Router();
const { findNearestServices } = require('../services/emergencyService');

// GET /api/emergency/nearby?lat=&lon=
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const services = await findNearestServices(parseFloat(lat), parseFloat(lon));
    
    res.json(services);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
