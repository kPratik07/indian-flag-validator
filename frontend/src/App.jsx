import React, { useState } from "react";
import FileUploader from "./components/FileUploader";
import ValidationReport from "./components/ValidationReport";
import { uploadFlag } from "./api/flagApi";

function App() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <FileUploader onFileUpload={handleFileUpload} loading={loading} />
      {error && (
        <div className="mt-4 text-red-600 bg-red-100 px-4 py-2 rounded">
          {error}
        </div>
      )}
      <ValidationReport report={report} />
    </div>
  );
}

export default App;
