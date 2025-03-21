import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase-config";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";
import "./Home.css";

// Mood images
import emo1 from "../../assets/emo/1.png";
import emo2 from "../../assets/emo/2.png";
import emo3 from "../../assets/emo/3.png";
import emo4 from "../../assets/emo/4.png";
import emo5 from "../../assets/emo/5.png";

// Therapy images
import breathingImg from "../../assets/card/breathing.png";
import musicImg     from "../../assets/card/music.png";
import cbtImg       from "../../assets/card/cbt.png";
import gamesImg     from "../../assets/card/games.png";

const moodIcons = [emo1, emo2, emo3, emo4, emo5];

// Example emotion words
const allEmotions = [
  "Happy", "Sad", "Anxious", "Excited", "Stressed",
  "Relaxed", "Angry", "Lonely", "Grateful", "Motivated"
];

export default function Home() {
  const navigate = useNavigate();
  const [uid, setUid] = useState("");
  const [username, setUsername] = useState("User");

  // For storing each day's mood in the calendar
  const [recordedMoods, setRecordedMoods] = useState({}); 
  const [isLoading, setIsLoading] = useState(true);

  // Current displayed month/year
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);

  // Wizard states
  const [step, setStep] = useState(1);
  const [mood, setMood] = useState(3);
  const [selectedEmotions, setSelectedEmotions] = useState([]);
  const [journal, setJournal] = useState("");
  const [bedTime, setBedTime] = useState("");
  const [wakeTime, setWakeTime] = useState("");
  const [sleepHours, setSleepHours] = useState(0);
  const [message, setMessage] = useState("");

  // Fetch user data and recorded moods
  useEffect(() => {
    const fetchUserData = async (userId) => {
      try {
        // Fetch username
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          if (data.username) setUsername(data.username);
        }
        
        // Fetch all daily logs
        const logsCollection = collection(db, "users", userId, "dailyLogs");
        const logsSnapshot = await getDocs(logsCollection);
        
        const moodsData = {};
        logsSnapshot.forEach((doc) => {
          const logData = doc.data();
          if (logData.date && logData.mood) {
            moodsData[logData.date] = logData.mood;
          }
        });
        
        setRecordedMoods(moodsData);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setIsLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/login");
      } else {
        setUid(user.uid);
        fetchUserData(user.uid);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Fetch existing data when clicking on a date
  const fetchDateData = async (dateKey) => {
    if (!uid) return;
    
    try {
      const logRef = doc(db, "users", uid, "dailyLogs", dateKey);
      const logSnap = await getDoc(logRef);
      
      if (logSnap.exists()) {
        const data = logSnap.data();
        setMood(data.mood || 3);
        setSelectedEmotions(data.emotions || []);
        setJournal(data.journal || "");
        setBedTime(data.bedTime || "");
        setWakeTime(data.wakeTime || "");
        setSleepHours(data.sleepHours || 0);
      } else {
        // Reset form if no data exists
        setMood(3);
        setSelectedEmotions([]);
        setJournal("");
        setBedTime("");
        setWakeTime("");
        setSleepHours(0);
      }
    } catch (error) {
      console.error("Error fetching date data:", error);
    }
  };

  // Generate real calendar data for the current month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0..11
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Figure out which weekday the 1st is (0=Sunday,1=Monday,...)
  const firstDayWeekday = new Date(year, month, 1).getDay(); 
  // We want Monday-based or Sunday-based? We'll assume Sunday=0, Monday=1, ...
  // We'll create blank squares for offset
  const blanksBefore = (firstDayWeekday + 6) % 7; 
  // e.g. if 1st is Wed (3), then blanksBefore= (3+6)%7=2 => meaning Monday(1), Tuesday(2)...

  // For highlighting today's date
  const realToday = new Date();

  // ===--- Handling the wizard & saving data ---===

  const handleDateClick = (day) => {
    // day is 1..daysInMonth
    const newDate = new Date(year, month, day);
    setCurrentDate(newDate);
    setStep(1);
    setMessage("");
    
    // Format date as YYYY-MM-DD for Firestore
    const dateKey = newDate.toISOString().split("T")[0];
    
    // Fetch existing data for this date
    fetchDateData(dateKey);
    
    setShowModal(true);
  };

  // Emotions multi-select
  const toggleEmotion = (em) => {
    setSelectedEmotions(prev => 
      prev.includes(em) ? prev.filter(e=>e!==em) : [...prev, em]
    );
  };

  // Next / Back in wizard
  const handleNext = () => {
    if (step < 4) setStep(step + 1);
    else saveDailyLog();
  };
  const handleBack = () => { if (step>1) setStep(step-1); };

  // Sleep hour calculation
  const computeSleepHours = (bed, wake) => {
    if (!bed || !wake) return setSleepHours(0);
    let [bh, bm] = bed.split(":").map(Number);
    let [wh, wm] = wake.split(":").map(Number);
    let bedTotal = bh*60 + bm;
    let wakeTotal = wh*60 + wm;
    if (wakeTotal < bedTotal) wakeTotal += 24*60;
    const diff = wakeTotal - bedTotal;
    setSleepHours((diff/60).toFixed(1));
  };
  const handleBedTimeChange = val => {
    setBedTime(val);
    computeSleepHours(val, wakeTime);
  };
  const handleWakeTimeChange = val => {
    setWakeTime(val);
    computeSleepHours(bedTime, val);
  };

  // Save doc
  const saveDailyLog = async () => {
    if (!uid) return;
    setMessage("");
    const dateKey = currentDate.toISOString().split("T")[0];
    try {
      await setDoc(doc(db, "users", uid, "dailyLogs", dateKey), {
        date: dateKey,
        mood,
        emotions: selectedEmotions,
        journal,
        bedTime,
        wakeTime,
        sleepHours
      });
      setMessage("You have successfully recorded your day!");
      
      // Update local state
      setRecordedMoods(prev => ({...prev, [dateKey]: mood}));
      
      // Close modal after a short delay
      setTimeout(() => {
        setShowModal(false);
      }, 1000);
    } catch(err) {
      setMessage(err.message);
    }
  };

  // Wizard steps
  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="modal-step">
            <h2>How is your mood?</h2>
            <div className="mood-row">
              {moodIcons.map((icon, i) => (
                <img
                  key={i}
                  src={icon}
                  alt={`mood${i+1}`}
                  className={`mood-icon ${mood===i+1?"active":""}`}
                  onClick={()=>setMood(i+1)}
                />
              ))}
            </div>
            <div className="button-row">
              <button className="primary-btn" onClick={handleNext}>Next</button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="modal-step">
            <h2>What emotions did you feel?</h2>
            <div className="emotions-grid">
              {allEmotions.map(em => (
                <div
                  key={em}
                  className={`emotion-block ${selectedEmotions.includes(em)?"selected":""}`}
                  onClick={()=>toggleEmotion(em)}
                >
                  {em}
                </div>
              ))}
            </div>
            <div className="button-row">
              <button className="secondary-btn" onClick={handleBack}>Back</button>
              <button className="primary-btn" onClick={handleNext}>Next</button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="modal-step">
            <h2>Write About Your Day</h2>
            <textarea
              className="text-area"
              placeholder="How was your day?"
              value={journal}
              onChange={e=>setJournal(e.target.value)}
            />
            <div className="button-row">
              <button className="secondary-btn" onClick={handleBack}>Back</button>
              <button className="primary-btn" onClick={handleNext}>Next</button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="modal-step">
            <h2>Record Sleep</h2>
            <div className="sleep-row">
              <div>
                <label>Bed Time</label>
                <input
                  type="time"
                  value={bedTime}
                  onChange={e=>handleBedTimeChange(e.target.value)}
                />
              </div>
              <div>
                <label>Wake Time</label>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={e=>handleWakeTimeChange(e.target.value)}
                />
              </div>
            </div>
            <p style={{marginBottom:"10px"}}>Total Sleep: {sleepHours} hrs</p>
            <div className="button-row">
              <button className="secondary-btn" onClick={handleBack}>Back</button>
              <button className="primary-btn" onClick={saveDailyLog}>Done</button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Navbar actions
  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  // Create array of blank squares for offset
  const offset = blanksBefore; // Using the previously calculated blanksBefore
  // We'll create a small helper
  const blanks = Array.from({ length: offset }, (_,i)=>null);

  // Render the days
  const daysArray = [];
  for (let d=1; d<=daysInMonth; d++) {
    daysArray.push(d);
  }

  return (
    <div className="home-bg-blur">
      {/* NAVBAR */}
      <div className="navbar">
        <div className="nav-left">
          <h3>Hey {username}, how are you feeling today?</h3>
        </div>
        <div className="nav-right">
          <button onClick={()=>navigate("/home")}>Home</button>
          <button onClick={()=>navigate("/analysis")}>Analysis</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="home-content">
        {/* Left side: Calendar (50%) */}
        <div className="calendar-side">
          <h2 className="calendar-title">
            {currentDate.toLocaleString("default",{month:"long"})} {year}
          </h2>
          {/* Weekday headers */}
          <div className="calendar-weekdays">
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=>(
              <div key={d} className="weekday-header">{d}</div>
            ))}
          </div>
          <div className="calendar-grid">
            {blanks.map((_,i)=><div key={`blank${i}`} />)}
            {daysArray.map(day => {
              const dayDate = new Date(year, month, day);
              const dateKey = dayDate.toISOString().split("T")[0];
              const recordedMood = recordedMoods[dateKey] || 0;

              // highlight if matches real system date
              const isToday = (
                realToday.getFullYear()===year &&
                realToday.getMonth()===month &&
                realToday.getDate()===day
              );
              return (
                <div
                  key={day}
                  className={`day-circle ${isToday?"today":""}`}
                  onClick={()=>handleDateClick(day)}
                >
                  {isLoading ? (
                    <div className="loading-indicator"></div>
                  ) : recordedMood > 0 ? (
                    <img src={moodIcons[recordedMood-1]} alt="mood" className="calendar-mood-icon"/>
                  ) : day}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right side: Therapies */}
        <div className="therapy-side">
          <h2>Explore Therapies</h2>
          <div className="therapy-grid">
            <div className="therapy-card">
              <img src={breathingImg} alt="Breathing"/>
              <p>Breathing Exercises</p>
            </div>
            <div className="therapy-card">
              <img src={musicImg} alt="Music"/>
              <p>Music Therapy</p>
            </div>
            <div className="therapy-card">
              <img src={cbtImg} alt="CBT"/>
              <p>CBT Therapy</p>
            </div>
            <div className="therapy-card">
              <img src={gamesImg} alt="Games"/>
              <p>Stress Relief Games</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Wizard */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-btn" onClick={()=>setShowModal(false)}>×</button>
            {renderStep()}
            {message && <p className="success-msg">{message}</p>}
          </div>
        </div>
      )}
    </div>
  );
}