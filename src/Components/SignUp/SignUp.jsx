// src/Components/SignUp/SignUp.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase-config";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import "./SignUp.css";

const SignUp = () => {
  const [username, setUsername]       = useState("");
  const [email, setEmail]            = useState("");
  const [password, setPassword]       = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleSignUp = async () => {
    setErrorMessage("");
    if (!username || !email || !password) {
      setErrorMessage("All fields are required!");
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Save username, email in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        username,
        email,
        createdAt: new Date(),
      });
      // On success, go to onboarding
      navigate("/onboarding");
    } catch (error) {
      // Handle known error codes or default to error.message
      if (error.code === "auth/email-already-in-use") {
        setErrorMessage("That email is already in use. Please log in or use a different email.");
      } else if (error.code === "auth/weak-password") {
        setErrorMessage("Your password is too weak. Try a stronger password.");
      } else {
        setErrorMessage(error.message);
      }
    }
  };

  return (
    <div className="signup-overlay">
      <div className="background-blur"></div>

      <div className="signup-container">
        <h2 className="signup-title">Sign Up</h2>
        <div className="signup-form">
          <input
            type="text"
            className="signup-input"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="email"
            className="signup-input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="signup-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="signup-button" onClick={handleSignUp}>
            Sign Up
          </button>
        </div>

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <p className="toggle-text">
          Already have an account? <span onClick={() => navigate("/login")}>Log In here</span>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
