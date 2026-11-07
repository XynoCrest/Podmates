export default function PeaPod({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 220 170"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M46 58 C34 46 26 34 34 24"
        stroke="currentColor"
        strokeWidth="7.5"
        strokeLinecap="round"
      />
      <path
        d="M52 64
           C78 28 148 22 184 56
           C206 76 204 108 174 126
           C138 150 78 142 54 108
           C42 88 42 74 52 64 Z"
        stroke="currentColor"
        strokeWidth="7.5"
        strokeLinejoin="round"
      />
      <circle cx="86" cy="86" r="15" stroke="currentColor" strokeWidth="6.5" />
      <circle cx="118" cy="78" r="15" stroke="currentColor" strokeWidth="6.5" />
      <circle cx="150" cy="82" r="15" stroke="currentColor" strokeWidth="6.5" />
      <circle cx="176" cy="96" r="13.5" stroke="currentColor" strokeWidth="6.5" />
    </svg>
  );
}
