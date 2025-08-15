# Indian Flag Image Validator – Backend

## Overview

This backend service validates images of the Indian national flag (Tiranga) against BIS (Bureau of Indian Standards) specifications. It checks for aspect ratio, color accuracy, stripe proportions, and Ashoka Chakra details, returning a detailed JSON report with pass/fail status, reasons, severity, and tips for correction.

---

## Features

- **Image Upload API**: Accepts PNG, JPG, SVG, and WEBP images (max 5MB)
- **Aspect Ratio Check**: Ensures 3:2 ratio (±1%)
- **Color Accuracy**: Saffron, White, Green, and Chakra Blue (±5% RGB tolerance, configurable)
- **Stripe Proportion**: Each band must be 1/3 of flag height
- **Ashoka Chakra**: Checks diameter, centering, and spoke count (should be 24)
- **Detailed JSON Report**: Includes summary, severity, reasons, and tips for fixing issues

---

## Setup & Installation

1. **Clone the repository**

   ```sh
   git clone <your-repo-url>
   cd indian-flag-validator/backend
   ```

2. **Install dependencies**

   ```sh
   npm install
   ```

3. **Start the server**
   ```sh
   npm run dev
   # or
   node index.js
   ```
   The server runs on `http://localhost:5000` by default.

---

## API Usage

### **POST** `/api/validate-flag`

- **Body:** `form-data`
  - Key: `flag` (type: File)
  - Value: (select your flag image)
- **Response:** JSON validation report

#### **Example using curl:**

```sh
curl -X POST http://localhost:5000/api/validate-flag \
  -F "flag=@/path/to/your/flag-image.png"
```

#### **Example Response:**

```json
{
  "summary": {
    "status": "fail",
    "reasons": ["Saffron color deviation is too high.", ...],
    "tip": "See the above reasons and tips to fix your flag image. Refer to BIS specs for details: https://bis.gov.in/"
  },
  "aspect_ratio": { "status": "pass", "actual": "1.50", "message": "Aspect ratio is within 1% of 3:2." },
  "colors": {
    "saffron": { "status": "fail", "deviation": "19.9%", "message": "Saffron color deviates by 19.9%.", "severity": "major", "tip": "Ensure the top band is a vibrant orange (#FF9933). Avoid faded or reddish tones." },
    ...
  },
  "stripe_proportion": { "status": "pass", "top": "0.33", "middle": "0.33", "bottom": "0.33", "message": "Each stripe should be exactly 1/3 of the flag's height.", "severity": "none" },
  "chakra_position": { "status": "fail", "offset_x": "44px", "offset_y": "7px", "diameter": "34px", "message": "Chakra is off-center by 44px (x), 7px (y) or diameter is off.", "severity": "major", "tip": "Ensure the chakra is perfectly centered and its diameter is 3/4 of the white band height." },
  "chakra_spokes": { "status": "fail", "detected": 8, "message": "Chakra has 8 spokes (should be 24).", "severity": "major", "tip": "Ensure the chakra has exactly 24 evenly spaced spokes." }
}
```

---

## Competition Highlights

- **Fast**: Processes images in under 3 seconds
- **Robust**: Handles any resolution, flat/solid-color flags
- **Helpful**: Gives actionable tips for correcting non-compliant flags
- **Configurable**: Color tolerance can be easily adjusted in `flagValidator.js`

---

## Notes

- Only flat, solid-color flags are supported (no folds/shading)
- Max image size: 5MB
- For best results, use high-quality, BIS-compliant flag images

---

## License

MIT (or as per your project)
