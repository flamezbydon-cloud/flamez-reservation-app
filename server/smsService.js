const https = require('https');
const db = require('./db');

function formatDateNice(dateStr) {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    }
  } catch (e) {}
  return dateStr;
}

function formatTimeNice(timeStr) {
  try {
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    const displayM = m < 10 ? `0${m}` : m;
    return `${displayH}:${displayM} ${ampm}`;
  } catch (e) {
    return timeStr;
  }
}

// Send SMS via Twilio REST API using standard https
async function sendTwilioSms({ accountSid, authToken, from, to, body }) {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams({
      To: to,
      From: from,
      Body: body
    }).toString();

    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const options = {
      hostname: 'api.twilio.com',
      port: 443,
      path: `/2010-04-01/Accounts/${accountSid}/Messages.json`,
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, sid: parsed.sid, response: parsed });
          } else {
            reject(new Error(parsed.message || `Twilio error HTTP ${res.statusCode}`));
          }
        } catch (err) {
          reject(new Error(`Failed to parse Twilio response: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

// Main SMS Dispatcher
async function sendSms({ to, recipientName, type, message, reservationId = null }) {
  const settings = db.getSettings();
  const twilioConfig = settings.twilio || {};
  let provider = 'Simulator';
  let deliveryStatus = 'Delivered';
  let twilioSid = null;
  let twilioError = null;

  // If real Twilio is configured and enabled
  if (twilioConfig.enabled && twilioConfig.accountSid && twilioConfig.authToken && twilioConfig.fromPhone) {
    try {
      provider = 'Twilio';
      const twilioRes = await sendTwilioSms({
        accountSid: twilioConfig.accountSid,
        authToken: twilioConfig.authToken,
        from: twilioConfig.fromPhone,
        to: to,
        body: message
      });
      twilioSid = twilioRes.sid;
      deliveryStatus = 'Delivered (Twilio)';
    } catch (err) {
      console.warn('Twilio API delivery failed; falling back to Simulator:', err.message);
      twilioError = err.message;
      provider = 'Simulator (Twilio Fallback)';
      deliveryStatus = `Delivered (Simulated: ${err.message.substring(0, 40)}...)`;
    }
  }

  const logEntry = db.addSmsLog({
    reservationId,
    to,
    recipientName: recipientName || 'Valued Guest',
    type,
    message,
    status: deliveryStatus,
    provider,
    twilioSid,
    twilioError
  });

  return {
    success: true,
    provider,
    status: deliveryStatus,
    log: logEntry,
    message
  };
}

// Generate & Send Confirmation SMS
async function sendBookingConfirmationSms(reservation) {
  const settings = db.getSettings();
  const brand = settings.shortName || settings.restaurantName || "Flamez by Don";
  const dateNice = formatDateNice(reservation.date);
  const timeNice = formatTimeNice(reservation.time);
  
  const text = `${brand}: Your reservation for ${reservation.partySize} on ${dateNice} at ${timeNice} (${reservation.tableName} - ${reservation.zone}) is CONFIRMED! Code: #${reservation.confirmationCode}. Kitchen last call is 8:30 PM. Reply CANCEL to cancel or call ${settings.phone}.`;

  const result = await sendSms({
    to: reservation.phone,
    recipientName: reservation.guestName,
    type: 'CONFIRMATION',
    message: text,
    reservationId: reservation.id
  });

  // Update reservation SMS status
  db.updateReservation(reservation.id, { smsStatus: 'Delivered' });

  return result;
}

// Send OTP Verification SMS
async function sendVerificationOtpSms(phone, guestName = 'Guest') {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  db.setVerificationOtp(phone, otp);

  const settings = db.getSettings();
  const brand = settings.shortName || settings.restaurantName || "Flamez by Don";
  const text = `${brand}: Your reservation verification code is ${otp}. Valid for 10 minutes. Enter this code to confirm your table.`;

  return sendSms({
    to: phone,
    recipientName: guestName,
    type: 'OTP_VERIFICATION',
    message: text
  });
}

// Send Cancellation Notice SMS
async function sendCancellationSms(reservation, reason = 'guest request') {
  const settings = db.getSettings();
  const brand = settings.shortName || settings.restaurantName || "Flamez by Don";
  const dateNice = formatDateNice(reservation.date);
  const timeNice = formatTimeNice(reservation.time);

  const text = `${brand}: Reservation #${reservation.confirmationCode} for ${reservation.partySize} guests on ${dateNice} at ${timeNice} has been CANCELLED (${reason}). We hope to welcome you another time!`;

  return sendSms({
    to: reservation.phone,
    recipientName: reservation.guestName,
    type: 'CANCELLATION',
    message: text,
    reservationId: reservation.id
  });
}

// Handle simulated incoming SMS from guest (e.g. replying CANCEL)
async function handleIncomingSms(phone, body) {
  const trimmed = body.trim().toUpperCase();
  const settings = db.getSettings();
  const brand = settings.shortName || settings.restaurantName || "Flamez by Don";

  if (trimmed === 'CANCEL' || trimmed.startsWith('CANCEL ')) {
    // Find active reservation for this phone
    const reservations = db.getReservationsByPhone(phone).filter(r => r.status === 'Confirmed');
    if (reservations.length === 0) {
      return sendSms({
        to: phone,
        recipientName: 'Guest',
        type: 'INCOMING_REPLY',
        message: `${brand}: No active reservation found for ${phone} to cancel. For help, call ${settings.phone}.`
      });
    }

    // Cancel latest active reservation
    const target = reservations[0];
    db.cancelReservation(target.id, 'Cancelled via SMS Reply');
    return sendCancellationSms(target, 'via SMS reply');
  }

  // Generic automated assistance response
  return sendSms({
    to: phone,
    recipientName: 'Guest',
    type: 'INCOMING_REPLY',
    message: `${brand}: Received your message. Operating hours: Mon-Sat 12 PM - 9 PM (Kitchen last call 8:30 PM, Sundays off). To cancel your reservation reply CANCEL, or contact our host stand at ${settings.phone}.`
  });
}

module.exports = {
  sendSms,
  sendBookingConfirmationSms,
  sendVerificationOtpSms,
  sendCancellationSms,
  handleIncomingSms,
  formatDateNice,
  formatTimeNice
};
