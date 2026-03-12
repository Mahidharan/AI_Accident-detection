/**
 * Email notification service using the EmailJS REST API (via axios).
 *
 * Required .env variables:
 *   EMAILJS_SERVICE_ID     – your EmailJS service ID
 *   EMAILJS_TEMPLATE_ID    – your emergency alert template ID
 *   EMAILJS_PUBLIC_KEY     – EmailJS public key (user_id)
 */

const axios = require('axios');

const SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
const TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY  = process.env.EMAILJS_PUBLIC_KEY;

const isConfigured = SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY;

if (isConfigured) {
  console.log('[EMAIL SERVICE] EmailJS configured – emails will be sent.');
} else {
  console.log('[EMAIL SERVICE] EmailJS not configured – logging only.');
}

/**
 * Send an emergency accident alert email to the emergency contact.
 * @param {string}  toEmail         – emergency contact email
 * @param {string}  ownerName       – vehicle owner's name
 * @param {string}  vehicleNumber
 * @param {boolean} airbagDeployed
 * @param {string}  mapLink         – Google Maps location URL
 * @param {Object}  extras          – optional: { hospitalName, policeName, latitude, longitude }
 * @returns {boolean} true on success
 */
const sendEmergencyAlert = async (toEmail, ownerName, vehicleNumber, airbagDeployed, mapLink, extras = {}) => {
  const now = new Date();
  const formattedTime = now.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: true,
  });

  const templateParams = {
    to_email:         toEmail,
    owner_name:       ownerName,
    vehicle_number:   vehicleNumber,
    airbag_deployed:  airbagDeployed ? 'YES – Airbag Deployed' : 'No airbag deployment',
    map_link:         mapLink,
    alert_time:       formattedTime,
    latitude:         extras.latitude  != null ? extras.latitude.toFixed(6)  : 'N/A',
    longitude:        extras.longitude != null ? extras.longitude.toFixed(6) : 'N/A',
    nearest_hospital: extras.hospitalName || 'Locating nearest hospital…',
    nearest_police:   extras.policeName   || 'Locating nearest station…',
  };

  console.log(`\n${'='.repeat(50)}`);
  console.log(`[EMAIL] 🚨 Sending emergency alert`);
  console.log(`[EMAIL]   → To:      ${toEmail}`);
  console.log(`[EMAIL]   → Vehicle: ${vehicleNumber}`);
  console.log(`[EMAIL]   → Time:    ${formattedTime}`);
  console.log(`[EMAIL]   → Airbag:  ${templateParams.airbag_deployed}`);
  console.log(`[EMAIL]   → Map:     ${mapLink}`);
  console.log(`${'='.repeat(50)}\n`);

  if (!isConfigured) {
    console.warn('[EMAIL] Not configured – skipping send (mock success).');
    return true;
  }

  try {
    const response = await axios.post(
      'https://api.emailjs.com/api/v1.0/email/send',
      {
        service_id:      SERVICE_ID,
        template_id:     TEMPLATE_ID,
        user_id:         PUBLIC_KEY,
        template_params: templateParams,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'origin': process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
        },
      }
    );
    console.log(`[EMAIL] ✅ Alert delivered! Status: ${response.status} – ${response.data}`);
    return true;
  } catch (err) {
    console.error(`[EMAIL] ❌ EmailJS API error – Status: ${err.response?.status}`);
    console.error(`[EMAIL]    Response: ${JSON.stringify(err.response?.data)}`);
    return false;
  }
};

module.exports = { sendEmergencyAlert };
