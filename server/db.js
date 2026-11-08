const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
const TABLES_FILE = path.join(DATA_DIR, 'tables.json');
const RESERVATIONS_FILE = path.join(DATA_DIR, 'reservations.json');
const SMS_LOGS_FILE = path.join(DATA_DIR, 'smsLogs.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory verification codes store: phone -> { code, expiresAt, verified }
const otpStore = new Map();

function safeRead(filePath, fallback = []) {
  try {
    if (!fs.existsSync(filePath)) {
      safeWrite(filePath, fallback);
      return fallback;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content || '[]');
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
    return fallback;
  }
}

function safeWrite(filePath, data) {
  try {
    const tempPath = `${filePath}.${Date.now()}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err.message);
  }
}

// Default settings if file doesn't exist
const DEFAULT_SETTINGS = {
  restaurantName: "Flamez by Don Western Restaurant - Restaurant Guru 2026",
  shortName: "Flamez by Don",
  tagline: "Western Restaurant - Restaurant Guru 2026 Award Winner",
  address: "Flamez by Don, Western Cuisine & Grill",
  phone: "(+60) 12 371 1491",
  email: "reserve@flamezbydon.com",
  operatingHours: {
    days: "Monday to Saturday (Sundays Off)",
    openTime: "12:00",
    closeTime: "21:00",
    kitchenLastCall: "20:30",
    slotIntervalMin: 30,
    lastBookingSlot: "20:00"
  },
  reservationDurationMinutes: 90,
  maxAdvanceDays: 60,
  closedDays: [0], // 0 is Sunday
  staffPasscode: "1149",
  twilio: {
    enabled: false,
    accountSid: "",
    authToken: "",
    fromPhone: ""
  }
};

function getSettings() {
  const settings = safeRead(SETTINGS_FILE, DEFAULT_SETTINGS);
  return { ...DEFAULT_SETTINGS, ...settings };
}

function updateSettings(updates) {
  const current = getSettings();
  const merged = { ...current, ...updates };
  if (updates.twilio) {
    merged.twilio = { ...current.twilio, ...updates.twilio };
  }
  safeWrite(SETTINGS_FILE, merged);
  return merged;
}

function getTables() {
  return safeRead(TABLES_FILE, []);
}

function getTableById(tableId) {
  const tables = getTables();
  return tables.find(t => t.id === tableId || t.number === Number(tableId));
}

function getReservations() {
  return safeRead(RESERVATIONS_FILE, []);
}

function getReservationsForDate(date) {
  const all = getReservations();
  return all.filter(r => r.date === date && r.status !== 'Cancelled');
}

function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// A table is considered occupied if a confirmed/seated reservation overlaps within duration minutes
function isTableAvailable(tableId, date, time, excludeReservationId = null, durationMinutes = 90) {
  const reservations = getReservationsForDate(date);
  const targetMin = parseTimeToMinutes(time);

  const overlap = reservations.find(r => {
    if (excludeReservationId && r.id === excludeReservationId) return false;
    if (r.tableId !== tableId) return false;
    if (r.status === 'Cancelled' || r.status === 'Completed') return false;

    const resMin = parseTimeToMinutes(r.time);
    // Overlap condition: |targetMin - resMin| < durationMinutes
    return Math.abs(targetMin - resMin) < durationMinutes;
  });

  return !overlap;
}

function getTableAvailabilityMap(date, time, partySize = 1) {
  const tables = getTables();
  const reservations = getReservationsForDate(date);
  const targetMin = parseTimeToMinutes(time);
  const durationMinutes = 90;

  return tables.map(table => {
    const isFit = (partySize >= table.minCapacity && partySize <= table.maxCapacity);
    const overlappingRes = reservations.find(r => {
      if (r.tableId !== table.id) return false;
      if (r.status === 'Cancelled' || r.status === 'Completed') return false;
      const resMin = parseTimeToMinutes(r.time);
      return Math.abs(targetMin - resMin) < durationMinutes;
    });

    return {
      ...table,
      isAvailable: !overlappingRes && isFit,
      isOccupied: !!overlappingRes,
      isFitPartySize: isFit,
      currentReservation: overlappingRes ? {
        id: overlappingRes.id,
        guestName: overlappingRes.guestName,
        time: overlappingRes.time,
        partySize: overlappingRes.partySize,
        confirmationCode: overlappingRes.confirmationCode
      } : null
    };
  });
}

function generateConfirmationCode() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = 'FLZ-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function createReservation(bookingData) {
  const reservations = getReservations();
  const table = getTableById(bookingData.tableId);
  if (!table) {
    throw new Error(`Table ${bookingData.tableId} not found.`);
  }

  // Double check availability
  const available = isTableAvailable(bookingData.tableId, bookingData.date, bookingData.time);
  if (!available) {
    throw new Error(`Table ${table.name} is already booked for this time slot.`);
  }

  const newReservation = {
    id: `res_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    confirmationCode: generateConfirmationCode(),
    guestName: bookingData.guestName.trim(),
    phone: bookingData.phone.trim(),
    email: (bookingData.email || '').trim(),
    date: bookingData.date,
    time: bookingData.time,
    partySize: Number(bookingData.partySize),
    tableId: table.id,
    tableName: table.name,
    zone: table.zone,
    occasion: bookingData.occasion || 'Dining',
    notes: bookingData.notes || bookingData.specialRequests || '',
    specialRequests: bookingData.notes || bookingData.specialRequests || '',
    status: 'Confirmed',
    smsNotifications: bookingData.smsNotifications !== false,
    smsStatus: 'Pending',
    createdAt: new Date().toISOString()
  };

  reservations.push(newReservation);
  safeWrite(RESERVATIONS_FILE, reservations);
  return newReservation;
}

function updateReservation(id, updates) {
  const reservations = getReservations();
  const index = reservations.findIndex(r => r.id === id || r.confirmationCode === id);
  if (index === -1) {
    throw new Error('Reservation not found.');
  }

  const existing = reservations[index];

  // If table/date/time changed, verify table availability
  if ((updates.tableId && updates.tableId !== existing.tableId) ||
      (updates.date && updates.date !== existing.date) ||
      (updates.time && updates.time !== existing.time)) {
    const tableId = updates.tableId || existing.tableId;
    const date = updates.date || existing.date;
    const time = updates.time || existing.time;
    if (!isTableAvailable(tableId, date, time, existing.id)) {
      throw new Error('Selected table is not available for the updated date/time.');
    }
  }

  const updated = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  reservations[index] = updated;
  safeWrite(RESERVATIONS_FILE, reservations);
  return updated;
}

function cancelReservation(idOrCode, reason = 'Cancelled by guest') {
  const reservations = getReservations();
  const index = reservations.findIndex(r => r.id === idOrCode || r.confirmationCode === idOrCode);
  if (index === -1) {
    throw new Error('Reservation not found.');
  }

  const reservation = reservations[index];
  reservation.status = 'Cancelled';
  reservation.cancellationReason = reason;
  reservation.cancelledAt = new Date().toISOString();

  safeWrite(RESERVATIONS_FILE, reservations);
  return reservation;
}

function getReservationByCode(code) {
  const reservations = getReservations();
  const cleaned = code.trim().toUpperCase().replace('#', '');
  return reservations.find(r => r.confirmationCode.toUpperCase() === cleaned);
}

function getReservationsByPhone(phone) {
  const reservations = getReservations();
  // Normalize phone comparison (digits only)
  const targetDigits = phone.replace(/\D/g, '');
  return reservations.filter(r => {
    const resDigits = r.phone.replace(/\D/g, '');
    return resDigits.endsWith(targetDigits) || targetDigits.endsWith(resDigits);
  });
}

function getSmsLogs() {
  const logs = safeRead(SMS_LOGS_FILE, []);
  return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function addSmsLog(logData) {
  const logs = safeRead(SMS_LOGS_FILE, []);
  const newLog = {
    id: `sms_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    status: 'Delivered',
    ...logData
  };
  logs.unshift(newLog);
  safeWrite(SMS_LOGS_FILE, logs);
  return newLog;
}

function setVerificationOtp(phone, code) {
  const normalizedPhone = phone.replace(/\D/g, '');
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  otpStore.set(normalizedPhone, { code, expiresAt, verified: false });
}

function verifyOtp(phone, inputCode) {
  const normalizedPhone = phone.replace(/\D/g, '');
  const entry = otpStore.get(normalizedPhone);
  if (!entry) {
    return { valid: false, message: 'No verification code found. Please request a new code.' };
  }
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(normalizedPhone);
    return { valid: false, message: 'Verification code expired. Please request a new code.' };
  }
  if (entry.code !== inputCode.trim()) {
    return { valid: false, message: 'Incorrect verification code. Please try again.' };
  }

  entry.verified = true;
  return { valid: true, message: 'Phone verified successfully.' };
}

module.exports = {
  getSettings,
  updateSettings,
  getTables,
  getTableById,
  getReservations,
  getReservationsForDate,
  getTableAvailabilityMap,
  isTableAvailable,
  createReservation,
  updateReservation,
  cancelReservation,
  getReservationByCode,
  getReservationsByPhone,
  getSmsLogs,
  addSmsLog,
  setVerificationOtp,
  verifyOtp
};
