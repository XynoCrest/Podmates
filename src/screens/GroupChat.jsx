export default function GroupChat({ habit, onBack }) {
  const health = habit?.group?.health ?? habit?.health ?? 82;
  const name = habit?.group?.name ?? habit?.name ?? "Pod";
  const messages = [
    { who: "Amina", text: "Frosty this morning, bring a layer." },
    { who: "Jonas", text: "I'm at the trailhead." },
    { who: "Mei", text: "On my way 🚶" },
  ];

  return (
    <section className="screen chat">
      <header className="chat-top">
        <button className="chip ghost" onClick={onBack}>
          Back
        </button>
        <div>
          <strong>
            <span aria-hidden="true">{habit?.emoji}</span> {name}
          </strong>
          <div className="health">
            <span style={{ width: `${health}%` }} />
          </div>
        </div>
      </header>
      <div className="chat-log">
        {messages.map((message) => (
          <div key={message.text} className="bubble">
            <em>{message.who}</em>
            <p>{message.text}</p>
          </div>
        ))}
      </div>
      <p className="note">Group chat is pod-only. No private DMs.</p>
    </section>
  );
}
