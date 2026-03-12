# 🚀 Quickstart Guide: AI Accident Management System

This guide will help you get the system up and running in minutes.

---

## 1. Prerequisites
- **Node.js** (v18+)
- **Python** (v3.9+)
- **MongoDB** (Local or Atlas)
- **EmailJS Account** (For alerts)

---

## 2. Setting Up the Backend
1. Open a terminal in `backend/`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file (copy from `.env.example` if available) and add:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `EMAILJS_SERVICE_ID`
   - `EMAILJS_TEMPLATE_ID`
   - `EMAILJS_PUBLIC_KEY`
4. Start the server:
   ```bash
   npm run dev
   ```

---

## 3. Setting Up the Frontend
1. Open a terminal in `frontend/`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the UI:
   ```bash
   npm run dev
   ```
4. Access the website at `http://localhost:5173`

---

## 4. Setting Up the AI Engine (Python)
1. Open a terminal in `ai_engine/`
2. Install dependencies:
   ```bash
   pip install opencv-python numpy requests geocoder
   ```

---

## 5. Running the System
1. **Register/Login**: Go to the website and register a user. Take note of your **Vehicle Number**.
2. **Configure EmailJS**: Ensure your EmailJS template 'To Email' field uses `{{to_email}}`.
3. **Trigger Detection**: Run the Python script with your vehicle number:
   ```bash
   python accident_detection.py YOUR_VEHICLE_NUMBER_HERE
   ```
   *Example: `python accident_detection.py TN42BA6524`*

---

## 🏎️ Features
- **Auto-Normalization**: Spaces and lowercase in vehicle numbers are handled automatically.
- **Dual Alerts**: Alerts are sent to both your emergency contact and `ganesandeepake85@gmail.com`.
- **Real-time Detection**: Uses video analysis to detect airbag deployment.
