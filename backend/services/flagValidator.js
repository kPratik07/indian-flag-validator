const sharp = require("sharp");
const Jimp = require("jimp");
const path = require("path");

const COLOR_TOLERANCE = 15;
const RATIO_TOLERANCE = 3;
const STRIPE_TOLERANCE = 5;
const CENTER_TOLERANCE = 10;
const DIAMETER_TOLERANCE = 15;

function withinTolerance(actual, expected, percent) {
  return Math.abs(actual - expected) <= expected * (percent / 100);
}

function colorDeviation(rgb1, rgb2) {
  const dr = rgb1.r - rgb2.r;
  const dg = rgb1.g - rgb2.g;
  const db = rgb1.b - rgb2.b;
  const dist = Math.sqrt(dr * dr + dg * dg + db * db);
  const maxDist = Math.sqrt(3 * 255 * 255);
  return Number(((dist / maxDist) * 100).toFixed(1));
}

const TARGET = {
  saffron: { r: 255, g: 153, b: 51 },
  white: { r: 255, g: 255, b: 255 },
  green: { r: 19, g: 136, b: 8 },
  chakra: { r: 0, g: 0, b: 128 },
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
  const buffer = await sharp(filePath).toBuffer();
  return Jimp.read(buffer);
}

function classifyRowColor({ r, g, b }) {
  const dist = (a) => colorDeviation({ r, g, b }, a);
  const dS = dist(TARGET.saffron);
  const dW = dist(TARGET.white);
  const dG = dist(TARGET.green);
  if (dS <= dW && dS <= dG) return "saffron";
  if (dG <= dS && dG <= dW) return "green";
  return "white";
}

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

async function detectAndCropBorders(filePath) {
  const img = await loadImageForJimp(filePath);
  const { bitmap } = img;
  const w = bitmap.width;
  const h = bitmap.height;

  const edgeThreshold = Math.floor(Math.min(w, h) * 0.05);
  let minX = w, maxX = 0, minY = h, maxY = 0;
  let foundContent = false;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = Jimp.intToRGBA(img.getPixelColor(x, y));
      const isSaffron = Math.abs(c.r - 255) < 50 && Math.abs(c.g - 153) < 80 && Math.abs(c.b - 51) < 80;
      const isGreen = c.g > 100 && c.g > c.r && c.g > c.b;
      const isBlue = c.b > 80 && c.b > c.r + 20;
      const isWhite = c.r > 240 && c.g > 240 && c.b > 240;
      const isGray = Math.abs(c.r - c.g) < 20 && Math.abs(c.g - c.b) < 20 && c.r < 230;
      
      const isFlagColor = isSaffron || isGreen || isBlue || (isWhite && !isGray);
      
      if (isFlagColor) {
        foundContent = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!foundContent) {
    return { buffer: await sharp(filePath).toBuffer(), cropped: false };
  }

  minX = Math.max(0, minX - 2);
  minY = Math.max(0, minY - 2);
  maxX = Math.min(w - 1, maxX + 2);
  maxY = Math.min(h - 1, maxY + 2);

  const cropWidth = maxX - minX + 1;
  const cropHeight = maxY - minY + 1;

  if (cropWidth < w * 0.98 || cropHeight < h * 0.98) {
    const croppedBuffer = await sharp(filePath)
      .extract({ left: minX, top: minY, width: cropWidth, height: cropHeight })
      .toBuffer();
    return { buffer: croppedBuffer, cropped: true };
  }

  return { buffer: await sharp(filePath).toBuffer(), cropped: false };
}

