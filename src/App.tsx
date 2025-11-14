import React, { useState } from "react";
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

  // Sheet URL
  const sheetMatch = input.match(/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (sheetMatch) return sheetMatch[1];

  return input.trim();
}

function App() {
  const [folderInput, setFolderInput] = useState("");
  const [sheetInput, setSheetInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [notification, setNotification] = useState("");

  // IMPORTANT — USE YOUR RENDER BACKEND
  const API_BASE = "https://drive-to-sheet-backend.onrender.com";

  async function handleSync() {
    const folderId = extractGoogleId(folderInput);
    const sheetId = extractGoogleId(sheetInput);

    if (!folderId || !sheetId) {
      setNotification("❌ Please enter valid Google Drive or Sheet URLs / IDs.");
      return;
    }

    setLoading(true);
    setNotification("");
    setProgress(20);

    try {
      const res = await fetch(`${API_BASE}/sync`, {
        method: "POST",
        body: new URLSearchParams({
          folder_id: folderId,
          sheet_id: sheetId,
        }),
      });

      setProgress(70);

      const data = await res.json();
      setProgress(100);

      if (data.ok) {
        setNotification(`✅ Synced ${data.count} files successfully!`);
      } else {
        setNotification(`❌ Error: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      setNotification("❌ Server error. Check backend or Render logs.");
    }

    setLoading(false);

    setTimeout(() => setProgress(0), 1500);
  }

  return (
    <div className="container">
      <h1>Okie Dokie Sync Tool</h1>

      <p className="subtitle">
        This tool automatically syncs <b>Google Drive files</b> into a  
        <b>Google Sheet</b>.  
        <br />
        Make sure the Drive folder and Sheet are owned by:
        <br />
        <b>okiedokie@rksdcollege.ac.in</b>
      </p>

      <div className="card">
        <label>Google Drive Folder URL or ID</label>
        <input
          type="text"
          placeholder="Paste Drive folder URL or ID"
          value={folderInput}
          onChange={(e) => setFolderInput(e.target.value)}
        />

        <label>Google Sheet URL or ID</label>
        <input
          type="text"
          placeholder="Paste Sheet URL or ID"
          value={sheetInput}
          onChange={(e) => setSheetInput(e.target.value)}
        />

        <button onClick={handleSync} disabled={loading}>
          {loading ? "Syncing..." : "Sync Now"}
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
    </div>
  );
}

export default App;
