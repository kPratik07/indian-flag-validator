<div align="center">

# 🇮🇳 Indian Flag Image Validator

<img src="https://upload.wikimedia.org/wikipedia/en/thumb/4/41/Flag_of_India.svg/1200px-Flag_of_India.svg.png" alt="Indian Flag" width="300"/>

### *Validate Indian Flag Images Against BIS Specifications*

[![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)

</div>

---

## 📖 Description

A full-stack web application that validates Indian national flag images against official **Bureau of Indian Standards (BIS)** specifications. Checks aspect ratio, color accuracy, stripe proportions, and Ashoka Chakra details with automatic border detection.

---

## 🚀 Tech Stack

**Frontend:** React, Vite, Tailwind CSS  
**Backend:** Node.js, Express, Sharp, Jimp, Multer  
**Features:** REST API, Auto border detection, Multi-format support (JPG, PNG, SVG, WebP)

---

## 🛠️ Installation

### Prerequisites
- Node.js (v16+)
- npm

### Setup

```bash
# Clone repository
git clone https://github.com/yourusername/indian-flag-validator.git
cd indian-flag-validator

# Backend setup
cd backend
npm install
npm start  # Runs on http://localhost:5000

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev  # Runs on http://localhost:5173
```

---

## 🎯 Usage

1. Open `http://localhost:5173` in your browser
2. Upload an Indian Flag image (JPG, PNG, SVG, WebP)
3. View instant validation report with BIS compliance status
4. Get detailed feedback on all validation criteria

---

## ✅ Validation Criteria

| Criterion | Specification | Tolerance |
|-----------|--------------|-----------|
| Aspect Ratio | 3:2 (1.50) | ±3% |
| Saffron Color | #FF9933 | ±15% |
| White Color | #FFFFFF | ±15% |
| Green Color | #138808 | ±15% |
| Chakra Blue | #000080 | ±15% |
| Stripe Height | 1/3 each | ±5% |
| Chakra Position | Centered | ±10% |
| Chakra Diameter | 3/4 of white band | ±15% |
| Chakra Spokes | 24 spokes | 20-28 accepted |

---

## 📁 Project Structure

```
indian-flag-validator/
├── backend/
│   ├── controllers/flagController.js
│   ├── routes/flagRoutes.js
│   ├── services/flagValidator.js
│   └── index.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── api/flagApi.js
│   │   └── App.jsx
│   └── package.json
└── README.md
```

---

## 🙏 Credits

- [BIS Flag Code](https://www.bis.gov.in/) - Official specifications
- [React](https://react.dev/), [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), [Sharp](https://sharp.pixelplumbing.com/)

---

<div align="center">

**Made with ❤️ for India by Pratik Raj** 🇮🇳

</div>
