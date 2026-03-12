/**
 * SMS notification service using Twilio
 * Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in .env
 * Falls back to console logging if Twilio is not configured.
 */

let twilioClient = null;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  const twilio = require("twilio");
  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN,
  );
  console.log(
    "[SMS SERVICE] Twilio configured - SMS will be sent to real phone numbers.",
  );
} else {
  console.log(
    "[SMS SERVICE] Twilio not configured - SMS will be logged to console only.",
  );
}

/**
 * Send an SMS alert to a phone number
 * @param {string} to - Recipient phone number (e.g., +919876543210)
 * @param {string} message - Message body
 * @returns {boolean} Success status
 */
const sendAlert = async (to, message) => {
  console.log(`\n========================================`);
  console.log(`[SMS] Sending alert to: ${to}`);
  console.log(`[MESSAGE]:\n${message}`);
  console.log(`========================================\n`);

  // Only attempt Twilio if configured and 'to' looks like a phone number
  if (
    twilioClient &&
    twilioPhone &&
    /^\+?\d{10,15}$/.test(to.replace(/\s/g, ""))
  ) {
    try {
      const result = await twilioClient.messages.create({
        body: message,
        from: twilioPhone,
        to: to.replace(/\s/g, ""),
      });
      console.log(`[SMS] Twilio message sent. SID: ${result.sid}`);
      return true;
    } catch (err) {
      console.error(`[SMS] Twilio error: ${err.message}`);
      return false;
    }
  }

  // Mock fallback for non-phone targets or when Twilio isn't configured
  return true;
};

module.exports = {
  sendAlert,
};
