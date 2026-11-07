import { useState } from "react";
import Home from "./screens/Home.jsx";
import Camera from "./screens/Camera.jsx";
import Icon from "./components/icons.jsx";

const tabs = [
  { id: "chat", icon: "chat", label: "Chats" },
  { id: "camera", icon: "camera", label: "Camera" },
  { id: "home", icon: "home", label: "Home" },
  { id: "me", icon: "person", label: "Profile" },
];

export default function App() {
  const [tab, setTab] = useState("home");
  const [camera, setCamera] = useState(false);

  return (
    <div className="stage">
      <div className="phone">
        {tab === "home" ? (
          <Home onOpenPod={() => setTab("chat")} />
        ) : (
          <div className="feed" style={{ display: "grid", placeItems: "center" }}>
            <p className="row-sub">{tab} coming next</p>
          </div>
        )}

        <nav className="nav">
          {tabs.map((item) => (
            <button
              key={item.id}
              className={tab === item.id ? "on" : undefined}
              aria-label={item.label}
              onClick={() => (item.id === "camera" ? setCamera(true) : setTab(item.id))}
            >
              <Icon name={item.icon} />
            </button>
          ))}
        </nav>

        {camera ? <Camera onClose={() => setCamera(false)} /> : null}
      </div>
    </div>
  );
}
