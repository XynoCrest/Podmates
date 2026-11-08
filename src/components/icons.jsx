const line = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

/* ---- habit glyphs (inside story rings) ---- */

function Read(props) {
  return (
    <svg viewBox="0 0 24 24" {...line} {...props}>
      <path d="M12 7.3C10.4 6 8.6 5.4 6 5.4c-.7 0-1.2.5-1.2 1.2v9.6c0 .7.5 1.2 1.2 1.2 2.6 0 4.4.6 6 1.9 1.6-1.3 3.4-1.9 6-1.9.7 0 1.2-.5 1.2-1.2V6.6c0-.7-.5-1.2-1.2-1.2-2.6 0-4.4.6-6 1.9Z" />
      <path d="M12 7.3v11" />
    </svg>
  );
}

function Swim(props) {
  return (
    <svg viewBox="0 0 24 24" {...line} {...props}>
      <circle cx="17.2" cy="7.4" r="1.9" />
      <path d="M5.6 12.4l6.6 1.5 4-2.5" />
      <path d="M3 18c1.8-1.6 3.6-1.6 5.4 0 1.8 1.6 3.6 1.6 5.4 0 1.8-1.6 3.6-1.6 5.4 0 .6.5 1.2.8 1.8.8" />
    </svg>
  );
}

function Run(props) {
  return (
    <svg viewBox="0 0 24 24" {...line} {...props}>
      <circle cx="15.4" cy="5.2" r="1.9" />
      <path d="M14.2 9c1.4-.2 2.4.4 2.9 1.6l.7 1.7 2.4 1.1" />
      <path d="M15.2 13.1l1.1 2.9 1.8 3.4" />
      <path d="M14.6 10.5l-3.8 3.3-1.6 3.4" />
      <path d="M10.6 8.6 6.9 7.9" />
    </svg>
  );
}

/* ---- ui glyphs ---- */

function Flame(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13 2c.5 2.7-.5 4.2-1.9 5.6C9.4 9.3 7.4 10.8 7.4 14c0 3.8 2.8 6.5 6.4 6.5 3.7 0 6.3-2.5 6.3-6.2 0-2.8-1.3-4.9-2.8-6.4.2 1.7-.4 3-1.6 3.6C16.2 8 14.9 4.4 13 2Z" />
    </svg>
  );
}

function Heart(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 20.6S2.8 15 2.8 9.2C2.8 6.3 5 4.3 7.6 4.3c1.8 0 3.4 1 4.4 2.6 1-1.6 2.6-2.6 4.4-2.6 2.6 0 4.8 2 4.8 4.9 0 5.8-9.2 11.4-9.2 11.4Z" />
    </svg>
  );
}

function Plus(props) {
  return (
    <svg viewBox="0 0 24 24" {...line} strokeWidth="2.2" {...props}>
      <path d="M12 5.6v12.8M5.6 12h12.8" />
    </svg>
  );
}

function Camera(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M3.4 9.6c0-1.5 1.2-2.7 2.7-2.7h1.4l1-1.9c.2-.4.6-.6 1.1-.6h4.8c.5 0 .9.2 1.1.6l1 1.9h1.4c1.5 0 2.7 1.2 2.7 2.7v7.6c0 1.5-1.2 2.7-2.7 2.7H6.1a2.7 2.7 0 0 1-2.7-2.7V9.6Z" />
      <circle cx="12" cy="13.4" r="4.4" fill="#fff" />
      <circle cx="12" cy="13.4" r="2.8" fill="currentColor" />
    </svg>
  );
}

function Sun(props) {
  return (
    <svg viewBox="0 0 24 24" {...line} strokeWidth="2" {...props}>
      <circle cx="12" cy="12" r="4.1" />
      <path d="M12 2.6v2.4M12 19v2.4M4.3 4.3l1.7 1.7M18 18l1.7 1.7M2.6 12H5M19 12h2.4M4.3 19.7 6 18M18 6l1.7-1.7" />
    </svg>
  );
}

function Moon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M20.3 15.2A8.6 8.6 0 0 1 9.4 4.1a8.9 8.9 0 1 0 10.9 11.1Z" />
    </svg>
  );
}

/* ---- nav: outline + filled pairs ---- */

function Home({ active, ...props }) {
  if (active) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
        <path d="M11.4 3.3a1 1 0 0 1 1.2 0l8.6 6.6c.3.2.4.5.4.8v9.5c0 .6-.5 1.1-1.1 1.1h-5.3v-6.2H8.8v6.2H3.5c-.6 0-1.1-.5-1.1-1.1v-9.5c0-.3.1-.6.4-.8l8.6-6.6Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" {...line} {...props}>
      <path d="M3.3 10.3 12 3.6l8.7 6.7v9.3c0 .5-.4.9-.9.9h-4.6v-6.1H9.8v6.1H4.2c-.5 0-.9-.4-.9-.9v-9.3Z" />
    </svg>
  );
}

function Chat({ active, ...props }) {
  if (active) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
        <path d="M12 3.4c5 0 8.9 3.3 8.9 7.5s-4 7.5-8.9 7.5c-.9 0-1.8-.1-2.6-.3l-4.4 2 1.1-3.5c-1.8-1.4-2.9-3.3-2.9-5.7 0-4.2 3.9-7.5 8.8-7.5Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" {...line} {...props}>
      <path d="M12 3.9c4.7 0 8.4 3.1 8.4 7s-3.7 7-8.4 7c-.9 0-1.8-.1-2.6-.3l-4 1.8 1-3.2c-1.7-1.3-2.8-3.1-2.8-5.3 0-3.9 3.7-7 8.4-7Z" />
    </svg>
  );
}

function Person({ active, ...props }) {
  if (active) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
        <circle cx="12" cy="8.1" r="4.3" />
        <path d="M3.9 20.4c.7-4.2 4-6.6 8.1-6.6s7.4 2.4 8.1 6.6c.1.6-.4 1.1-1 1.1H4.9c-.6 0-1.1-.5-1-1.1Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" {...line} {...props}>
      <circle cx="12" cy="8.2" r="4" />
      <path d="M4.6 20.3c.7-3.9 3.7-6.1 7.4-6.1s6.7 2.2 7.4 6.1" />
    </svg>
  );
}

export const ICONS = {
  read: Read,
  swim: Swim,
  run: Run,
  flame: Flame,
  heart: Heart,
  plus: Plus,
  camera: Camera,
  sun: Sun,
  moon: Moon,
  home: Home,
  chat: Chat,
  person: Person,
};

export default function Icon({ name, size = 22, active, className }) {
  const Glyph = ICONS[name];
  if (!Glyph) return null;
  return <Glyph width={size} height={size} active={active} className={className} />;
}
