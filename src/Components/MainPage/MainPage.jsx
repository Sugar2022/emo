// src/Components/MainPage/MainPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../../assets/main.png"; // Update path if needed
import "./MainPage.css";

const MainPage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    // Redirect to sign up page
    navigate("/signup");
  };

  return (
    <div className="container" style={{ backgroundImage: `url(${backgroundImage})` }}>
      {/* Optional smoke animations */}
      <div className="smoke"></div>
      <div className="smoke smoke2"></div>
      <div className="smoke smoke3"></div>
      <h1 className="title">EMO-Talk</h1>
      <button className="start-button" onClick={handleGetStarted}>
        Get Started
      </button>
    </div>
  );
};

export default MainPage;
