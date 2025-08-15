# Indian Flag Image Validator <img src="./backend//uploads//1755256558461.jpg" alt="Indian Flag" width="120"/>

## 📝 Project Description

**Indian Flag Image Validator** is a full-stack web application that allows users to upload an image of the Indian national flag (Tiranga) and validates it against the official BIS (Bureau of Indian Standards) specifications. The app checks for correct aspect ratio, color accuracy, stripe proportions, and Ashoka Chakra details, providing a detailed, user-friendly validation report.

---

## 🚀 Tech Stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express, Sharp
- **Other:** REST API, File Uploads

---

## 🗂️ Project Structure

```
indian-flag-validator/
│
├── backend/                # Node.js + Express API
│   ├── index.js            # Entry point
│   ├── flagValidator.js    # BIS validation logic
│   ├── package.json        # Backend dependencies
│   ├── uploads/            # Temporary uploaded images
│
├── frontend/               # React application
│   ├── public/             # Static files
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page components
│   │   ├── App.js          # Main App component
│   │   ├── index.js        # React entry point
│   │   └── styles/         # Tailwind styles
│   ├── package.json        # Frontend dependencies
│
└── README.md               # Project documentation
```

---

## 🌐 Frontend Setup & Usage

1. **Navigate to the frontend folder:**
   ```sh
   cd frontend
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Start the development server:**
   ```sh
   npm run dev
   ```
4. **Open your browser at** [http://localhost:5173](http://localhost:5173)  
   Upload an image and view the validation report.

---

## 🖥️ Backend Setup & Usage

1. **Navigate to the backend folder:**
   ```sh
   cd backend
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Start the backend server:**
   ```sh
   npm run dev
   ```
   The backend will run at [http://localhost:5000](http://localhost:5000) (or as configured).

---

## 🙏 Credits

- [BIS Flag Code](https://www.bis.gov.in/)
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)

---

> Made by Pratik Raj with ❤️ for India.
