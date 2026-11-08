const BASE_URL = '/api';

export const api = {
  // Settings
  async getSettings() {
    const res = await fetch(`${BASE_URL}/settings`);
    if (!res.ok) throw new Error('Failed to load settings');
    return res.json();
  },

  async updateSettings(data) {
    const res = await fetch(`${BASE_URL}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  // Tables & Availability
  async getTables() {
    const res = await fetch(`${BASE_URL}/tables`);
    if (!res.ok) throw new Error('Failed to fetch tables');
    return res.json();
  },

  async getTableAvailability(date, time, partySize) {
    const params = new URLSearchParams({ date, time, partySize });
    const res = await fetch(`${BASE_URL}/tables/availability?${params}`);
    if (!res.ok) throw new Error('Failed to fetch table availability');
    return res.json();
  },

  async getTimeSlots(date, partySize) {
    const params = new URLSearchParams({ date, partySize });
    const res = await fetch(`${BASE_URL}/availability/slots?${params}`);
    if (!res.ok) throw new Error('Failed to fetch time slots');
    return res.json();
  },

  // Reservations
  async createReservation(data) {
    const res = await fetch(`${BASE_URL}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create reservation');
    return json;
  },

  async getReservations(filters = {}) {
    const params = new URLSearchParams(filters);
    const res = await fetch(`${BASE_URL}/reservations?${params}`);
    if (!res.ok) throw new Error('Failed to fetch reservations');
    return res.json();
  },

  async lookupByCode(code) {
    const res = await fetch(`${BASE_URL}/reservations/lookup?code=${encodeURIComponent(code)}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Reservation not found');
    return json;
  },

  async lookupByPhone(phone) {
    const res = await fetch(`${BASE_URL}/reservations/lookup?phone=${encodeURIComponent(phone)}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'No reservations found');
    return json;
  },

  async cancelReservation(id, reason) {
    const res = await fetch(`${BASE_URL}/reservations/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to cancel reservation');
    return json;
  },

  async updateStatus(id, status) {
    const res = await fetch(`${BASE_URL}/reservations/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update status');
    return json;
  },

  async resendSms(id) {
    const res = await fetch(`${BASE_URL}/reservations/${id}/resend-sms`, {
      method: 'POST'
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to resend SMS');
    return json;
  },

  // SMS & OTP
  async sendOtp(phone, guestName) {
    const res = await fetch(`${BASE_URL}/sms/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, guestName })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to send OTP');
    return json;
  },

  async verifyOtp(phone, code) {
    const res = await fetch(`${BASE_URL}/sms/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Verification failed');
    return json;
  },

  async getSmsLogs() {
    const res = await fetch(`${BASE_URL}/sms/logs`);
    if (!res.ok) throw new Error('Failed to fetch SMS logs');
    return res.json();
  },

  async simulateReply(phone, body) {
    const res = await fetch(`${BASE_URL}/sms/simulate-reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, body })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Simulation failed');
    return json;
  },

  async testSms(payload) {
    const res = await fetch(`${BASE_URL}/sms/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'SMS test failed');
    return json;
  },

  // Staff Authentication
  async verifyStaffPasscode(passcode) {
    const res = await fetch(`${BASE_URL}/staff/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Incorrect passcode');
    return json;
  }
};