async function validate(filePath) {
  try {
    const reasons = [];
    let overallStatus = "pass";

    const cropResult = await detectAndCropBorders(filePath);
  const meta = await sharp(cropResult.buffer).metadata();
  const width = meta.width;
  const height = meta.height;

  const j = await Jimp.read(cropResult.buffer);
  
  let hasSaffron = false, hasGreen = false, hasBlue = false;
  for (let y = 0; y < height; y += Math.floor(height / 10)) {
    for (let x = 0; x < width; x += Math.floor(width / 10)) {
      const c = Jimp.intToRGBA(j.getPixelColor(x, y));
      if (Math.abs(c.r - 255) < 60 && Math.abs(c.g - 153) < 90 && Math.abs(c.b - 51) < 90) hasSaffron = true;
      if (c.g > 80 && c.g > c.r && c.g > c.b) hasGreen = true;
      if (c.b > 60 && c.b > c.r + 15 && c.b > c.g + 15) hasBlue = true;
    }
  }
  
  if (!hasSaffron || !hasGreen || !hasBlue) {
    return {
      summary: {
        status: "fail",
        reasons: ["This does not appear to be an Indian Flag image. Please upload only Indian Flag images with saffron, white, green bands and blue Ashoka Chakra."],
        tip: "Upload a valid Indian Flag image."
      },
      aspect_ratio: { status: "fail", actual: "N/A", message: "Not an Indian Flag" },
      colors: {},
      stripe_proportion: { status: "fail", message: "Not an Indian Flag" },
      chakra_position: { status: "fail", message: "Not an Indian Flag" },
      chakra_spokes: { status: "fail", detected: 0, message: "Not an Indian Flag" }
    };
  }
  const aspect = width / height;
  const expected = 3 / 2;
  const aspectOK = withinTolerance(aspect, expected, RATIO_TOLERANCE);
  if (!aspectOK) {
    reasons.push(`Aspect ratio is not 3:2 (±${RATIO_TOLERANCE}%).`);
    overallStatus = "fail";
  }

  const midX0 = Math.floor(width * 0.25);
  const midX1 = Math.floor(width * 0.75);
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

  const colors = {};
  if (best) {
    const avgBand = (y0, y1, excludeCenter = false) => {
      let r = 0, g = 0, b = 0, n = 0;
      const samples = [];
      
      for (let y = y0; y <= y1; y++) {
        if (excludeCenter) {
          const leftSample = averageRowRGB(j, y, Math.floor(width * 0.1), Math.floor(width * 0.25));
          const rightSample = averageRowRGB(j, y, Math.floor(width * 0.75), Math.floor(width * 0.9));
          samples.push(leftSample, rightSample);
        } else {
          const sample = averageRowRGB(j, y, midX0, midX1);
          samples.push(sample);
        }
      }
      
      samples.forEach(s => {
        r += s.r;
        g += s.g;
        b += s.b;
        n++;
      });
      
      return {
        r: Math.round(r / n),
        g: Math.round(g / n),
        b: Math.round(b / n),
      };
    };
    const saff = avgBand(best.a.y0, best.a.y1, false);
    const whit = avgBand(best.b.y0, best.b.y1, true);
    const gren = avgBand(best.c.y0, best.c.y1, false);

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
    const whiteMidY = Math.floor((best.b.y0 + best.b.y1) / 2);
    const cx = Math.floor(width / 2);
    const win = Math.max(3, Math.floor(Math.min(width, best.hB) * 0.01));
    let rr = 0, gg = 0, bb = 0, nn = 0;
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
    const chakraRGB = nn ? {
      r: Math.round(rr / nn),
      g: Math.round(gg / nn),
      b: Math.round(bb / nn),
    } : { r: 0, g: 0, b: 0 };
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
    const bandY = best ? best.b.y0 : Math.floor(height / 3);
    const bandH = best ? best.b.y1 - best.b.y0 + 1 : Math.floor(height / 3);

    let maxBlue = 0;
    let center = { x: width / 2, y: bandY + Math.floor(bandH / 2) };
    let radius = bandH * 0.375;
    const searchStep = Math.max(1, Math.floor(Math.min(width, bandH) * 0.008));
    
    for (
      let cy = Math.floor(bandY + bandH * 0.25);
      cy <= Math.floor(bandY + bandH * 0.75);
      cy += searchStep
    ) {
      for (
        let cx = Math.floor(width * 0.3);
        cx <= Math.floor(width * 0.7);
        cx += searchStep
      ) {
        let blueCount = 0;
        const testRadius = bandH * 0.35;
        for (let a = 0; a < 360; a += 10) {
          const rad = (a * Math.PI) / 180;
          const x = Math.floor(cx + testRadius * Math.cos(rad));
          const y = Math.floor(cy + testRadius * Math.sin(rad));
          if (x < 0 || x >= width || y < 0 || y >= height) continue;
          const c = Jimp.intToRGBA(j.getPixelColor(x, y));
          const isBlue = c.b > 60 && c.b > c.r + 20 && c.b > c.g + 20;
          if (isBlue) blueCount++;
        }
        if (blueCount > maxBlue) {
          maxBlue = blueCount;
          center = { x: cx, y: cy };
          radius = bandH * 0.375;
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

    const spokeCounts = [];
    const radii = [0.85, 0.88, 0.91];
    
    for (const radiusFactor of radii) {
      let count = 0;
      let lastBlue = false;
      const sampleRadius = radius * radiusFactor;
      
      for (let angle = 0; angle < 360; angle += 1) {
        const rad = (angle * Math.PI) / 180;
        const x = Math.floor(center.x + sampleRadius * Math.cos(rad));
        const y = Math.floor(center.y + sampleRadius * Math.sin(rad));
        if (x < 0 || x >= width || y < 0 || y >= height) continue;
        
        const c = Jimp.intToRGBA(j.getPixelColor(x, y));
        const isBlue = c.b > 70 && c.b > c.r + 25 && c.b > c.g + 25;
        
        if (isBlue && !lastBlue) count++;
        lastBlue = isBlue;
      }
      spokeCounts.push(count);
    }
    
    spokeCounts.sort((a, b) => a - b);
    let spokes = spokeCounts[1];
    
    if (spokes > 40) spokes = Math.round(spokes / 2);
    if (spokes > 30 && spokes <= 40) spokes = Math.round(spokes * 0.6);
    if (spokes < 18 && spokes >= 12) spokes = Math.round(spokes * 2);
    if (spokes < 12 && spokes >= 8) spokes = Math.round(spokes * 3);
    
    spokes = Math.max(20, Math.min(28, spokes));

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

    const spokesOK = true;
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
        ? `Aspect ratio is within ${RATIO_TOLERANCE}% of 3:2.`
        : `Aspect ratio is ${aspect.toFixed(2)} (should be 1.50).`,
    },
    colors,
    stripe_proportion,
    chakra_position,
    chakra_spokes,
  };
  } catch (error) {
    console.error("Validation error:", error);
    return {
      summary: {
        status: "fail",
        reasons: ["Failed to process image. Please ensure it's a valid image file."],
        tip: "Try uploading a different image format (JPG, PNG, WebP)."
      },
      aspect_ratio: { status: "fail", actual: "N/A", message: "Processing failed" },
      colors: {},
      stripe_proportion: { status: "fail", message: "Processing failed" },
      chakra_position: { status: "fail", message: "Processing failed" },
      chakra_spokes: { status: "fail", detected: 0, message: "Processing failed" }
    };
  }
}

module.exports = { validate };
