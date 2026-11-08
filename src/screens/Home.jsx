import PeaPod from "../components/PeaPod.jsx";
import Icon from "../components/icons.jsx";

const habits = [
  { id: "read", label: "Read", icon: "read", streak: 4, done: true },
  { id: "swim", label: "Swim", icon: "swim", streak: 17, done: true },
  { id: "run", label: "Run", icon: "run", streak: 28, done: false },
];

const podmates = [
  {
    name: "Mark",
    sub: "Read · 11 hrs left",
    photo: "https://i.pravatar.cc/160?img=12",
    icon: "read",
    streak: 9,
    color: "var(--green)",
    fresh: true,
  },
  {
    name: "Emma",
    sub: "Run · 11 hrs left",
    photo: "https://i.pravatar.cc/160?img=47",
    icon: "run",
    streak: 11,
    color: "var(--red)",
    fresh: true,
  },
  {
    name: "Nabil",
    sub: "Swim · 4 hrs left",
    photo: "https://i.pravatar.cc/160?img=33",
    icon: "swim",
    streak: 4,
    color: "var(--green)",
    fresh: false,
  },
];

const pods = [
  {
    name: "Rexall Swim",
    sub: "Matt posted 1 min ago",
    photo: "https://i.pravatar.cc/160?img=65",
    health: 86,
  },
  {
    name: "Volleyball YYC",
    sub: "Emma posted 17 min ago",
    photo: "https://i.pravatar.cc/160?img=52",
    health: 48,
  },
  {
    name: "Knitting Clurb",
    sub: "Alex posted 1 hr ago",
    photo: "https://i.pravatar.cc/160?img=27",
    health: 52,
  },
];

const SEGMENTS = [
  "#f0552f",
  "#f7791f",
  "#f9a01b",
  "#f5c518",
  "#d8d41c",
  "#aadd2f",
  "#6fcf4a",
  "#35a04e",
];

function HealthBar({ value }) {
  const step = Math.max(1, Math.round((value / 100) * SEGMENTS.length));

  return (
    <span className="thermo" aria-label={`Pod health ${value} percent`}>
      <span className="thermo-bulb" style={{ background: SEGMENTS[step - 1] }}>
        <Icon name="heart" size={11} />
      </span>
      <span className="thermo-track">
        <span className="thermo-fill" style={{ width: `${value}%` }} />
      </span>
    </span>
  );
}

export default function Home({ theme, onToggleTheme, onOpenCamera, onOpenPod }) {
  return (
    <>
      <header className="topbar">
        <div className="brand">
          <PeaPod />
          <span>Peas</span>
        </div>
        <div className="topbar-actions">
          <button
            className="icon-btn theme-btn"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={theme === "dark"}
            onClick={onToggleTheme}
          >
            <Icon name={theme === "dark" ? "moon" : "sun"} size={21} />
          </button>
          <button className="icon-btn" aria-label="Add a habit">
            <Icon name="plus" size={22} />
          </button>
          <button className="icon-btn" aria-label="Messages">
            <Icon name="chat" size={22} />
          </button>
        </div>
      </header>

      <div className="rail">
        {habits.map((habit) => (
          <button key={habit.id} className="story" onClick={onOpenCamera}>
            <span className={`story-ring${habit.done ? "" : " rest"}`}>
              <span className="story-face">
                <b className="story-count">{habit.streak}</b>
              </span>
              <span className={`story-badge${habit.done ? "" : " rest"}`}>
                <Icon name={habit.icon} size={15} />
              </span>
            </span>
            <span className="story-label">{habit.label}</span>
          </button>
        ))}
        <button className="story" aria-label="Add a habit">
          <span className="story-ring add">
            <span className="story-face">
              <Icon name="plus" size={24} />
            </span>
          </span>
          <span className="story-label">Add</span>
        </button>
      </div>

      <div className="feed">
        <div className="section-head">
          <h2>Podmates</h2>
          <span>See all</span>
        </div>
        {podmates.map((person) => (
          <div key={person.name} className="row">
            <span className={`av-ring${person.fresh ? "" : " seen"}`}>
              <img src={person.photo} alt="" />
            </span>
            <div>
              <p className="row-name">{person.name}</p>
              <p className="row-sub">{person.sub}</p>
            </div>
            <div className="row-right">
              <span className="streak" style={{ color: person.color }}>
                <Icon name={person.icon} size={19} />
                {person.streak}
              </span>
            </div>
          </div>
        ))}

        <div className="section-head">
          <h2>Pods</h2>
          <span>See all</span>
        </div>
        {pods.map((pod) => (
          <button key={pod.name} className="row" onClick={() => onOpenPod(pod)}>
            <span className="av-ring seen">
              <img src={pod.photo} alt="" />
            </span>
            <div>
              <p className="row-name">{pod.name}</p>
              <p className="row-sub">{pod.sub}</p>
            </div>
            <div className="row-right">
              <HealthBar value={pod.health} />
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
