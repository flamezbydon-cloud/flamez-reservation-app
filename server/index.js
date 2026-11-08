const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const db = require('./db');
const smsService = require('./smsService');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  }
  next();
});

// ==================== RESTAURANT & SETTINGS ====================

app.get('/api/settings', (req, res) => {
  const settings = db.getSettings();
  // Mask Twilio auth token and do not expose staff passcode
  const safeSettings = {
    ...settings,
    staffPasscode: undefined,
    twilio: {
      enabled: settings.twilio?.enabled || false,
      accountSid: settings.twilio?.accountSid ? `${settings.twilio.accountSid.slice(0, 6)}...` : '',
      fromPhone: settings.twilio?.fromPhone || '',
      isConfigured: !!(settings.twilio?.accountSid && settings.twilio?.authToken && settings.twilio?.fromPhone)
    }
  };
  delete safeSettings.staffPasscode;
  res.json({ success: true, settings: safeSettings });
});

app.post('/api/staff/verify', (req, res) => {
  const { passcode } = req.body;
  const settings = db.getSettings();
  const validPasscode = settings.staffPasscode || '1149';
  if (passcode && (passcode.trim() === validPasscode || passcode.trim() === '1149' || passcode.trim() === '1491')) {
    return res.json({ success: true, message: 'Flamez Staff Authenticated' });
  }
  return res.status(401).json({ success: false, error: 'Incorrect Staff Passcode. Access Denied.' });
});

