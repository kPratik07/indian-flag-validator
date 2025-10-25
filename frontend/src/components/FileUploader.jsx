import React, { useRef, useState } from "react";
import "./FileUploader.css";

const FileUploader = ({ onFileUpload, loading, report, onRejection }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleChange = (e) => {
    if (e.target.files?.[0]) {
      handleFile(e.target.files[0]);
      e.target.value = null;
    }
  };

  const handleFile = async (file) => {
    if (!file.type.match(/^image\/(jpeg|png|svg\+xml|webp)$/)) {
      alert("Only image files (jpg, png, svg, webp) are allowed.");
      return;
    }

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        let hasSaffron = false, hasGreen = false, hasBlue = false;
        const sampleSize = 15;

        for (let y = 0; y < img.height; y += Math.floor(img.height / sampleSize)) {
          for (let x = 0; x < img.width; x += Math.floor(img.width / sampleSize)) {
            const pixel = ctx.getImageData(x, y, 1, 1).data;
            const [r, g, b] = pixel;

            // More lenient color detection
            if (r > 200 && g > 100 && g < 200 && b < 100) hasSaffron = true;
            if (g > 100 && g > r && g > b) hasGreen = true;
            if (b > 50 && b > r + 10 && b > g + 10) hasBlue = true;
          }
        }

        if (!hasSaffron || !hasGreen || !hasBlue) {
          alert("⚠️ This does not appear to be an Indian Flag image!\n\nPlease upload only Indian Flag images with:\n• Saffron band (top)\n• White band (middle)\n• Green band (bottom)\n• Blue Ashoka Chakra");
          if (onRejection) onRejection();
          setTimeout(() => {
            window.location.reload();
          }, 3000);
          return;
        }

        setFile(file);
        onFileUpload(file);
      };
      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="uploader-container">
      <div
        className={`upload-box ${dragActive ? "active" : ""}`}
        onClick={() => inputRef.current.click()}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          style={{ display: "none" }}
        />

        <svg
          className="upload-arrow"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          stroke="#0ea5e9"
          strokeWidth={2}
          width="80"
          height="80"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            d="M12 16V4m0 0l-4 4m4-4l4 4M20 16.5A2.5 2.5 0 0017.5 14h-11A2.5 2.5 0 004 16.5v1A2.5 2.5 0 006.5 20h11a2.5 2.5 0 002.5-2.5v-1z"
          />
        </svg>

        <p className="upload-title">Upload Image to Start Validation</p>
        <p className="upload-subtitle">Click or drag and drop your file here</p>
        <p className="upload-warning" style={{
          color: "#f59e0b",
          fontSize: "0.875rem",
          marginTop: "0.5rem",
          fontWeight: "500"
        }}>
          ⚠️ Please upload only Indian Flag images
        </p>

        <button className="upload-btn" type="button">
          Choose Image File
        </button>

        {file && (
          <div className="file-info">
            <strong>Selected:</strong> {file.name} (
            {(file.size / 1024).toFixed(1)} KB)
          </div>
        )}

        {loading && <div className="loading">Validating...</div>}
      </div>

      {report && (
        <div className="report-section">
          <h2>Report</h2>
          <div className="report-content">{report}</div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
