// src/App.jsx
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import MainPage from "./Components/MainPage/MainPage";
import SignUp from "./Components/SignUp/SignUp";
import Login from "./Components/Login/Login";
import Home from "./Components/Home/Home";
import OnboardingWizard from "./Components/OnboardingWizard/OnboardingWizard";
import Cbt from "./Components/Cbt/Cbt";
import Dashboard from "./Components/Dashboard/Dashboard";
import BreathingExercises from "./Components/BreathingExercises/BreathingExercises";

// ScrollToTop component to reset scroll position on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
};

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Landing page */}
        <Route path="/" element={<MainPage />} />
        
        {/* Auth pages */}
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        
        {/* Onboarding */}
        <Route path="/onboarding" element={<OnboardingWizard />} />
        
        {/* Main application pages */}
        <Route path="/home" element={<Home />} />
        <Route path="/breathing" element={<BreathingExercises />} />
        <Route path="/cbt" element={<Cbt />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Redirect any unknown route to MainPage */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;