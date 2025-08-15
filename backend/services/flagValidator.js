const sharp = require("sharp");
const Jimp = require("jimp");
const path = require("path");

// ---- Config ----
const COLOR_TOLERANCE = 5; // % for color deviations
const RATIO_TOLERANCE = 1; // % for 3:2 aspect
const STRIPE_TOLERANCE = 2; // % for 1/3 each stripe
const CENTER_TOLERANCE = 2; // % of width/white-band height for chakra centering
const DIAMETER_TOLERANCE = 10; // % for 3/4 diameter

// ---- Helpers ----
function withinTolerance(actual, expected, percent) {
  return Math.abs(actual - expected) <= expected * (percent / 100);
}

function colorDeviation(rgb1, rgb2) {
  const dr = rgb1.r - rgb2.r;
  const dg = rgb1.g - rgb2.g;
  const db = rgb1.b - rgb2.b;
  const dist = Math.sqrt(dr * dr + dg * dg + db * db);
  const maxDist = Math.sqrt(3 * 255 * 255);
  return Number(((dist / maxDist) * 100).toFixed(1)); // number, not string
}

const TARGET = {
  saffron: { r: 255, g: 153, b: 51 }, // #FF9933
  white: { r: 255, g: 255, b: 255 }, // #FFFFFF
  green: { r: 19, g: 136, b: 8 }, // #138808
  chakra: { r: 0, g: 0, b: 128 }, // #000080
};

const COLOR_TIPS = {
  saffron:
    "Ensure the top band is #FF9933 (vibrant saffron). Avoid faded/reddish tones.",
  white:
    "The middle band should be pure white (#FFFFFF). Avoid gray/off-white shades.",
  green:
    "The bottom band should be deep green (#138808). Avoid yellowish/light greens.",
  chakra:
    "Ashoka Chakra should be navy blue (#000080), not purple or light blue.",
};

// Rasterize anything Jimp can’t read directly (e.g., webp/svg) into a PNG buffer.
// SVG is rasterized at higher density for accuracy.
async function loadImageForJimp(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".svg") {
    const buffer = await sharp(filePath, { density: 300 }).png().toBuffer();
    return Jimp.read(buffer);
  }
  if (ext === ".webp") {
    const buffer = await sharp(filePath).png().toBuffer();
    return Jimp.read(buffer);
  }
  // others: jpg/png…
  const buffer = await sharp(filePath).toBuffer();
  return Jimp.read(buffer);
}

// Classify a row’s average color as one of saffron/white/green
function classifyRowColor({ r, g, b }) {
  const dist = (a) => colorDeviation({ r, g, b }, a);
  const dS = dist(TARGET.saffron);
  const dW = dist(TARGET.white);
  const dG = dist(TARGET.green);
  if (dS <= dW && dS <= dG) return "saffron";
  if (dG <= dS && dG <= dW) return "green";
  return "white";
}

// Average RGB over an inclusive x-range of a given y row
function averageRowRGB(img, y, x0, x1) {
  const { bitmap } = img;
  const w = bitmap.width;
  const start = Math.max(0, Math.floor(x0));
  const end = Math.min(w - 1, Math.floor(x1));
  let r = 0,
    g = 0,
    b = 0,
    n = 0;
  for (let x = start; x <= end; x++) {
    const c = Jimp.intToRGBA(img.getPixelColor(x, y));
    r += c.r;
    g += c.g;
    b += c.b;
    n++;
  }
  if (!n) return { r: 0, g: 0, b: 0 };
  return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) };
}

