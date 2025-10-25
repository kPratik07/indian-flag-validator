const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const flagRoutes = require("./routes/flagRoutes");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  /^https:\/\/indian-flag-validator.*\.vercel\.app$/, 
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (
        !origin ||
        allowedOrigins.some((o) =>
          o instanceof RegExp ? o.test(origin) : o === origin
        )
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS: " + origin));
      }
    },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", flagRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
