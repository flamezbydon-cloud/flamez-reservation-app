# 🔥 Flamez by Don Western Restaurant — Restaurant Guru 2026

A full-stack Western restaurant reservation web application featuring an interactive booking calendar, custom architectural floor plan for the **Main Dining Area**, and an automated SMS confirmation engine with virtual smartphone simulation and Twilio REST API support.

---

## 🏆 Restaurant Profile & Operating Hours

- **Restaurant Name**: Flamez by Don Western Restaurant - Restaurant Guru 2026
- **Accolade**: Restaurant Guru 2026 Award Winner & Recommended
- **Operating Hours**:
  - **Monday to Saturday**: 12:00 PM – 9:00 PM
  - **Kitchen Last Call**: 8:30 PM
  - **Sundays Off**: Closed every Sunday
- **Available Time Slots**: 12:00 PM to 8:00 PM in 30-minute intervals (17 available booking slots daily)

---

## 🗺️ Main Dining Area — Floor Plan & Seating Layout

The restaurant features **8 tables** configured across three dining wings:

| Section | Tables | Seating Capacity | Features & Vibe |
|---|---|---|---|
| **Left Section** | **L1**, **L2**, **L3** | 4-Seater each (Up to 4 guests) | Window views, cozy banquette seating, ambient lighting |
| **Center Section** | **C1**, **C2**, **C3** | 4-Seater each (Up to 4 guests) | Central hall, open flame grill view, steakhouse ambiance |
| **Right Section** | **R1** | **8-Seater** (Up to 8 guests) | Large party banquet table for family feasts & celebrations |
| **Right Section** | **R2** | **6-Seater** (Up to 6 guests) | Medium group dining table for parties of 5–6 |

---

## ✨ Application Features

1. **Interactive Calendar & Sunday Lockout**:
   - Month navigation with past dates disabled.
   - **Sundays Off**: Sundays are locked with clear closed indicators.
   - Quick date preset chips for instant day selection.
   - **Service Slots**: 12:00 PM to 8:00 PM with live remaining table counters and kitchen last call notice (8:30 PM).

2. **Architectural SVG Floor Plan**:
   - Visual floor plan rendered with accurate chair seating (4-seat squares, 6-seat rectangle, 8-seat grand banquet).
   - Real-time color-coded states:
     - 🟢 **Emerald**: Available and accommodates guest party size.
     - 🟡 **Gold**: Selected table.
     - 🔴 **Crimson**: Occupied / Reserved.
     - 🔘 **Muted Gray**: Table capacity incompatible with party size.
   - Toggle between **Floor Plan** view and **Table Cards Grid** view.

3. **SMS Confirmation & Two-Way Virtual Smartphone**:
   - Automated booking confirmation SMS with confirmation code `#FLZ-XXXX` and kitchen last call notice.
   - Built-in slide-out virtual phone drawer to inspect received SMS text messages without external tools.
   - Two-way SMS cancellation: Reply `CANCEL` in the virtual smartphone to cancel a reservation and receive an instant cancellation SMS receipt.
   - Optional Twilio REST API integration for real-world SMS delivery.

4. **Host Stand (Maitre D' Mode)**:
   - Live shift table occupancy and guest arrivals overview.
   - One-click guest status toggles: `Seat Party`, `Complete`, `No-Show`.
   - Walk-in guest quick reservation form.

---

## 🚀 Running the App

```bash
cd C:\Users\yeevo\.gemini\antigravity\scratch\restaurant-reservation-app
npm start
```
Visit: **http://localhost:3001**
