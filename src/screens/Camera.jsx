export default function Camera({ onClose }) {
  return (
    <section className="camera">
      <div className="viewfinder" />
      <div className="cam-bar">
        <button className="cam-close" onClick={onClose}>
          Close
        </button>
        <button className="cam-shutter" aria-label="Take photo" onClick={onClose} />
        <span style={{ width: 44 }} />
      </div>
    </section>
  );
}
