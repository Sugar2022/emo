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
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
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
  const [topEmotions, setTopEmotions] = useState([]);

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
      // Sort logs by date ascending
      logs.sort((a, b) => new Date(a.date) - new Date(b.date));
      setDailyLogs(logs);
      processMoodData(logs);
      processSleepData(logs);
      processEmotionData(logs);
    } catch (error) {
      console.error("Error fetching daily logs:", error);
    }
  };

  // Process mood data for line chart and mood summary
  const processMoodData = (logs) => {
    const labels = logs.map((log) => log.date);
    const moodValues = logs.map((log) => log.mood);
    // Create a frequency distribution for moods
    const freq = {};
    moodValues.forEach((m) => {
      freq[m] = (freq[m] || 0) + 1;
    });
    // Determine the most frequent mood
    const sortedEmotions = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    const topMood = sortedEmotions.length > 0 ? sortedEmotions[0][0] : "";
    setMoodSummary(topMood ? `Your most recorded mood is: ${topMood}` : "");

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
  };

  // Process sleep data for bar chart
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

  // Process emotion data for pie chart and top emotions text
  const processEmotionData = (logs) => {
    const emotionCount = {};
    logs.forEach((log) => {
      if (log.emotions && Array.isArray(log.emotions)) {
        log.emotions.forEach((em) => {
          emotionCount[em] = (emotionCount[em] || 0) + 1;
        });
      }
    });
    const sortedEmotions = Object.entries(emotionCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    setTopEmotions(sortedEmotions.map(([emotion, count]) => `${emotion}: ${count} times`));
    setEmotionsChartData({
      labels: sortedEmotions.map(([emotion]) => emotion),
      datasets: [
        {
          data: sortedEmotions.map(([_, count]) => count),
          backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
        },
      ],
    });
  };

  // Function to generate PDF report of the dashboard
  const generatePDF = () => {
    const input = document.getElementById("dashboard-report");
    html2canvas(input)
      .then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save("dashboard.pdf");
      })
      .catch((error) => {
        console.error("Error generating PDF:", error);
      });
  };

  return (
    <div id="dashboard-report" className="dashboard-container">
      {/* Back button navigates to home page */}
      <button className="back-button" onClick={() => navigate("/home")}>
        &#8592; Back
      </button>
      <header className="dashboard-header">
        <h1>{username}'s Dashboard</h1>
        <button
          className="pdf-button"
          onClick={generatePDF}
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            padding: "8px 12px",
            border: "none",
            borderRadius: "4px",
            background: "#2e7d32",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          PDF
        </button>
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
          {topEmotions.length > 0 && (
            <p className="summary-text">{topEmotions.join(", ")}</p>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="timeline-container">
        <h3>Daily Logs</h3>
        {dailyLogs.length > 0 ? (
          <ul className="timeline">
            {dailyLogs.map((log, index) => (
              <li key={index}>
                <strong>{log.date}</strong> - Mood: {log.mood}, Sleep: {log.sleepHours} hrs
                <br />
                Emotions: {log.emotions.join(", ")}
                <br />
                Journal: "{log.journal}"
              </li>
            ))}
          </ul>
        ) : (
          <p>No daily logs available.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
