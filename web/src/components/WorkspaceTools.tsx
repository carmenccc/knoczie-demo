import { Icon } from "./Icon.tsx";

type ThemeName = "light" | "night";

type WorkspaceToolsProps = {
  theme: ThemeName;
  onToggleTheme: () => void;
};

export function WorkspaceTools({ theme, onToggleTheme }: WorkspaceToolsProps) {
  const night = theme === "night";
  return (
    <div className="workspace-tools">
      <button
        className="theme-toggle"
        type="button"
        aria-pressed={night}
        aria-label={night ? "Turn off night mode" : "Turn on night mode"}
        onClick={onToggleTheme}
      >
        <Icon name={night ? "moon" : "sun"} size={18} />
      </button>
      <span className="user-avatar" role="img" aria-label="Account">
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <rect width="64" height="64" fill="#5042B5" />
          <path d="M10 28c2-16 10-22 22-22s20 8 22 22c-8-2-15-7-22-7s-14 5-22 7Z" fill="#33287D" />
          <circle cx="32" cy="30" r="14" fill="#D8B0E8" stroke="#201A4D" strokeWidth="2" />
          <path d="M20 24c1-10 6-14 12-14s11 5 12 14c-6-2-10-5-12-5s-6 3-12 5Z" fill="#695AE2" />
          <ellipse cx="27" cy="31" rx="1.7" ry="2.2" fill="#201A4D" />
          <ellipse cx="37" cy="31" rx="1.7" ry="2.2" fill="#201A4D" />
          <path d="M29 36c1.2 1.2 4.8 1.2 6 0" fill="none" stroke="#A64B78" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M16 58c3-10 9-16 16-16s13 6 16 16" fill="#695AE2" />
        </svg>
      </span>
    </div>
  );
}
