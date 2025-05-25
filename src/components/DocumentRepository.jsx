import { useEffect, useState, useCallback } from "react";
import axios from "axios";

// Helper function to safely get user data from localStorage
const getUserFromLocalStorage = () => {
  try {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error("Failed to parse user from localStorage:", error);
    return null;
  }
};

export default function GranteeFiles() {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // New state for loading indicator
  const [error, setError] = useState(null); // New state for error handling

  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const currentUser = getUserFromLocalStorage();
  const currentUserId = currentUser?.userId; // Clearer variable name

  // Use useCallback to memoize the fetch function, preventing unnecessary re-creations
  const fetchGranteeFiles = useCallback(async () => {
    if (!currentUserId) {
      setError("User ID not found. Please log in.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null); // Clear previous errors
    try {
      const response = await axios.get(`${BASE_URL}gfgp/documents/${currentUserId}/files`);
      setFiles(response.data);
    } catch (err) {
      console.error("Error fetching files:", err);
      // More descriptive error message for the user
      setError("Failed to load files. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [BASE_URL, currentUserId]); // Dependencies for useCallback

  useEffect(() => {
    fetchGranteeFiles();
  }, [fetchGranteeFiles]); // Effect depends on the memoized fetch function

  // --- Rendering Logic ---
  const renderContent = () => {
    if (isLoading) {
      return <li className="list-group-item text-center">Loading files...</li>;
    }

    if (error) {
      return <li className="list-group-item text-danger text-center">{error}</li>;
    }

    if (files.length === 0) {
      return <li className="list-group-item text-muted text-center">No files uploaded yet.</li>;
    }

    return files.map(file => (
      <li key={file.filename} className="list-group-item d-flex justify-content-between align-items-center">
        <div>
          <strong>{file.filename}</strong><br />
          <small className="text-muted">
            {file.version ? `Version: ${file.version}` : 'No version info'}
          </small><br />
          <small className="text-muted">
            {file.uploadDate ? new Date(file.uploadDate).toLocaleDateString() : 'N/A'} by {file.uploadedBy || 'Unknown'}
          </small>
        </div>
        <div>
          <a
            href={`${BASE_URL.replace(/\/+$/, "")}/files/${file.filename}`}
            className="btn btn-sm btn-outline-primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            View
          </a>
        </div>
      </li>
    ));
  };

  return (
    <div className="card mt-4 shadow-sm">
      <div className="card-header">📁 Uploaded Files</div>
      <ul className="list-group list-group-flush">
        {renderContent()}
      </ul>
    </div>
  );
}