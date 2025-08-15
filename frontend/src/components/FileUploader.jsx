import React, { useRef, useState } from "react";
import "./FileUploader.css"; // External CSS

const FileUploader = ({ onFileUpload, loading, report }) => {
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
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  const handleFile = (file) => {
    if (!file.type.match(/^image\/(jpeg|png|svg\+xml|webp)$/)) {
      alert("Only image files (jpg, png, svg, webp) are allowed.");
      return;
    }
    setFile(file);
    onFileUpload(file);
  };

  return (
    <div className="uploader-container">
      {/* Upload Section */}
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

        {/* Arrow Icon */}
        <svg
          className="upload-arrow"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
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

      {/* Report Section */}
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
