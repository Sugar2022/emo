import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase-config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import "./OnboardingWizard.css";

// Import images directly
import step1Img from "../../assets/step1.png";
import step2Img from "../../assets/step2.png";
import thanksImg from "../../assets/thanks.png";

// Import scale icons
import icon0 from "../../assets/images/1.png";
import icon1 from "../../assets/images/2.png";
import icon2 from "../../assets/images/3.png";
import icon3 from "../../assets/images/4.png";
import icon4 from "../../assets/images/5.png";
import icon5 from "../../assets/images/6.png";
import icon6 from "../../assets/images/7.png";
import icon7 from "../../assets/images/8.png";
import icon8 from "../../assets/images/9.png";
import icon9 from "../../assets/images/10.png";
import icon10 from "../../assets/images/11.png";

const scaleData = [
  { value: 0, desc: "No distress", img: icon0 },
  { value: 1, desc: "Barely noticeable", img: icon1 },
  { value: 2, desc: "Mild distress", img: icon2 },
  { value: 3, desc: "Uncomfortable", img: icon3 },
  { value: 4, desc: "Somewhat distressing", img: icon4 },
  { value: 5, desc: "Moderate distress", img: icon5 },
  { value: 6, desc: "Fairly high distress", img: icon6 },
  { value: 7, desc: "Very distressing", img: icon7 },
  { value: 8, desc: "Severe distress", img: icon8 },
  { value: 9, desc: "Intense distress", img: icon9 },
  { value: 10, desc: "Maximum distress", img: icon10 },
];

const OnboardingWizard = () => {
  // same logic as before
  const [currentStep, setCurrentStep] = useState(1);
  const [distressLevel, setDistressLevel] = useState(5);
  const [issueDescription, setIssueDescription] = useState("");
  const [lifeDifferent, setLifeDifferent] = useState("");
  const [userId, setUserId] = useState(null);

  const navigate = useNavigate();
  const totalSteps = 5;

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        navigate("/signup");
      }
    });
  }, [navigate]);

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      if (currentStep === 4) {
        await storeOnboardingData();
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const storeOnboardingData = async () => {
    if (!userId) return;
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        onboardingAnswers: {
          distressLevel,
          issueDescription,
          lifeDifferent,
        },
      });
    } catch (error) {
      console.error("Error storing onboarding data:", error);
    }
  };

  const renderStepBars = () => {
    if (currentStep === 5) return null;
    return (
      <div className="step-bars">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`step-bar ${currentStep === step ? "active" : ""}`}
          ></div>
        ))}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <img
              src={step1Img}
              alt="Welcome"
              className="step-image-large"
            />
            <h2>Welcome!</h2>
            <p>We’d like to learn a bit about you.</p>
            <div className="button-row">
              <button
                className="secondary-btn"
                onClick={() => navigate("/home")}
              >
                Skip
              </button>
              <button className="primary-btn" onClick={handleNext}>
                Next
              </button>
            </div>
          </div>
        );

      case 2: {
        const currentScale = scaleData.find(
          (s) => s.value === Number(distressLevel)
        );
        return (
          <div className="step-content">
            <img
              src={step2Img}
              alt="Distress Level"
              className="step-image-medium"
            />
            <h2>Distress Level</h2>
            <p>How much distress are you experiencing right now?</p>
            <input
              type="range"
              min="0"
              max="10"
              value={distressLevel}
              onChange={(e) => setDistressLevel(e.target.value)}
              className="distress-slider"
            />
            <div className="distress-info">
              <img
                src={currentScale?.img}
                alt="Scale icon"
                className="distress-icon"
              />
              <p>{currentScale?.desc}</p>
            </div>
            <div className="button-row">
              <button className="secondary-btn" onClick={handleBack}>
                Back
              </button>
              <button className="primary-btn" onClick={handleNext}>
                Next
              </button>
            </div>
          </div>
        );
      }

      case 3:
        return (
          <div className="step-content">
            <h2>What Brings You Here?</h2>
            <textarea
              className="text-area"
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              placeholder="E.g., I feel like I have no energy..."
            />
            <div className="button-row">
              <button className="secondary-btn" onClick={handleBack}>
                Back
              </button>
              <button className="primary-btn" onClick={handleNext}>
                Next
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="step-content">
            <h2>Future Vision</h2>
            <p>How do you imagine your life if these issues were resolved?</p>
            <textarea
              className="text-area"
              value={lifeDifferent}
              onChange={(e) => setLifeDifferent(e.target.value)}
              placeholder="E.g., I'd be more energetic and productive..."
            />
            <div className="button-row">
              <button className="secondary-btn" onClick={handleBack}>
                Back
              </button>
              <button className="primary-btn" onClick={handleNext}>
                Finish
              </button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="step-content">
            {/* If you have a "thanks" image, use it here */}
            <img
              src={thanksImg}
              alt="Thanks"
              className="step-image-medium"
            />
            <h2>Thanks for Sharing!</h2>
            <p>Welcome to EMO-Talk. We’re here to support you!</p>
            <button className="primary-btn" onClick={() => navigate("/home")}>
              Continue
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="onboarding-overlay">
      {/* Blurred background */}
      <div className="onboarding-background"></div>

      {/* Crisp wizard container */}
      <div className="onboarding-container">
        {renderStepBars()}
        {renderStepContent()}
      </div>
    </div>
  );
};

export default OnboardingWizard;
