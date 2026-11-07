import PeaPod from "../components/PeaPod.jsx";
import Icon from "../components/icons.jsx";

const habits = [
  { id: "read", label: "READ", icon: "read", count: 4, users: "32.2k users" },
  { id: "swim", label: "SWIM", icon: "swim", count: 17, users: "32.2k users" },
  { id: "run", label: "RUN", icon: "run", count: 28, users: "32.2k users" },
];

const podmates = [
  {
    name: "Mark",
    sub: "11hrs left",
    photo: "https://i.pravatar.cc/120?img=12",
    icon: "read",
    count: 9,
    color: "var(--green)",
  },
  {
    name: "Emma",
    sub: "11hrs left",
    photo: "https://i.pravatar.cc/120?img=47",
    icon: "run",
    count: 11,
    color: "var(--red)",
  },
  {
    name: "Nabil",
    sub: "4hrs left",
    photo: "https://i.pravatar.cc/120?img=33",
    icon: "swim",
    count: 4,
    color: "var(--green)",
  },
];

const pods = [
  {
    name: "Rexall Swim",
    sub: "Matt just posted 1min ago",
    photo: "https://i.pravatar.cc/120?img=65",
    health: 86,
    fill: "var(--green)",
  },
  {
    name: "Volleyball YYC",
    sub: "Emma just posted 17mins ago",
    photo: "https://i.pravatar.cc/120?img=52",
    health: 48,
    fill: "var(--amber)",
  },
  {
    name: "Knitting Clurb",
    sub: "Alex just posted 1hr ago",
    photo: "https://i.pravatar.cc/120?img=27",
    health: 52,
    fill: "var(--amber)",
  },
];

function Thermo({ value, fill }) {
  return (
    <div className="thermo" aria-label={`Pod health ${value} percent`}>
      <span className="thermo-bulb">
        <Icon name="heart" />
      </span>
      <span className="thermo-track">
        <span className="thermo-fill" style={{ width: `${value}%`, background: fill }} />
      </span>
    </div>
  );
}

export default function Home({ onOpenPod }) {
  return (
    <>
      <header className="brand">
        <PeaPod />
        <h1>Peas</h1>
      </header>

      <div className="habit-row">
        {habits.map((habit) => (
          <button key={habit.id} className="habit">
            <h2>{habit.label}</h2>
            <div className="habit-mid">
              <Icon name={habit.icon} />
              <b>{habit.count}</b>
            </div>
            <small>{habit.users}</small>
          </button>
        ))}
      </div>

      <div className="feed">
        <h3 className="section-title">Podmates</h3>
        {podmates.map((person) => (
          <div key={person.name} className="row">
            <img src={person.photo} alt="" />
            <div>
              <p className="row-name">{person.name}</p>
              <p className="row-sub">{person.sub}</p>
            </div>
            <div className="row-right">
              <span className="glyph" style={{ color: person.color }}>
                <Icon name={person.icon} />
              </span>
              <span className="count" style={{ color: person.color }}>
                {person.count}
              </span>
            </div>
          </div>
        ))}

        <h3 className="section-title pods-title">Pods</h3>
        {pods.map((pod) => (
          <button key={pod.name} className="row" onClick={() => onOpenPod(pod)}>
            <img src={pod.photo} alt="" />
            <div>
              <p className="row-name">{pod.name}</p>
              <p className="row-sub">{pod.sub}</p>
            </div>
            <div className="row-right">
              <Thermo value={pod.health} fill={pod.fill} />
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
