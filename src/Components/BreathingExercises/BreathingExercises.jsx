import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./BreathingExercises.css";

// Define exercise data
const breathingExercises = {
  "Box Breathing": {
    inhale: 4,
    hold: 4,
    exhale: 4,
    hold2: 4,
    description:
      "Box breathing involves four equal phases: inhale, hold, exhale, and hold. Each phase lasts 4 seconds.",
  },
  "4-7-8 Breathing": {
    inhale: 4,
    hold: 7,
    exhale: 8,
    // For 4-7-8, no second hold is needed
    hold2: 0,
    description:
      "4-7-8 breathing helps you relax by inhaling for 4 seconds, holding for 7 seconds, and exhaling for 8 seconds.",
  },
};

const BreathingExercises = () => {
  const navigate = useNavigate();

  const [selectedExercise, setSelectedExercise] = useState("Box Breathing");
  const [phase, setPhase] = useState("idle"); // phases: idle, inhale, hold, exhale, hold2
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef(null);

  // Capitalize the current phase for display
  const getPhaseTitle = (p) => p.charAt(0).toUpperCase() + p.slice(1);

  // Color changes based on the current phase
  const getCircleColor = () => {
    switch (phase) {
      case "inhale":
        return "#2e7d32"; // green
      case "hold":
        return "#fb8c00"; // orange
      case "exhale":
        return "#e53935"; // red
      case "hold2":
        return "#ab47bc"; // purple
      default:
        return "#2e7d32"; // default green
    }
  };

  const startExercise = () => {
    setIsRunning(true);
    setPhase("inhale");
    setTimeLeft(breathingExercises[selectedExercise].inhale);
  };

  const stopExercise = () => {
    clearTimeout(timerRef.current);
    setIsRunning(false);
    setPhase("idle");
    setTimeLeft(0);
  };

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      // Transition to the next phase
      const { inhale, hold, exhale, hold2 } = breathingExercises[selectedExercise];

      if (phase === "inhale") {
        if (hold > 0) {
          setPhase("hold");
          setTimeLeft(hold);
        } else {
          setPhase("exhale");
          setTimeLeft(exhale);
        }
      } else if (phase === "hold") {
        setPhase("exhale");
        setTimeLeft(exhale);
      } else if (phase === "exhale") {
        if (hold2 > 0) {
          setPhase("hold2");
          setTimeLeft(hold2);
        } else {
          setPhase("inhale");
          setTimeLeft(inhale);
        }
      } else if (phase === "hold2") {
        setPhase("inhale");
        setTimeLeft(inhale);
      }
    }
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, isRunning, phase, selectedExercise]);

  // Compute a scale value for the breathing circle (grows on inhale, shrinks on exhale)
  const getCircleScale = () => {
    const { inhale, exhale } = breathingExercises[selectedExercise];
    if (phase === "inhale") {
      // Scale from 1 to 1.5 during inhalation
      return 1 + ((inhale - timeLeft) / inhale) * 0.5;
    } else if (phase === "exhale") {
      // Scale from 1.5 back to 1 during exhalation
      return 1 + (timeLeft / exhale) * 0.5;
    }
    return 1;
  };

  return (
    <div className="breathing-page-container">
      <div className="breathing-container">
        {/* Home Button */}
        <button className="home-button" onClick={() => navigate("/home")}>
          Home
        </button>

        <h1>Breathing Exercises for Mental Health</h1>

        <div className="exercise-selector">
          <label htmlFor="exercise">Choose an exercise: </label>
          <select
            id="exercise"
            value={selectedExercise}
            onChange={(e) => {
              setSelectedExercise(e.target.value);
              stopExercise();
            }}
            disabled={isRunning}
          >
            {Object.keys(breathingExercises).map((exercise) => (
              <option key={exercise} value={exercise}>
                {exercise}
              </option>
            ))}
          </select>
        </div>

        <div className="exercise-description">
          <p>{breathingExercises[selectedExercise].description}</p>
        </div>

        <div className="controls">
          {!isRunning ? (
            <button onClick={startExercise} className="start-btn">
              Start
            </button>
          ) : (
            <button onClick={stopExercise} className="stop-btn">
              Stop
            </button>
          )}
        </div>

        {isRunning && (
          <div className="breathing-phase fade-in">
            <h2>{getPhaseTitle(phase)}</h2>
            <p>
              {timeLeft} second{timeLeft !== 1 ? "s" : ""}
            </p>
            <div
              className="breathing-circle"
              style={{
                transform: `scale(${getCircleScale()})`,
                backgroundColor: getCircleColor(),
              }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BreathingExercises;
