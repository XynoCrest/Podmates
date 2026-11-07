export default function Splash({ onStart }) {
  return (
    <section className="splash">
      <img className="splash-art" src="/podmates.webp" alt="Introducing Podmates" />
      <div className="splash-actions">
        <button className="btn-outline hit" onClick={onStart}>
          Get Started
        </button>
        <button className="btn-round hit" onClick={onStart} aria-label="Continue">
          →
        </button>
      </div>
    </section>
  );
}
