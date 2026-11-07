export default function Camera({ onClose }) {
  return (
    <section className="camera">
      <div className="cam-top">
        <button className="chip ghost" onClick={onClose}>
          Close
        </button>
        <p className="meta">Live camera only · no gallery</p>
      </div>
      <div className="viewfinder" />
      <div className="tags">
        <span className="tag on">Day 10</span>
        <span className="tag">Frosty loop</span>
        <span className="tag">With a friend</span>
        <span className="tag">Early start</span>
      </div>
      <div className="cam-bottom">
        <span />
        <button className="shutter" aria-label="Shutter" onClick={onClose} />
        <span />
      </div>
    </section>
  );
}
