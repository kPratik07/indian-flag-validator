import React from "react";
import "./ValidationReport.css"; // External CSS

const ValidationReport = ({ report }) => {
  if (!report) return null;
  const {
    summary,
    aspect_ratio,
    colors,
    stripe_proportion,
    chakra_position,
    chakra_spokes,
  } = report;

  return (
    <div className="validation-container">
      <div className="validation-card">
        <h2 className="report-title">Validation Report</h2>

        <div
          className={`summary-box ${
            summary.status === "pass" ? "summary-pass" : "summary-fail"
          }`}
        >
          <div className="summary-header">
            <span className="summary-status">
              {summary.status === "pass" ? "✅ Pass" : "❌ Fail"}
            </span>
            <span className="summary-tip">{summary.tip}</span>
          </div>
          {summary.reasons.length > 0 && (
            <ul className="summary-reasons">
              {summary.reasons.map((reason, i) => (
                <li key={i}>{reason}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="report-items">
          <ReportItem title="Aspect Ratio" data={aspect_ratio} />
          <ReportItem title="Stripe Proportion" data={stripe_proportion} />

          <div>
            <h3 className="section-title">Colors</h3>
            <div className="colors-grid">
              {Object.entries(colors).map(([name, data]) => (
                <ReportItem
                  key={name}
                  title={name
                    .replace("_", " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                  data={data}
                />
              ))}
            </div>
          </div>

          <ReportItem title="Chakra Position" data={chakra_position} />
          <ReportItem title="Chakra Spokes" data={chakra_spokes} />
        </div>
      </div>
    </div>
  );
};

function ReportItem({ title, data }) {
  if (!data) return null;
  return (
    <div
      className={`report-item ${
        data.status === "pass" ? "item-pass" : "item-fail"
      }`}
    >
      <div className="item-header">
        <span className="item-title">{title}:</span>
        <span
          className={`item-status ${
            data.status === "pass" ? "status-pass" : "status-fail"
          }`}
        >
          {data.status}
        </span>
        {data.severity && data.severity !== "none" && (
          <span className={`severity-badge severity-${data.severity}`}>
            {data.severity} issue
          </span>
        )}
      </div>

      {data.actual && (
        <div className="item-detail">
          Actual: <span className="mono">{data.actual}</span>
        </div>
      )}
      {data.deviation && (
        <div className="item-detail">
          Deviation: <span className="mono">{data.deviation}</span>
        </div>
      )}
      {data.message && <div className="item-message">{data.message}</div>}
      {data.tip && <div className="item-tip">Tip: {data.tip}</div>}
      {data.top && (
        <div className="item-extra">
          Top: {data.top}, Middle: {data.middle}, Bottom: {data.bottom}
        </div>
      )}
      {data.offset_x && (
        <div className="item-extra">
          Offset X: {data.offset_x}, Offset Y: {data.offset_y}, Diameter:{" "}
          {data.diameter}
        </div>
      )}
      {data.detected !== undefined && (
        <div className="item-extra">Detected: {data.detected}</div>
      )}
    </div>
  );
}

export default ValidationReport;
