"use client";

import { useState } from "react";
import { FiUpload, FiX, FiLink } from "react-icons/fi";

export default function ImageUpload({ value, onChange, label = "Image" }) {
  const [mode, setMode] = useState("url"); // "url" or "upload"
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function handleUrlChange(e) {
    onChange(e.target.value);
    setError("");
  }

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    setUploading(true);
    setError("");

    try {
      // Convert to base64
      const base64 = await fileToBase64(file);

      // Upload to imgBB via server
      const response = await fetch("/api/upload-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Upload failed");
      }

      onChange(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  function clearImage() {
    onChange("");
    setError("");
  }

  return (
    <div className="image-upload">
      <label className="creator-field">
        <span>{label}</span>
        <div className="image-upload__mode-toggle">
          <button
            className={`image-upload__mode-btn${mode === "url" ? " image-upload__mode-btn--active" : ""}`}
            onClick={() => setMode("url")}
            type="button"
          >
            <FiLink aria-hidden="true" /> URL
          </button>
          <button
            className={`image-upload__mode-btn${mode === "upload" ? " image-upload__mode-btn--active" : ""}`}
            onClick={() => setMode("upload")}
            type="button"
          >
            <FiUpload aria-hidden="true" /> Upload
          </button>
        </div>
      </label>

      {mode === "url" ? (
        <label className="creator-field creator-field--wide">
          <span>Image URL</span>
          <input
            defaultValue={value || ""}
            onChange={handleUrlChange}
            placeholder="https://example.com/image.jpg"
            type="url"
          />
        </label>
      ) : (
        <label className="creator-field creator-field--wide">
          <span>Upload image</span>
          <input
            accept="image/*"
            disabled={uploading}
            onChange={handleFileSelect}
            type="file"
          />
          {uploading && <small className="image-upload__status">Uploading...</small>}
        </label>
      )}

      {error && <p className="creator-field__error">{error}</p>}

      {value && (
        <div className="image-upload__preview">
          <img
            alt="Preview"
            className="image-upload__preview-img"
            src={value}
          />
          <button
            className="image-upload__clear"
            onClick={clearImage}
            type="button"
          >
            <FiX aria-hidden="true" /> Remove
          </button>
        </div>
      )}
    </div>
  );
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
