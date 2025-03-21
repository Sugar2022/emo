// src/Components/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase-config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { Line, Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "./Dashboard.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [uid, setUid] = useState("");
  const [username, setUsername] = useState("User");
  const [dailyLogs, setDailyLogs] = useState([]);
  const [moodSummary, setMoodSummary] = useState("");
  const [sleepData, setSleepData] = useState({ below6: 0, between6and8: 0, above8: 0 });
  const [moodChartData, setMoodChartData] = useState({});
  const [sleepChartData, setSleepChartData] = useState({});
  const [emotionsChartData, setEmotionsChartData] = useState({});

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login");
      } else {
        setUid(user.uid);
        // Fetch username from Firebase
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          if (data.username) setUsername(data.username);
        }
        // Fetch daily logs
        fetchDailyLogs(user.uid);
      }
    });
  }, [navigate]);

  const fetchDailyLogs = async (userId) => {
    try {
      const logsCollection = collection(db, "users", userId, "dailyLogs");
      const logsSnapshot = await getDocs(logsCollection);
      const logs = [];
      logsSnapshot.forEach((docItem) => {
        logs.push(docItem.data());
      });
      // Sort logs by date
      logs.sort((a, b) => new Date(a.date) - new Date(b.date));
      setDailyLogs(logs);
      processMoodData(logs);
      processSleepData(logs);
    } catch (error) {
      console.error("Error fetching daily logs:", error);
    }
  };

  // Process mood data to set up the line chart and pie chart for emotions
  const processMoodData = (logs) => {
    const labels = logs.map((log) => log.date);
    const moodValues = logs.map((log) => log.mood);
    // Create a frequency distribution for emotions/moods
    const freq = {};
    moodValues.forEach((m) => {
      freq[m] = (freq[m] || 0) + 1;
    });
    // Set the summary based on the most frequent mood
    const sortedEmotions = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    const topEmotion = sortedEmotions.length > 0 ? sortedEmotions[0][0] : "";
    setMoodSummary(topEmotion ? `Your most recorded mood is: ${topEmotion}` : "");

    // Line chart: Mood over time
    setMoodChartData({
      labels,
      datasets: [
        {
          label: "Daily Mood (scale 1-5)",
          data: moodValues,
          fill: false,
          borderColor: "#4caf50",
          tension: 0.1,
        },
      ],
    });

    // Pie chart: Emotion distribution
    setEmotionsChartData({
      labels: Object.keys(freq),
      datasets: [
        {
          data: Object.values(freq),
          backgroundColor: ["#4caf50", "#ff9800", "#f44336", "#2196f3", "#9c27b0"],
        },
      ],
    });
  };

  // Process sleep data into three categories for the bar chart
  const processSleepData = (logs) => {
    let below6 = 0, between6and8 = 0, above8 = 0;
    logs.forEach((log) => {
      const hours = Number(log.sleepHours);
      if (hours < 6) below6++;
      else if (hours <= 8) between6and8++;
      else above8++;
    });
    setSleepData({ below6, between6and8, above8 });
    setSleepChartData({
      labels: ["Below 6 hrs", "6-8 hrs", "Above 8 hrs"],
      datasets: [
        {
          label: "Sleep Distribution",
          data: [below6, between6and8, above8],
          backgroundColor: ["#e53935", "#fb8c00", "#43a047"],
        },
      ],
    });
  };

  return (
    <div className="dashboard-container">
      <button className="back-button" onClick={() => navigate("/home")}>
        &#8592; Back
      </button>
      <header className="dashboard-header">
        <h1>{username}'s Dashboard</h1>
      </header>

      <div className="charts-container">
        <div className="chart-card">
          <h3>Mood Over Time</h3>
          {moodChartData.labels ? (
            <Line data={moodChartData} />
          ) : (
            <p>No mood data available.</p>
          )}
          <p className="summary-text">{moodSummary}</p>
        </div>
        <div className="chart-card">
          <h3>Sleep Analysis</h3>
          {sleepChartData.labels ? (
            <Bar data={sleepChartData} />
          ) : (
            <p>No sleep data available.</p>
          )}
          <p className="summary-text">
            Out of {dailyLogs.length} days, {sleepData.below6} days below 6 hrs, {sleepData.between6and8} days between 6-8 hrs, and {sleepData.above8} days above 8 hrs.
          </p>
        </div>
        <div className="chart-card">
          <h3>Emotion Distribution</h3>
          {emotionsChartData.labels ? (
            <Pie data={emotionsChartData} />
          ) : (
            <p>No emotion data available.</p>
          )}
        </div>
      </div>

      <div className="details-container">
        <div className="timeline">
          <h3>Daily Logs Timeline</h3>
          <div className="timeline-content">
            {dailyLogs.length > 0 ? (
              dailyLogs.map((log, index) => (
                <div key={index} className="timeline-item">
                  <div className="timeline-date">{log.date}</div>
                  <div className="timeline-info">
                    Mood: {log.mood} | Sleep: {log.sleepHours} hrs
                  </div>
                </div>
              ))
            ) : (
              <p>No daily logs available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
