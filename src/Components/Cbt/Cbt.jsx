// src/Components/Cbt/Cbt.jsx

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import "./Cbt.css";

const Cbt = () => {
  const navigate = useNavigate();

  // Timer state (seconds)
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef(null);

  // Start timer on mount
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Helper to format seconds as MM:SS
  const formatTime = (time) => {
    const mins = Math.floor(time / 60).toString().padStart(2, "0");
    const secs = (time % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  // Record Voice handler (UI only)
  const handleRecordVoice = () => {
    alert("Voice recording started... (UI only)");
  };

  // End session => navigate to /home
  const handleEndSession = () => {
    alert("Session ended. Navigating to Home...");
    navigate("/home");
  };

  return (
    <div className="cbt-container">
      {/* Navbar (optional) */}
      <header className="cbt-navbar">
        <h2 className="cbt-title">EMO-TALK</h2>
        <nav>
          <a href="/home">Home</a>
        </nav>
      </header>

      {/* Main Content */}
      <div className="cbt-content">
        {/* Session Timer */}
        <div className="cbt-timer-box">
          <p>
            Session Time: <span className="cbt-timer">{formatTime(seconds)}</span>
          </p>
        </div>

        {/* Webcam feed */}
        <div className="cbt-webcam-wrapper">
          <Webcam
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "user" }}
            className="cbt-webcam"
          />
        </div>

        {/* Buttons row */}
        <div className="cbt-buttons">
          <button className="record-btn" onClick={handleRecordVoice}>
            Record Voice
          </button>
          <button className="end-btn" onClick={handleEndSession}>
            End Session
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cbt;
