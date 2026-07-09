export function BreathLine({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M2 34C 46 6, 84 6, 122 34C 160 62, 198 62, 236 34C 274 6, 312 6, 350 34C 388 62, 426 62, 464 34C 495 12, 522 8, 552 26"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="576" cy="32" r="5" fill="currentColor" />
    </svg>
  );
}
