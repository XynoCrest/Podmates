import { useEffect, useState } from "react";
import Home from "./screens/Home.jsx";
import Camera from "./screens/Camera.jsx";
import Icon from "./components/icons.jsx";

function initialTheme() {
  const saved = localStorage.getItem("peas-theme");
  if (saved) return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function App() {
  const [tab, setTab] = useState("home");
  const [camera, setCamera] = useState(false);
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#14171a" : "#ffffff");
    localStorage.setItem("peas-theme", theme);
  }, [theme]);

  return (
    <div className="stage">
      <div className="phone">
        {tab === "home" ? (
          <Home
            theme={theme}
            onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
            onOpenCamera={() => setCamera(true)}
            onOpenPod={() => setTab("chat")}
          />
        ) : (
          <div className="placeholder">
            <p>{tab} coming next</p>
          </div>
        )}

        <nav className="nav">
          <button
            className={tab === "home" ? "on" : undefined}
            aria-label="Home"
            onClick={() => setTab("home")}
          >
            <Icon name="home" size={25} active={tab === "home"} />
          </button>
          <button
            className={tab === "chat" ? "on" : undefined}
            aria-label="Chats"
            onClick={() => setTab("chat")}
          >
            <Icon name="chat" size={25} active={tab === "chat"} />
          </button>
          <button className="shutter-btn" aria-label="Check in" onClick={() => setCamera(true)}>
            <Icon name="camera" size={27} />
          </button>
          <button
            className={tab === "me" ? "on" : undefined}
            aria-label="Profile"
            onClick={() => setTab("me")}
          >
            <Icon name="person" size={25} active={tab === "me"} />
          </button>
        </nav>

        {camera ? <Camera onClose={() => setCamera(false)} /> : null}
      </div>
    </div>
  );
}
