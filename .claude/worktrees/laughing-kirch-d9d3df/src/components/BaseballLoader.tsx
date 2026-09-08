export default function BaseballLoader() {
  return (
    <div className="baseball-loader">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#9954d2" strokeWidth="2">
        <circle cx="16" cy="16" r="14" />
        <path d="M11 5C12 9 12 13 10 16s-5 5-7 6" strokeLinecap="round" />
        <path d="M21 5C20 9 20 13 22 16s5 5 7 6" strokeLinecap="round" />
        <path d="M10 16c.7 2 .7 4-1.5 7" strokeLinecap="round" />
        <path d="M22 16c-.7 2-.7 4 1.5 7" strokeLinecap="round" />
      </svg>
    </div>
  );
}
