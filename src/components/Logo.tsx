export function Logo() {
  return (
    <span className="brand">
      <svg viewBox="0 0 40 44" aria-hidden="true">
        <path
          d="M6 40V19a14 14 0 0 1 28 0v21M13 40V19a7 7 0 0 1 14 0v21"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.3"
        />
        <path d="M3 40h34" stroke="currentColor" strokeWidth="2.3" />
      </svg>
      <span>
        itinera<span className="brand-dot">.</span>
      </span>
    </span>
  );
}
