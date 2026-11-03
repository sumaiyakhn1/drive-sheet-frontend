import React, { useState, useEffect } from "react";
import "./App.css";

// ------------------------------
// Extract Google ID from URL or raw ID
// ------------------------------
function extractGoogleId(input: string): string {
  if (!input) return "";

  // Direct ID
  if (/^[a-zA-Z0-9_-]{15,}$/.test(input)) {
    return input;
  }

  // Folder URL
  const folderMatch = input.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch) return folderMatch[1];

  // File URL
  const fileMatch = input.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return fileMatch[1];


  return input.trim();
}

function App() {
  const [folderInput, setFolderInput] = useState("");

  const [loadingType, setLoadingType] = useState<"thumbnail" | "viewable" | null>(null);
  const [progress, setProgress] = useState(0);
  const [notification, setNotification] = useState("");
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const API_BASE = process.env.REACT_APP_API_BASE || "https://drive-to-sheet-backend.onrender.com";

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/stats`);
      if (res.ok) {
        const data = await res.json();
        if (typeof data.total_generations === "number") {
          setTotalCount(data.total_generations);
        }
      }
    } catch (e) {
      console.warn("Could not fetch generation stats:", e);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  async function handleDownloadExcel(excelType: "thumbnail" | "viewable") {
    const folderId = extractGoogleId(folderInput);

    if (!folderId) {
      setNotification("❌ Please enter a valid Google Drive folder URL or ID.");
      return;
    }

    setLoadingType(excelType);
    setNotification("");
    setProgress(20);

    try {
      const res = await fetch(`${API_BASE}/generate-excel`, {
        method: "POST",
        body: new URLSearchParams({
          folder_id: folderId,
          excel_type: excelType,
        }),
      });

      setProgress(70);

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `drive_files_${excelType}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        
        setProgress(100);
        setNotification(
          excelType === "thumbnail"
            ? "✅ Thumbnail Excel downloaded."
            : "✅ Viewable Excel downloaded. Use its Drive links to open PDFs."
        );

        // Refresh generation stats immediately
        fetchStats();
      } else {
        const errorData = await res.json().catch(() => null);
        setProgress(100);
        setNotification(`❌ Error: ${errorData?.detail || "Error generating Excel file"}`);
      }
    } catch (err: any) {
      setNotification(`❌ Server error: ${err.message || "Check backend or Render logs."}`);
    }

    setLoadingType(null);

    setTimeout(() => setProgress(0), 1500);
  }

  return (
    <div className="container">
      <h1>Okie Dokie Drive to Excel</h1>

      <p className="subtitle">
        Choose which Excel file to download from your publicly shared <b>Google Drive folder</b>. Use the viewable file to open PDFs in Google Drive.
      </p>

      <div className="card">
        <label>Google Drive Folder URL or ID</label>
        <input
          type="text"
          placeholder="Paste Drive folder URL or ID"
          value={folderInput}
          onChange={(e) => setFolderInput(e.target.value)}
        />

        <button onClick={() => handleDownloadExcel("thumbnail")} disabled={loadingType !== null}>
          {loadingType === "thumbnail" ? "Generating..." : "Download Thumbnail Excel"}
        </button>
        <button
          className="secondary-button"
          onClick={() => handleDownloadExcel("viewable")}
          disabled={loadingType !== null}
        >
          {loadingType === "viewable" ? "Generating..." : "Download Viewable Excel"}
        </button>

        {progress > 0 && (
          <div className="progress">
            <div className="progress-bar" style={{ width: `${progress}%` }}></div>
          </div>
        )}

        {notification && <p className="notification">{notification}</p>}
      </div>

      <footer>
        Crafted with ❤️ by <b>Okie Dokie</b>
      </footer>

      {/* Floating Bottom-Right Counter Widget */}
      <div className="bottom-right-counter" title="Total Excel Sheets Generated">
        <span className="counter-icon">📊</span>
        <div className="counter-text">
          <span className="counter-label">Excel Generated</span>
          <span className="counter-value">{totalCount !== null ? totalCount : "..."}</span>
        </div>
      </div>
    </div>
  );
}

export default App;
