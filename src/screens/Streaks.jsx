const habits = [
  { id: "walk", emoji: "🚶", name: "Walk or move", streak: 9 },
  { id: "cook", emoji: "🍳", name: "Cook at home", streak: 4 },
  { id: "stretch", emoji: "🧘", name: "Stretch", streak: 2 },
  { id: "frosty", emoji: "🌅", name: "Frosty loop", streak: 6 },
];

const podmates = [
  {
    name: "Amina",
    tag: "Friend",
    status: "checked in today",
    streak: 14,
    done: true,
    habit: "🏊",
  },
  {
    name: "Jonas",
    tag: "Matched",
    status: "checked in today",
    streak: 11,
    done: true,
    habit: "🍳",
  },
  {
    name: "Mei",
    tag: "Matched",
    status: "checked in today",
    streak: 8,
    done: true,
    habit: "🧘",
  },
  {
    name: "Sam",
    tag: "Friend",
    status: "not yet today",
    streak: 6,
    habit: "🚶",
  },
];

const pods = [
  {
    id: "walk",
    name: "Morning Walkers NW",
    status: "1 check-in to go",
    emoji: "🚶",
    health: 82,
  },
  {
    id: "cook",
    name: "Anisa's Kitchen",
    status: "checked in today",
    emoji: "🍳",
    health: 64,
  },
  {
    id: "stretch",
    name: "5-min stretch",
    status: "rest day",
    emoji: "🧘",
    health: 41,
  },
  {
    id: "frosty",
    name: "Frosty loop",
    status: "checked in today",
    emoji: "🌅",
    health: 70,
  },
];

const HEALTH_COLORS = [
  "#e74c3c",
  "#e67e22",
  "#f39c12",
  "#f1c40f",
  "#c5e017",
  "#9acd32",
  "#7ed957",
  "#2ecc71",
];

function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 8.5A2.5 2.5 0 0 1 6.5 6h2L10 4h4l1.5 2h2A2.5 2.5 0 0 1 20 8.5v9A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-9Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="13" r="3.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function GroupIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="2.4" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="15.5" cy="8.5" r="2.1" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M4.8 17.2c.4-2.6 2.4-4 4.7-4s4.2 1.4 4.6 4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M13.2 13.6c1.6-.4 3.4.3 4.2 2.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HealthBar({ value }) {
  const filled = Math.max(1, Math.round((value / 100) * HEALTH_COLORS.length));
  return (
    <div className="health-bar" aria-label={`${value}% healthy`}>
      <span className="health-heart" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="12" height="12">
          <path
            fill="currentColor"
            d="M12 20.4s-6.7-4.2-9.2-8.1C1.2 10 1.5 6.8 4.2 5.4 6.3 4.3 8.6 5 12 8.2c3.4-3.2 5.7-3.9 7.8-2.8 2.7 1.4 3 4.6 1.4 6.9-2.5 3.9-9.2 8.1-9.2 8.1Z"
          />
        </svg>
      </span>
      <div className="health-pills">
        {HEALTH_COLORS.map((color, index) => (
          <i
            key={color}
            style={{ background: index < filled ? color : "#2a2a2a" }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Streaks({ onCheckIn, onOpenChat }) {
  return (
    <section className="streaks">
      <header className="topbar">
        <div>
          <p className="eyebrow">Saturday · 1 check-in to go for your pod</p>
          <h1>Streaks</h1>
        </div>
        <button className="cam" onClick={onCheckIn} aria-label="Open camera">
          <CameraIcon />
        </button>
      </header>

      <div className="habits">
        {habits.map((habit) => (
          <div key={habit.id} className={`habit${habit.id === "walk" ? " active" : ""}`}>
            <div className="flame">
              <span className="habit-emoji" aria-hidden="true">
                {habit.emoji}
              </span>
              <span aria-hidden="true">🔥</span>
              {habit.streak}
            </div>
            <strong>{habit.name}</strong>
          </div>
        ))}
      </div>

      <div className="people">
        <div className="list-head">
          <strong>Podmates</strong>
        </div>
        {podmates.map((person) => (
          <div key={person.name} className="person">
            <div className={`avatar${person.done ? " done" : ""}`}>{person.name[0]}</div>
            <div>
              <p className="who">
                {person.name}
                <em>{person.tag}</em>
              </p>
              <p className="meta">{person.status}</p>
            </div>
            <div className="right row">
              <span className="habit-badge" aria-label="Shared habit">
                {person.habit}
              </span>
              <span className="streak-n">🔥 {person.streak}</span>
            </div>
          </div>
        ))}

        <div className="list-head pods-head">
          <strong>Pods</strong>
        </div>
        {pods.map((pod) => (
          <button
            key={pod.id}
            className="person pod-row"
            onClick={() => onOpenChat({ ...pod, group: { name: pod.name, health: pod.health } })}
          >
            <div className="avatar group-av">
              <GroupIcon />
            </div>
            <div>
              <p className="who">{pod.name}</p>
              <p className="meta">{pod.status}</p>
            </div>
            <div className="right pod-right">
              <HealthBar value={pod.health} />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
