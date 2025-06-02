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

// Helper to get file type by extension
const getFileType = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();

  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx'].includes(ext)) return 'word';
  if (['xls', 'xlsx'].includes(ext)) return 'excel';
  if (['ppt', 'pptx'].includes(ext)) return 'powerpoint';
  if (['txt'].includes(ext)) return 'text';
  return 'generic';
};

// SVG Icons for file types
const icons = {
  pdf: (
    <svg width="48" height="48" fill="#E02F2F" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
      <path d="M14 2v6h6" fill="#fff" />
      <text x="6" y="20" fill="white" fontSize="8" fontWeight="bold">PDF</text>
    </svg>
  ),
  word: (
    <svg width="48" height="48" fill="#2A5699" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="3" ry="3" />
      <text x="6" y="20" fill="white" fontSize="8" fontWeight="bold">DOC</text>
    </svg>
  ),
  excel: (
    <svg width="48" height="48" fill="#207245" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="3" ry="3" />
      <text x="5" y="20" fill="white" fontSize="8" fontWeight="bold">XLS</text>
    </svg>
  ),
  powerpoint: (
    <svg width="48" height="48" fill="#D24726" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="3" ry="3" />
      <text x="3" y="20" fill="white" fontSize="8" fontWeight="bold">PPT</text>
    </svg>
  ),
  text: (
    <svg width="48" height="48" fill="#6c757d" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="3" ry="3" fill="#dee2e6" />
      <text x="7" y="18" fill="#495057" fontSize="10" fontWeight="bold">TXT</text>
    </svg>
  ),
  image: (
    <svg width="48" height="48" fill="#6c757d" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="3" ry="3" fill="#dee2e6" />
      <circle cx="8" cy="8" r="3" fill="#adb5bd" />
      <path d="M21 21l-6-6-4 4-3-3-4 4" stroke="#adb5bd" strokeWidth="2" fill="none" />
    </svg>
  ),
  generic: (
    <svg width="48" height="48" fill="#6c757d" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="3" ry="3" fill="#dee2e6" />
      <path d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
    </svg>
  ),
};

export default function GranteeFiles() {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const currentUser = getUserFromLocalStorage();
  const currentUserId = currentUser?.userId;

  const fetchGranteeFiles = useCallback(async () => {
    if (!currentUserId) {
      setError("User ID not found. Please log in.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${BASE_URL}gfgp/documents/${currentUserId}/files`);
      setFiles(response.data);
    } catch (err) {
      console.error("Error fetching files:", err);
      setError("Failed to load files. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [BASE_URL, currentUserId]);

  useEffect(() => {
    fetchGranteeFiles();
  }, [fetchGranteeFiles]);

  return (
    <div className="card mt-4 shadow-sm">
      <div className="card-header">Document Repository of Uploaded Files 📁</div>
      <div className="card-body">
        {isLoading && <p className="text-center">Loading files...</p>}
        {error && <p className="text-danger text-center">{error}</p>}
        {!isLoading && !error && files.length === 0 && (
          <p className="text-muted text-center">No files uploaded yet.</p>
        )}
        <div className="row g-3">
          {!isLoading && !error && files.map(file => {
            const fileType = getFileType(file.filename);
            const isImage = fileType === "image";

            return (
              <div key={file.filename} className="col-12 col-sm-6 col-md-4 col-lg-3">
                <div className="card h-100 shadow-sm">
                  <div
                    className="d-flex justify-content-center align-items-center bg-light"
                    style={{ minHeight: "100px", overflow: "hidden" }}
                  >
                    {isImage ? (
                      <img
                        src={`${BASE_URL.replace(/\/+$/, "")}/files/${file.filename}`}
                        alt={file.filename}
                        style={{ maxHeight: "100px", maxWidth: "100%", objectFit: "contain" }}
                      />
                    ) : (
                      icons[fileType] || icons.generic
                    )}
                  </div>
                  <div className="card-body d-flex flex-column">
                    <h6
                      className="card-title text-truncate"
                      title={file.filename}
                      style={{ minHeight: "3rem" }}
                    >
                      {file.filename}
                    </h6>
                    <p className="card-text mb-1">
                      <small className="text-muted">
                        Version: {file.version || "N/A"}
                      </small>
                    </p>
                    <p className="card-text mb-3">
                      <small className="text-muted">
                        Uploaded: {file.uploadDate ? new Date(file.uploadDate).toLocaleDateString() : "N/A"} <br />
                        By: {file.uploadedBy || "Unknown"}
                      </small>
                    </p>
                    <a
                      href={`${BASE_URL.replace(/\/+$/, "")}/files/${file.filename}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-success mt-auto"
                      style={{ whiteSpace: "nowrap" }}
                    >
                      View File
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}