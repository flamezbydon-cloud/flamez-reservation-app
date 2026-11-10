const nodemailer = require('nodemailer');
const db = require('./db');

const RESTAURANT_EMAIL = process.env.FLAMEZ_RESTAURANT_EMAIL || 'flamezbydonreservation@gmail.com';
const GMAIL_USER = process.env.GMAIL_USER || 'flamezbydonreservation@gmail.com';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || '';

// Create transporter if password provided, otherwise use console logger
function getTransporter() {
  const pass = process.env.GMAIL_APP_PASSWORD || GMAIL_APP_PASSWORD;
  const user = process.env.GMAIL_USER || GMAIL_USER;
  if (pass) {
    // Strip any accidental spaces or quotes user might have entered
    const cleanPass = pass.replace(/\s+/g, '').replace(/["']/g, '');
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: user.trim(),
        pass: cleanPass
      }
    });
  }
  return null;
}

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

async function sendBookingConfirmationEmail(reservation) {
  const settings = db.getSettings();
  const dateNice = formatDateNice(reservation.date);
  const timeNice = formatTimeNice(reservation.time);
  const restaurantName = settings.restaurantName || 'Flamez by Don Western Restaurant';
  const phone = settings.phone || '(+60) 12 371 1491';

  // 1. Email HTML for Customer
  const customerHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0b0d13; color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
      <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 50%, #dc2626 100%); padding: 32px 24px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 24px; letter-spacing: -0.5px;">🔥 ${restaurantName}</h1>
        <p style="margin: 8px 0 0 0; color: #fef08a; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Table Reservation Confirmed</p>
      </div>

      <div style="padding: 32px 24px;">
        <p style="font-size: 16px; color: #ffffff; margin-top: 0;">Dear <strong>${reservation.guestName}</strong>,</p>
        <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">Thank you for reserving a table with us. We are looking forward to serving you our travel-inspired Western cuisine crafted by Chef DJ Don!</p>

        <div style="background-color: #151824; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid rgba(255,255,255,0.08);">
          <div style="text-align: center; padding-bottom: 16px; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.08);">
            <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Confirmation Code</span>
            <div style="font-size: 28px; font-weight: 800; color: #f59e0b; letter-spacing: 2px; margin-top: 4px;">#${reservation.confirmationCode}</div>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #94a3b8;">📅 Date:</td>
              <td style="padding: 8px 0; color: #ffffff; font-weight: 600; text-align: right;">${dateNice}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #94a3b8;">⏰ Time:</td>
              <td style="padding: 8px 0; color: #ffffff; font-weight: 600; text-align: right;">${timeNice}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #94a3b8;">👥 Guests:</td>
              <td style="padding: 8px 0; color: #ffffff; font-weight: 600; text-align: right;">${reservation.partySize} Guests</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #94a3b8;">🍽️ Table & Zone:</td>
              <td style="padding: 8px 0; color: #f59e0b; font-weight: 600; text-align: right;">${reservation.tableName} (${reservation.zone})</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #94a3b8;">✨ Occasion:</td>
              <td style="padding: 8px 0; color: #ffffff; text-align: right;">${reservation.occasion || 'Dining'}</td>
            </tr>
            ${reservation.notes ? `
            <tr>
              <td style="padding: 8px 0; color: #94a3b8; vertical-align: top;">📝 Notes:</td>
              <td style="padding: 8px 0; color: #fde68a; text-align: right;">${reservation.notes}</td>
            </tr>` : ''}
          </table>
        </div>

        <div style="background-color: rgba(249, 115, 22, 0.1); border-left: 4px solid #f97316; padding: 12px 16px; border-radius: 4px; font-size: 13px; color: #fdba74; margin-bottom: 24px;">
          📌 <strong>Important Reminder:</strong> Operating hours are Mon–Sat 12:00 PM – 9:00 PM. <strong>Kitchen last call is 8:30 PM.</strong> (Sundays Off).
        </div>

        <p style="font-size: 13px; color: #94a3b8; line-height: 1.5; margin: 0;">
          Need to make changes or have questions? Contact us directly via WhatsApp or Phone at <strong style="color: #ffffff;">${phone}</strong> or email <a href="mailto:${RESTAURANT_EMAIL}" style="color: #f59e0b;">${RESTAURANT_EMAIL}</a>.
        </p>
      </div>

      <div style="background-color: #050608; padding: 16px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid rgba(255,255,255,0.05);">
        ${restaurantName} • Reservations: ${phone}
      </div>
    </div>
  `;

  // 2. Email HTML for Flamez Restaurant Management
  const restaurantHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
      <div style="background-color: #1e293b; padding: 24px; border-bottom: 2px solid #f59e0b;">
        <span style="background-color: #f59e0b; color: #000; font-size: 11px; font-weight: 800; padding: 4px 8px; border-radius: 4px; text-transform: uppercase;">New Reservation Alert</span>
        <h2 style="margin: 12px 0 0 0; color: #ffffff; font-size: 20px;">🎉 New Booking: #${reservation.confirmationCode}</h2>
      </div>

      <div style="padding: 24px; font-size: 14px; line-height: 1.6;">
        <p style="margin-top: 0; color: #cbd5e1;">A customer has just completed a reservation on the website:</p>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background-color: #0b1120; border-radius: 8px; padding: 12px;">
          <tr>
            <td style="padding: 8px 12px; color: #94a3b8;">Guest Name:</td>
            <td style="padding: 8px 12px; color: #ffffff; font-weight: bold;">${reservation.guestName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; color: #94a3b8;">Mobile Phone:</td>
            <td style="padding: 8px 12px; color: #38bdf8; font-weight: bold;">${reservation.phone}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; color: #94a3b8;">Email Address:</td>
            <td style="padding: 8px 12px; color: #ffffff;">${reservation.email || 'None provided'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; color: #94a3b8;">Date & Time:</td>
            <td style="padding: 8px 12px; color: #f59e0b; font-weight: bold;">${dateNice} at ${timeNice}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; color: #94a3b8;">Party Size:</td>
            <td style="padding: 8px 12px; color: #ffffff; font-weight: bold;">${reservation.partySize} Guests</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; color: #94a3b8;">Table Assigned:</td>
            <td style="padding: 8px 12px; color: #10b981; font-weight: bold;">${reservation.tableName} (${reservation.zone})</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; color: #94a3b8;">Occasion:</td>
            <td style="padding: 8px 12px; color: #ffffff;">${reservation.occasion || 'Dining'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; color: #94a3b8; vertical-align: top;">Guest Notes:</td>
            <td style="padding: 8px 12px; color: #fde68a;">${reservation.notes || 'None'}</td>
          </tr>
        </table>

        <div style="margin-top: 20px; padding: 12px; background-color: #1e293b; border-radius: 8px; text-align: center;">
          <span style="color: #94a3b8; font-size: 12px;">Manage this table in the Flamez Host Stand portal using PIN <strong>1149</strong>.</span>
        </div>
      </div>
    </div>
  `;

  const transporter = getTransporter();

  if (transporter) {
    const promises = [];

    // Send to Restaurant
    promises.push(
      transporter.sendMail({
        from: `"${restaurantName}" <${GMAIL_USER}>`,
        to: RESTAURANT_EMAIL,
        subject: `[New Reservation] #${reservation.confirmationCode} - ${reservation.guestName} (${reservation.partySize} guests) on ${dateNice} @ ${timeNice}`,
        html: restaurantHtml
      })
    );

    // Send to Customer if email provided
    if (reservation.email && reservation.email.includes('@')) {
      promises.push(
        transporter.sendMail({
          from: `"${restaurantName}" <${GMAIL_USER}>`,
          to: reservation.email,
          subject: `Your Reservation Confirmation #${reservation.confirmationCode} - ${restaurantName}`,
          html: customerHtml
        })
      );
    }

    try {
      const results = await Promise.all(promises);
      console.log(`[Email] Successfully delivered reservation emails for #${reservation.confirmationCode}:`, results.map(r => r.messageId));
      return { success: true, mode: 'smtp' };
    } catch (err) {
      console.error('[Email] SMTP Error when sending via Gmail:', err);
      return { success: false, error: err.message };
    }
  } else {
    // No SMTP configured: log clearly to server console
    console.log(`\n================= [EMAIL CONFIRMATION DISPATCH] =================`);
    console.log(`To Restaurant: ${RESTAURANT_EMAIL}`);
    console.log(`To Customer: ${reservation.email || 'None'}`);
    console.log(`Booking: #${reservation.confirmationCode} - ${reservation.guestName} (${reservation.partySize}p)`);
    console.log(`Date & Time: ${dateNice} @ ${timeNice}`);
    console.log(`Table: ${reservation.tableName} (${reservation.zone})`);
    console.log(`(Configure GMAIL_APP_PASSWORD on Render to deliver live emails directly)`);
    console.log(`=================================================================\n`);
    return { success: true, mode: 'simulated' };
  }
}

module.exports = {
  sendBookingConfirmationEmail,
  RESTAURANT_EMAIL
};
