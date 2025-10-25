import React, { useState } from "react";
import FileUploader from "./components/FileUploader";
import ValidationReport from "./components/ValidationReport";
import { uploadFlag } from "./api/flagApi";

function App() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showRejectionMessage, setShowRejectionMessage] = useState(false);

  const handleFileUpload = async (file) => {
    setReport(null);
    setError("");
    setLoading(true);
    try {
      const result = await uploadFlag(file);
      setReport(result);
    } catch (err) {
      setError(err.message || "Failed to validate flag.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-2 sm:p-4" style={{
      background: '#f5f5f5',
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box',
      width: '100%'
    }}>
      {/* Flowing Indian Flag Background */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(800px, 90vw)',
        height: 'min(600px, 70vh)',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.08
      }}>
        <svg 
          className="flowing-flag"
          viewBox="0 0 400 300" 
          style={{ width: '100%', height: '100%' }}
        >
          <defs>
            <filter id="wave">
              <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" result="turbulence">
                <animate attributeName="baseFrequency" dur="20s" values="0.01;0.02;0.01" repeatCount="indefinite"/>
              </feTurbulence>
              <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="8" xChannelSelector="R" yChannelSelector="G"/>
            </filter>
          </defs>
          
          {/* Saffron band with wave effect */}
          <g filter="url(#wave)">
            <path d="M 0,0 Q 100,10 200,0 T 400,0 L 400,100 Q 300,90 200,100 T 0,100 Z" fill="#FF9933"/>
            <path d="M 0,0 Q 100,15 200,0 T 400,0 L 400,100 Q 300,85 200,100 T 0,100 Z" fill="#FF8800" opacity="0.5"/>
          </g>
          
          {/* White band with Chakra */}
          <g filter="url(#wave)">
            <path d="M 0,100 Q 100,110 200,100 T 400,100 L 400,200 Q 300,190 200,200 T 0,200 Z" fill="#FFFFFF"/>
            
            {/* Ashoka Chakra */}
            <g transform="translate(200, 150)">
              <circle r="35" fill="none" stroke="#000080" strokeWidth="3"/>
              <circle r="8" fill="#000080"/>
              {[...Array(24)].map((_, i) => {
                const angle = (i * 360) / 24 - 90;
                const rad = (angle * Math.PI) / 180;
                const x1 = 10 * Math.cos(rad);
                const y1 = 10 * Math.sin(rad);
                const x2 = 32 * Math.cos(rad);
                const y2 = 32 * Math.sin(rad);
                return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#000080" strokeWidth="1.5"/>;
              })}
            </g>
          </g>
          
          {/* Green band with wave effect */}
          <g filter="url(#wave)">
            <path d="M 0,200 Q 100,210 200,200 T 400,200 L 400,300 Q 300,290 200,300 T 0,300 Z" fill="#138808"/>
            <path d="M 0,200 Q 100,215 200,200 T 400,200 L 400,300 Q 300,285 200,300 T 0,300 Z" fill="#0a6605" opacity="0.5"/>
          </g>
        </svg>
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <FileUploader 
          onFileUpload={handleFileUpload} 
          loading={loading}
          onRejection={() => setShowRejectionMessage(true)}
        />
        {showRejectionMessage && (
          <div className="mt-6 text-center animate-fade-in px-4">
            <p className="text-base md:text-lg font-semibold text-gray-700 bg-white/90 px-4 md:px-6 py-3 rounded-lg shadow-lg max-w-md mx-auto">
              📤 Please upload an Indian Flag image to generate the report
            </p>
          </div>
        )}
        {error && (
          <div className="mt-4 text-red-600 bg-red-100 px-4 py-2 rounded">
            {error}
          </div>
        )}
        <ValidationReport report={report} />
      </div>
    </div>
  );
}

export default App;
