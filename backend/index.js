const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const flagRoutes = require("./routes/flagRoutes");

const app = express();

// Allowed origins (local + production frontend + all Vercel preview URLs)
const allowedOrigins = [
  "http://localhost:5173",
  "https://indian-flag-validator-frontend.vercel.app", // Replace with your actual Vercel frontend URL if different
];

// CORS config
app.use(
  cors({
    origin: function (origin, callback) {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        /^https:\/\/indian-flag-validator-frontend.*\.vercel\.app$/.test(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use("/api", flagRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
