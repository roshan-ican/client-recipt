import { useRef, useState } from "react";
import axios from "axios";
import Webcam from "react-webcam";

export default function App() {
  const [receipt, setReceipt] = useState(null);
  const [selectedFile, setFile] = useState(null); // <input> file
  const [imageSrc, setImageSrc] = useState(null); // webcam screenshot
  const webcamRef = useRef();

  /* ---------- choose file (NO upload) ---------- */
  const handleChooseFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFile(file);
    setImageSrc(null); // clear webcam preview if a file is chosen
  };

  /* ---------- capture webcam (NO upload) ---------- */
  const handleCapture = () => {
    const shot = webcamRef.current.getScreenshot();
    if (!shot) {
      alert("Camera not ready.");
      return;
    }
    setImageSrc(shot);
    setFile(null); // clear file if camera used
  };

  /* ---------- SEND whichever image is available ---------- */
  const handleSend = async () => {
    let blobToSend = null;

    if (selectedFile) {
      blobToSend = selectedFile; // already a File object
    } else if (imageSrc) {
      // Convert data-URL → Blob
      blobToSend = await fetch(imageSrc).then((r) => r.blob());
      if (!blobToSend || !blobToSend.size) {
        alert("Screenshot blob is empty.");
        return; // don’t append, don’t POST
      }
    } else {
      alert("Choose a file or capture an image first.");
      return;
    }

    const fd = new FormData();
    fd.append("file", blobToSend, blobToSend.name || "receipt.png");

    try {
      const res = await axios.post("http://localhost:5000/upload", fd);
      setReceipt(res.data.receipt);
    } catch (err) {
      console.error("Upload failed:", err.response?.data || err.message);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Receipt Scanner</h1>

      {/* ----------- PICK FROM DEVICE -------------- */}
      <section>
        <h3>📤 Choose Image</h3>
        <input type="file" accept="image/*" onChange={handleChooseFile} />
        {selectedFile && (
          <p style={{ marginTop: "0.5rem" }}>
            Selected: <strong>{selectedFile.name}</strong>
          </p>
        )}
      </section>

      {/* -------------- CAMERA --------------------- */}
      <section style={{ marginTop: "2rem" }}>
        <h3>📷 Camera</h3>
        <Webcam
          ref={webcamRef}
          screenshotFormat="image/png"
          width={280}
          height={280}
          videoConstraints={{ facingMode: "environment" }}
        />
        <div style={{ marginTop: 8 }}>
          <button onClick={handleCapture}>📸 Capture</button>
        </div>
        {imageSrc && (
          <div style={{ marginTop: 8 }}>
            <h4>Preview</h4>
            <img src={imageSrc} alt="preview" width={180} />
          </div>
        )}
      </section>

      {/* -------------- SEND BUTTON ---------------- */}
      <section style={{ marginTop: "2rem" }}>
        <button
          onClick={handleSend}
          disabled={!selectedFile && !imageSrc}
          style={{ padding: "8px 16px", fontSize: 16 }}
        >
          🚀 Send to OCR
        </button>
      </section>

      {/* -------------- RESULT --------------------- */}
      {receipt && (
        <section style={{ marginTop: "2rem" }}>
          <h2>🧾 Extracted Items</h2>
          <ul>
            {receipt.items.map((item, i) => (
              <li key={i}>
                {item.name}: ₹{item.price}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
