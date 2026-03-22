# 🔍 Digital Footprint Analyzer

A full-stack web application that scans your email address for data breach exposure, assesses your digital security risk, and provides personalized remediation guidance.

Built as a **DBMS project** demonstrating real-world database design with Node.js, Express, and MySQL.

---

## 📸 Preview

> Enter your email → Verify via OTP → Get your full security risk report

**Features at a glance:**
- 📧 Real OTP email verification (Gmail + Nodemailer)
- 🔐 Secure OTP hashing (SHA-256, never stored in plaintext)
- 🧠 AI-powered breach analysis (Google Gemini)
- 🗄️ Full MySQL persistence across 7 relational tables
- 📊 Risk score, breach timeline, action plan & curated resources
- 🚦 Rate limiting, CORS protection & Helmet security headers

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, Vanilla JS |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Email | Nodemailer + Gmail SMTP |
| AI Analysis | Google Gemini API |
| Security | Helmet, express-rate-limit, SHA-256 hashing |

---

## 🗄️ Database Schema

7 relational tables covering the full application data model:

```
users
├── otp_verifications    (email verification with expiry & attempt tracking)
├── scan_sessions        (one row per analysis run, stores full JSON report)
│   ├── breaches         (individual breach records per session)
│   ├── exposed_data_types
│   ├── action_items     (prioritised remediation steps)
│   └── resources        (links to security tools & articles)
```

---

## 📁 Project Structure

```
footprint-backend/
├── src/
│   ├── index.js                  ← Express app entry point
│   ├── db/
│   │   ├── pool.js               ← MySQL connection pool
│   │   └── migrate.js            ← Schema migration (run once)
│   ├── routes/
│   │   ├── otp.js                ← POST /api/otp/send & /verify
│   │   └── scan.js               ← POST /api/scan/start, GET /result/:id
│   ├── controllers/
│   │   ├── otpController.js      ← OTP business logic
│   │   └── scanController.js     ← Scan orchestration & DB persistence
│   ├── services/
│   │   ├── emailService.js       ← Nodemailer / Gmail sender
│   │   └── scanService.js        ← AI-powered breach analysis
│   ├── middleware/
│   │   └── errorHandler.js       ← Global error handling
│   └── utils/
│       └── otp.js                ← OTP generation, hashing, verification
├── public/
│   └── index.html                ← Frontend UI
├── .env.example                  ← Environment variables template
├── package.json
└── README.md
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- A Gmail account with 2FA enabled
- Google Gemini API key (free at [aistudio.google.com](https://aistudio.google.com))

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/digital-footprint-analyzer.git
cd digital-footprint-analyzer/footprint-backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=footprint_db
DB_USER=root
DB_PASSWORD=your_mysql_password

GMAIL_USER=your@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

GEMINI_API_KEY=AIzaSy...

OTP_EXPIRY_MINUTES=10
OTP_MAX_ATTEMPTS=5

FRONTEND_URL=http://127.0.0.1:5500
```

### 4. Getting a Gmail App Password
1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Security → 2-Step Verification → App Passwords
3. Generate a new App Password → copy the 16-character code
4. Paste it as `GMAIL_APP_PASSWORD` in `.env`

### 5. Run database migrations
```bash
npm run db:migrate
```
This automatically creates the `footprint_db` database and all 7 tables.

### 6. Start the server
```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

Server runs at: **http://localhost:3000**

### 7. Open the frontend
Open `public/index.html` with VS Code Live Server or any static file server.

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server & DB health check |
| `POST` | `/api/otp/send` | Send OTP to email |
| `POST` | `/api/otp/verify` | Verify OTP, returns `sessionId` |
| `POST` | `/api/scan/start` | Start async AI scan |
| `GET` | `/api/scan/result/:sessionId` | Poll for scan results |
| `GET` | `/api/scan/history/:email` | All past scans for an email |

### Example Flow

```bash
# 1. Send OTP
POST /api/otp/send
{ "email": "user@example.com" }

# 2. Verify OTP
POST /api/otp/verify
{ "email": "user@example.com", "otp": "482910" }
→ returns { sessionId: "uuid-..." }

# 3. Start scan
POST /api/scan/start
{ "sessionId": "uuid-...", "email": "user@example.com" }

# 4. Poll until done
GET /api/scan/result/uuid-...
→ returns full risk report with breaches, actions, resources
```

---

## 🔒 Security Features

- **OTP hashing** — SHA-256 hashed before storage, plaintext never saved
- **Timing-safe comparison** — prevents timing attacks on OTP verification
- **Rate limiting** — max 3 OTPs per email per 10 minutes, max 5 wrong attempts
- **Helmet** — sets secure HTTP headers
- **CORS** — restricted to frontend origin only
- **Input validation** — email regex validation on all endpoints
- **Request size limit** — body capped at 10KB

---

## 🗃️ Viewing Data in MySQL

After running a scan, inspect the populated tables:

```sql
USE footprint_db;

SELECT * FROM users;
SELECT * FROM scan_sessions;
SELECT * FROM breaches;
SELECT * FROM action_items;
SELECT * FROM resources;
SELECT * FROM exposed_data_types;
SELECT * FROM otp_verifications;
```

---

## 👤 Author

**Nehal**
- GitHub: [@yourusername](https://github.com/yourusername)

---

## 📄 License

This project is for educational purposes as part of a DBMS course project.