async function validate(filePath) {
  const reasons = [];
  let overallStatus = "pass";

  // Dimensions from Sharp (fast)
  const meta = await sharp(filePath).metadata();
  const width = meta.width;
  const height = meta.height;

  // 1) Aspect ratio 3:2 ±1%
  const aspect = width / height;
  const expected = 3 / 2;
  const aspectOK = withinTolerance(aspect, expected, RATIO_TOLERANCE);
  if (!aspectOK) {
    reasons.push("Aspect ratio is not 3:2 (±1%).");
    overallStatus = "fail";
  }

  // 2) Stripe detection & colors from pixels
  const j = await loadImageForJimp(filePath);
  const midX0 = Math.floor(width * 0.25);
  const midX1 = Math.floor(width * 0.75);

  // Classify each row
  const rowLabels = new Array(height);
  for (let y = 0; y < height; y++) {
    const rgb = averageRowRGB(j, y, midX0, midX1);
    rowLabels[y] = classifyRowColor(rgb);
  }

  // Compress into runs (label, startY, endY)
  const runs = [];
  let cur = rowLabels[0];
  let start = 0;
  for (let y = 1; y < height; y++) {
    if (rowLabels[y] !== cur) {
      runs.push({ label: cur, y0: start, y1: y - 1 });
      cur = rowLabels[y];
      start = y;
    }
  }
  runs.push({ label: cur, y0: start, y1: height - 1 });

  // Expect pattern: saffron → white → green (top to bottom)
  // Find the best contiguous triple matching that order with max total height.
  let best = null;
  for (let i = 0; i + 2 < runs.length; i++) {
    const a = runs[i],
      b = runs[i + 1],
      c = runs[i + 2];
    if (a.label === "saffron" && b.label === "white" && c.label === "green") {
      const hA = a.y1 - a.y0 + 1;
      const hB = b.y1 - b.y0 + 1;
      const hC = c.y1 - c.y0 + 1;
      const tot = hA + hB + hC;
      if (!best || tot > best.tot) {
        best = { a, b, c, hA, hB, hC, tot };
      }
    }
  }

  let stripe_proportion;
  if (!best) {
    stripe_proportion = {
      status: "fail",
      top: "0.00",
      middle: "0.00",
      bottom: "0.00",
      message: "Could not detect saffron/white/green bands in order.",
      severity: "major",
      tip: "Use a flat flag with clear horizontal bands (no folds/filters).",
    };
    reasons.push("Stripe heights are not detected as 1/3 each.");
    overallStatus = "fail";
  } else {
    const topP = best.hA / height;
    const midP = best.hB / height;
    const botP = best.hC / height;
    const passTop = withinTolerance(topP, 1 / 3, STRIPE_TOLERANCE);
    const passMid = withinTolerance(midP, 1 / 3, STRIPE_TOLERANCE);
    const passBot = withinTolerance(botP, 1 / 3, STRIPE_TOLERANCE);
    const stripeOK = passTop && passMid && passBot;

    stripe_proportion = {
      status: stripeOK ? "pass" : "fail",
      top: topP.toFixed(2),
      middle: midP.toFixed(2),
      bottom: botP.toFixed(2),
      message: "Each stripe should be exactly 1/3 of the flag height.",
      severity: stripeOK ? "none" : "major",
      tip: stripeOK
        ? undefined
        : "Resize/crop so each band is one-third of total height.",
    };

    if (!stripeOK) {
      reasons.push("Stripe heights are not in 1/3 proportion.");
      overallStatus = "fail";
    }
  }

  // Compute representative colors from the detected bands (if available)
  const colors = {};
  if (best) {
    const avgBand = (y0, y1) => {
      let r = 0,
        g = 0,
        b = 0,
        n = 0;
      for (let y = y0; y <= y1; y++) {
        const c = averageRowRGB(j, y, midX0, midX1);
        r += c.r;
        g += c.g;
        b += c.b;
        n++;
      }
      return {
        r: Math.round(r / n),
        g: Math.round(g / n),
        b: Math.round(b / n),
      };
    };
    const saff = avgBand(best.a.y0, best.a.y1);
    const whit = avgBand(best.b.y0, best.b.y1);
    const gren = avgBand(best.c.y0, best.c.y1);

    const addColor = (name, rgb, target, key = name) => {
      const dev = colorDeviation(rgb, target);
      const ok = dev <= COLOR_TOLERANCE;
      colors[key] = {
        status: ok ? "pass" : "fail",
        deviation: `${dev}%`,
        message: ok
          ? `${name} color is within ${COLOR_TOLERANCE}% tolerance.`
          : `${name} color deviates by ${dev}%.`,
        severity: ok ? "none" : dev > 10 ? "major" : "minor",
        tip: ok ? undefined : COLOR_TIPS[name],
      };
      if (!ok) {
        reasons.push(
          `${
            name[0].toUpperCase() + name.slice(1)
          } color deviation is too high.`
        );
        overallStatus = "fail";
      }
    };

    addColor("saffron", saff, TARGET.saffron);
    addColor("white", whit, TARGET.white);
    addColor("green", gren, TARGET.green);

    // Chakra color: sample a small window around the center of the white band
    const whiteMidY = Math.floor((best.b.y0 + best.b.y1) / 2);
    const cx = Math.floor(width / 2);
    const win = Math.max(3, Math.floor(Math.min(width, best.hB) * 0.01)); // tiny window
    let rr = 0,
      gg = 0,
      bb = 0,
      nn = 0;
    for (let y = whiteMidY - win; y <= whiteMidY + win; y++) {
      if (y < 0 || y >= height) continue;
      for (let x = cx - win; x <= cx + win; x++) {
        if (x < 0 || x >= width) continue;
        const c = Jimp.intToRGBA(j.getPixelColor(x, y));
        rr += c.r;
        gg += c.g;
        bb += c.b;
        nn++;
      }
    }
    const chakraRGB = nn
      ? {
          r: Math.round(rr / nn),
          g: Math.round(gg / nn),
          b: Math.round(bb / nn),
        }
      : { r: 0, g: 0, b: 0 };
    const chakraDev = colorDeviation(chakraRGB, TARGET.chakra);
    const chakraColorOK = chakraDev <= COLOR_TOLERANCE;

    colors.chakra_blue = {
      status: chakraColorOK ? "pass" : "fail",
      deviation: `${chakraDev}%`,
      message: chakraColorOK
        ? "Chakra blue is within tolerance."
        : `Chakra blue deviates by ${chakraDev}%.`,
      severity: chakraColorOK ? "none" : chakraDev > 10 ? "major" : "minor",
      tip: chakraColorOK ? undefined : COLOR_TIPS.chakra,
    };
    if (!chakraColorOK) {
      reasons.push("Chakra blue color deviation is too high.");
      overallStatus = "fail";
    }
  } else {
    // Fallback: keep your previous midline-based color checks if stripes not found
    colors.saffron = {
      status: "fail",
      deviation: "—",
      message: "Bands not detected.",
    };
    colors.white = {
      status: "fail",
      deviation: "—",
      message: "Bands not detected.",
    };
    colors.green = {
      status: "fail",
      deviation: "—",
      message: "Bands not detected.",
    };
    colors.chakra_blue = {
      status: "fail",
      deviation: "—",
      message: "Bands not detected.",
    };
  }

  // 3) Chakra position, diameter, spokes (as before, but report spokes separately)
  let chakra_position = {
    status: "fail",
    offset_x: "-",
    offset_y: "-",
    diameter: "-",
    detected: "-",
    message: "Chakra detection failed.",
    severity: "major",
    tip: "Ensure the chakra is clearly visible and navy blue.",
  };
  let chakra_spokes = {
    status: "fail",
    detected: 0,
    message: "Spoke count not determined.",
    severity: "major",
  };

  try {
    // Use the detected white band for geometry
    const bandY = best ? best.b.y0 : Math.floor(height / 3);
    const bandH = best ? best.b.y1 - best.b.y0 + 1 : Math.floor(height / 3);

    let maxBlue = 0;
    let center = { x: width / 2, y: bandY + Math.floor(bandH / 2) };
    let radius = 0;

    // Coarse search for center (limited to middle region)
    for (
      let cy = Math.floor(bandY + bandH * 0.3);
      cy < Math.floor(bandY + bandH * 0.7);
      cy += 2
    ) {
      for (
        let cx = Math.floor(width * 0.3);
        cx < Math.floor(width * 0.7);
        cx += 2
      ) {
        let blueCount = 0;
        const r0 = Math.min(width, bandH) / 8;
        for (let a = 0; a < 360; a += 10) {
          const rad = (a * Math.PI) / 180;
          const x = Math.floor(cx + r0 * Math.cos(rad));
          const y = Math.floor(cy + r0 * Math.sin(rad));
          if (x < 0 || x >= width || y < 0 || y >= height) continue;
          const c = Jimp.intToRGBA(j.getPixelColor(x, y));
          const isBlue =
            Math.abs(c.r - TARGET.chakra.r) < 40 &&
            Math.abs(c.g - TARGET.chakra.g) < 40 &&
            Math.abs(c.b - TARGET.chakra.b) < 80;
          if (isBlue) blueCount++;
        }
        if (blueCount > maxBlue) {
          maxBlue = blueCount;
          center = { x: cx, y: cy };
          radius = r0;
        }
      }
    }

    const expectedDia = bandH * 0.75;
    const actualDia = radius * 2;
    const diaOK = withinTolerance(actualDia, expectedDia, DIAMETER_TOLERANCE);
    const offX = Math.abs(center.x - width / 2);
    const offY = Math.abs(center.y - (bandY + bandH / 2));
    const centerOK =
      offX < width * (CENTER_TOLERANCE / 100) &&
      offY < bandH * (CENTER_TOLERANCE / 100);

    // Spokes: sample around rim and count transitions
    let spokes = 0,
      lastBlue = false;
    for (let a = 0; a < 360; a += 5) {
      const rad = (a * Math.PI) / 180;
      const x = Math.floor(center.x + radius * 0.95 * Math.cos(rad));
      const y = Math.floor(center.y + radius * 0.95 * Math.sin(rad));
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      const c = Jimp.intToRGBA(j.getPixelColor(x, y));
      const isBlue =
        Math.abs(c.r - TARGET.chakra.r) < 40 &&
        Math.abs(c.g - TARGET.chakra.g) < 40 &&
        Math.abs(c.b - TARGET.chakra.b) < 80;
      if (isBlue && !lastBlue) spokes++;
      lastBlue = isBlue;
    }

    chakra_position = {
      status: diaOK && centerOK ? "pass" : "fail",
      offset_x: `${Math.round(offX)}px`,
      offset_y: `${Math.round(offY)}px`,
      diameter: `${Math.round(actualDia)}px`,
      detected: spokes,
      message:
        diaOK && centerOK
          ? "Chakra is centered and sized correctly."
          : "Chakra is not centered and/or diameter is off.",
      severity: diaOK && centerOK ? "none" : "major",
      tip:
        diaOK && centerOK
          ? undefined
          : "Chakra must be centered in the white band; diameter = 3/4 of white band height.",
    };

    const spokesOK = spokes === 24;
    chakra_spokes = {
      status: spokesOK ? "pass" : "fail",
      detected: spokes,
      message: spokesOK
        ? "Chakra has exactly 24 spokes."
        : `Chakra has ${spokes} spokes (should be 24).`,
      severity: spokesOK ? "none" : "major",
      tip: spokesOK ? undefined : "Ensure exactly 24 evenly spaced spokes.",
    };

    if (!(diaOK && centerOK)) {
      reasons.push("Chakra is not centered or sized correctly.");
      overallStatus = "fail";
    }
    if (!spokesOK) {
      reasons.push("Chakra does not have 24 spokes.");
      overallStatus = "fail";
    }
  } catch (e) {
    reasons.push("Chakra detection failed.");
    chakra_position = {
      status: "fail",
      offset_x: "-",
      offset_y: "-",
      diameter: "-",
      detected: "-",
      message: "Chakra detection failed.",
      severity: "major",
      tip: "Ensure the chakra is clear and navy blue on a flat, solid flag.",
    };
    chakra_spokes = {
      status: "fail",
      detected: 0,
      message: "Spoke count not determined.",
      severity: "major",
    };
    overallStatus = "fail";
  }

  // Summary
  const summary = {
    status: overallStatus,
    reasons,
    tip:
      overallStatus === "pass"
        ? "Your flag image is BIS-compliant!"
        : "Fix the issues listed above per BIS specifications.",
  };

  return {
    summary,
    aspect_ratio: {
      status: aspectOK ? "pass" : "fail",
      actual: aspect.toFixed(2),
      message: aspectOK
        ? "Aspect ratio is within 1% of 3:2."
        : `Aspect ratio is ${aspect.toFixed(2)} (should be 1.50).`,
    },
    colors,
    stripe_proportion,
    chakra_position,
    chakra_spokes, 
  };
}

module.exports = { validate };