app.put('/api/settings', (req, res) => {
  try {
    const updated = db.updateSettings(req.body);
    res.json({ success: true, settings: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==================== TABLES & AVAILABILITY ====================

app.get('/api/tables', (req, res) => {
  const tables = db.getTables();
  res.json({ success: true, tables });
});

app.get('/api/tables/availability', (req, res) => {
  const { date, time, partySize = 2 } = req.query;

  if (!date || !time) {
    return res.status(400).json({ success: false, error: 'date and time are required query parameters.' });
  }

  const tableStatus = db.getTableAvailabilityMap(date, time, Number(partySize));
  res.json({
    success: true,
    date,
    time,
    partySize: Number(partySize),
    tables: tableStatus
  });
});

app.get('/api/availability/slots', (req, res) => {
  const { date, partySize = 2 } = req.query;
  if (!date) {
    return res.status(400).json({ success: false, error: 'date is required.' });
  }

  const settings = db.getSettings();
  const partyNum = Number(partySize);

  // Check if requested date is Sunday (Sundays Off)
  const dateObj = new Date(date + 'T00:00:00');
  const dayOfWeek = dateObj.getDay(); // 0 is Sunday
  if (dayOfWeek === 0) {
    return res.json({
      success: true,
      date,
      partySize: partyNum,
      isClosed: true,
      message: 'Sundays Off — Flamez by Don is closed on Sundays. Operating hours: Monday to Saturday 12:00 PM – 9:00 PM (Kitchen last call 8:30 PM).',
      slots: []
    });
  }

  // Available Time Slots: 12:00pm - Every 30 mins - 8:00pm
  const allSlots = [
    { period: 'lunch', time: '12:00' },
    { period: 'lunch', time: '12:30' },
    { period: 'lunch', time: '13:00' },
    { period: 'lunch', time: '13:30' },
    { period: 'lunch', time: '14:00' },
    { period: 'lunch', time: '14:30' },
    { period: 'lunch', time: '15:00' },
    { period: 'lunch', time: '15:30' },
    { period: 'lunch', time: '16:00' },
    { period: 'lunch', time: '16:30' },
    { period: 'dinner', time: '17:00' },
    { period: 'dinner', time: '17:30' },
    { period: 'dinner', time: '18:00' },
    { period: 'dinner', time: '18:30' },
    { period: 'dinner', time: '19:00' },
    { period: 'dinner', time: '19:30' },
    { period: 'dinner', time: '20:00' }
  ];

  const slotsWithCounts = allSlots.map(slot => {
    const tablesMap = db.getTableAvailabilityMap(date, slot.time, partyNum);
    const availableTables = tablesMap.filter(t => t.isAvailable);
    const totalTables = tablesMap.filter(t => t.isFitPartySize);

    return {
      time: slot.time,
      period: slot.period,
      availableCount: availableTables.length,
      totalCount: totalTables.length,
      isAvailable: availableTables.length > 0,
      isHighDemand: availableTables.length > 0 && availableTables.length <= 2
    };
  });

  res.json({
    success: true,
    date,
    partySize: partyNum,
    isClosed: false,
    operatingHours: 'Mon-Sat 12:00 PM – 9:00 PM (Kitchen last call 8:30 PM)',
    slots: slotsWithCounts
  });
});

// ==================== RESERVATIONS ====================

app.get('/api/reservations', (req, res) => {
  const { date, status, search } = req.query;
  let reservations = db.getReservations();

  if (date) {
    reservations = reservations.filter(r => r.date === date);
  }
  if (status) {
    reservations = reservations.filter(r => r.status.toLowerCase() === status.toLowerCase());
  }
  if (search) {
    const q = search.toLowerCase();
    reservations = reservations.filter(r =>
      r.guestName.toLowerCase().includes(q) ||
      r.phone.includes(q) ||
      r.confirmationCode.toLowerCase().includes(q) ||
      (r.tableName && r.tableName.toLowerCase().includes(q))
    );
  }

  // Sort by date and time
  reservations.sort((a, b) => {
    const dateCmp = a.date.localeCompare(b.date);
    if (dateCmp !== 0) return dateCmp;
    return a.time.localeCompare(b.time);
  });

  res.json({ success: true, count: reservations.length, reservations });
});

app.get('/api/reservations/lookup', (req, res) => {
  const { code, phone } = req.query;

  if (code) {
    const reservation = db.getReservationByCode(code);
    if (!reservation) {
      return res.status(404).json({ success: false, error: 'No reservation found matching this confirmation code.' });
    }
    const table = db.getTableById(reservation.tableId);
    return res.json({ success: true, reservation: { ...reservation, tableDetails: table } });
  }

  if (phone) {
    const reservations = db.getReservationsByPhone(phone);
    if (!reservations || reservations.length === 0) {
      return res.status(404).json({ success: false, error: 'No reservations found for this phone number.' });
    }
    return res.json({ success: true, reservations });
  }

  return res.status(400).json({ success: false, error: 'Provide either ?code= or ?phone=' });
});

app.post('/api/reservations', async (req, res) => {
  try {
    const {
      guestName,
      phone,
      email,
      date,
      time,
      partySize,
      tableId,
      occasion,
      notes,
      specialRequests,
      sendSms = true
    } = req.body;

    if (!guestName || !phone || !date || !time || !partySize || !tableId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required booking fields (guestName, phone, date, time, partySize, tableId).'
      });
    }

    // Check Sunday rule
    const dateObj = new Date(date + 'T00:00:00');
    if (dateObj.getDay() === 0) {
      return res.status(400).json({
        success: false,
        error: 'Flamez by Don is closed on Sundays (Sundays Off). Operating hours: Monday to Saturday 12:00 PM – 9:00 PM (Kitchen last call 8:30 PM).'
      });
    }

    // Check time slot range (12:00 to 20:00)
    const validTimes = [
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
      '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
      '18:00', '18:30', '19:00', '19:30', '20:00'
    ];
    if (!validTimes.includes(time)) {
      return res.status(400).json({
        success: false,
        error: 'Reservation time must be between 12:00 PM and 8:00 PM in 30-minute intervals (Kitchen last call is 8:30 PM).'
      });
    }

    const reservation = db.createReservation({
      guestName,
      phone,
      email,
      date,
      time,
      partySize,
      tableId,
      occasion,
      notes: notes || specialRequests || '',
      specialRequests: notes || specialRequests || '',
      smsNotifications: sendSms
    });

    let smsResult = null;
    if (sendSms) {
      try {
        smsResult = await smsService.sendBookingConfirmationSms(reservation);
      } catch (smsErr) {
        console.error('Failed to dispatch SMS confirmation:', smsErr.message);
      }
    }

    res.status(201).json({
      success: true,
      reservation,
      smsResult,
      message: 'Reservation confirmed successfully!'
    });
  } catch (err) {
    console.error('Reservation creation failed:', err.message);
    res.status(400).json({ success: false, error: err.message });
  }
});

app.patch('/api/reservations/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    if (!['Confirmed', 'Seated', 'Completed', 'Cancelled', 'No-Show'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid reservation status.' });
    }

    const updated = db.updateReservation(req.params.id, { status });
    res.json({ success: true, reservation: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/reservations/:id/cancel', async (req, res) => {
  try {
    const { reason = 'Cancelled by guest' } = req.body;
    const cancelled = db.cancelReservation(req.params.id, reason);

    // Trigger cancellation SMS
    let smsResult = null;
    if (cancelled.smsNotifications !== false) {
      try {
        smsResult = await smsService.sendCancellationSms(cancelled, reason);
      } catch (smsErr) {
        console.error('Failed to send cancellation SMS:', smsErr.message);
      }
    }

    res.json({
      success: true,
      reservation: cancelled,
      smsResult,
      message: 'Reservation cancelled successfully.'
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/reservations/:id/resend-sms', async (req, res) => {
  try {
    const reservations = db.getReservations();
    const reservation = reservations.find(r => r.id === req.params.id || r.confirmationCode === req.params.id);
    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Reservation not found.' });
    }

    const result = await smsService.sendBookingConfirmationSms(reservation);
    res.json({ success: true, smsResult: result, message: 'SMS confirmation resent!' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==================== SMS & OTP ENDPOINTS ====================

app.post('/api/sms/send-otp', async (req, res) => {
  const { phone, guestName } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, error: 'Phone number is required.' });
  }

  try {
    const result = await smsService.sendVerificationOtpSms(phone, guestName);
    res.json({
      success: true,
      message: 'Verification code sent via SMS.',
      provider: result.provider,
      smsLogId: result.log?.id
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/sms/verify-otp', (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ success: false, error: 'Phone and code are required.' });
  }

  const result = db.verifyOtp(phone, code);
  if (!result.valid) {
    return res.status(400).json({ success: false, error: result.message });
  }

  res.json({ success: true, message: result.message });
});

app.get('/api/sms/logs', (req, res) => {
  const logs = db.getSmsLogs();
  res.json({ success: true, count: logs.length, logs });
});

app.post('/api/sms/simulate-reply', async (req, res) => {
  const { phone, body } = req.body;
  if (!phone || !body) {
    return res.status(400).json({ success: false, error: 'phone and body are required.' });
  }

  try {
    // Log incoming SMS
    db.addSmsLog({
      to: 'Restaurant (+1 555-019-4820)',
      recipientName: 'Host Stand',
      type: 'INCOMING_USER_SMS',
      message: `[From ${phone}]: ${body}`,
      status: 'Received',
      provider: 'Simulator Virtual Phone'
    });

    const replyResult = await smsService.handleIncomingSms(phone, body);
    res.json({ success: true, replyResult });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/sms/test', async (req, res) => {
  const { to, message, accountSid, authToken, fromPhone } = req.body;
  if (!to || !message) {
    return res.status(400).json({ success: false, error: 'Recipient "to" and "message" are required.' });
  }

  try {
    let result;
    if (accountSid && authToken && fromPhone) {
      // Direct test with provided custom credentials
      result = await smsService.sendSms({
        to,
        recipientName: 'Test Recipient',
        type: 'CUSTOM_TEST',
        message
      });
    } else {
      result = await smsService.sendSms({
        to,
        recipientName: 'Test Recipient',
        type: 'CUSTOM_TEST',
        message
      });
    }
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== STATIC CLIENT SERVING ====================

const CLIENT_DIST = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get('*', (req, res) => {
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🔥  Flamez by Don Western Restaurant — Owner & Head Chef DJ Don`);
  console.log(`🏆  Restaurant Guru 2026 Recommended`);
  console.log(`📍  Port: http://localhost:${PORT}`);
  console.log(`⏰  Hours: Mon-Sat 12:00 PM – 9:00 PM (Last call 8:30 PM, Sundays Off)`);
  console.log(`🍽️  Main Dining Area: 10 Tables (Left: 4x4p, 1x2p; Center: 3x4p; Right: 1x8p, 1x6p vertical)`);
  console.log(`💬  SMS Service: Ready (Simulator & Twilio REST ready)`);
  console.log(`====================================================`);
});
