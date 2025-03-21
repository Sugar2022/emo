// src/Components/Login/Login.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase-config";
import { signInWithEmailAndPassword } from "firebase/auth";
import "./Login.css";

const Login = () => {
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  const handleLogin = async () => {
    // Clear previous error
    setErrorMessage("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // On success, navigate to home
      navigate("/home");
    } catch (error) {
      // Show inline error message instead of alert
      setErrorMessage(error.message);
    }
  };

  return (
    <div className="login-overlay">
      {/* Blurred background image element */}
      <div className="login-background"></div>

      {/* Crisp login modal on top */}
      <div className="login-container">
        <h2 className="login-title">Log In</h2>
        <div className="login-form">
          <input
            type="email"
            className="login-input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="login-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="login-button" onClick={handleLogin}>
            Log In
          </button>
        </div>

        {/* Inline error message in red */}
        {errorMessage && <p className="error-message">{errorMessage}</p>}

        {/* Toggle text at the bottom */}
        <p className="toggle-text">
          Don’t have an account?{" "}
          <span onClick={() => navigate("/signup")}>Sign Up here</span>
        </p>
      </div>
    </div>
  );
};

export default Login;
