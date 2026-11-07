import { useState } from "react";
import Splash from "./screens/Splash.jsx";
import Streaks from "./screens/Streaks.jsx";
import Camera from "./screens/Camera.jsx";
import GroupChat from "./screens/GroupChat.jsx";

const tabs = [
  { id: "streaks", label: "Streaks" },
  { id: "community", label: "Community" },
  { id: "me", label: "Me" },
];

export default function App() {
  const [started, setStarted] = useState(
    typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).has("app")
  );
  const [tab, setTab] = useState("streaks");
  const [camera, setCamera] = useState(false);
  const [chat, setChat] = useState(null);

  return (
    <div className="stage">
      <div className="phone">
        {!started ? (
          <Splash onStart={() => setStarted(true)} />
        ) : camera ? (
          <Camera onClose={() => setCamera(false)} />
        ) : chat ? (
          <GroupChat habit={chat} onBack={() => setChat(null)} />
        ) : (
          <div className="screen">
            {tab === "streaks" ? (
              <Streaks
                onCheckIn={() => setCamera(true)}
                onOpenChat={(habit) => setChat(habit)}
              />
            ) : (
              <div className="placeholder">
                <p>{tab} comes next. Streaks is the first page.</p>
              </div>
            )}
            <nav className="tabbar">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  className={`tab${tab === item.id ? " on" : ""}`}
                  onClick={() => setTab(item.id)}
                >
                  <span>{item.id === "streaks" ? "🔥" : item.id === "community" ? "💬" : "●"}</span>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
