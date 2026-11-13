export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 120" width={size} height={size * 1.2} fill="none" aria-hidden="true">
      <path d="M16 6h68a10 10 0 0 1 10 10v50c0 24-24 42-44 52C30 108 6 90 6 66V16A10 10 0 0 1 16 6z" fill="#0b2a6b" />
      <g stroke="#f2f5fa" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M50 54V42" />
        <path d="M44 48L32 38" />
        <path d="M56 48L68 38" />
        <path d="M28 66c8-3 15-2 20 4v30c-5-6-12-7-20-4z" />
        <path d="M72 66c-8-3-15-2-20 4v30c5-6 12-7 20-4z" />
      </g>
      <circle cx="50" cy="58" r="9" fill="#f2f5fa" />
      <circle cx="50" cy="36" r="5" fill="#f2f5fa" />
      <circle cx="30" cy="36" r="5" fill="#f2f5fa" />
      <circle cx="70" cy="36" r="5" fill="#f2f5fa" />
    </svg>
  );
}
