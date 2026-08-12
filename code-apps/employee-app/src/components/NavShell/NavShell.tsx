import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import "./NavShell.css";

export interface NavEntry {
  to: string;
  label: string;
  icon: ReactNode;
  disabled?: boolean;
  disabledHint?: string;
}

const NAV_ENTRIES: NavEntry[] = [
  { to: "/submit", label: "Submit", icon: <IconSubmit /> },
  { to: "/browse", label: "Browse", icon: <IconBrowse /> },
  { to: "/map", label: "Map", icon: <IconMap /> },
  { to: "/leaderboards", label: "Leaderboards", icon: <IconLeaderboard /> },
  {
    to: "/chat",
    label: "Chat",
    icon: <IconChat />,
    disabled: true,
    disabledHint: "Coming soon",
  },
];

interface NavShellProps {
  children: ReactNode;
}

/**
 * Responsive app shell: a fry-gold sidebar on desktop (>=1024px), a bottom
 * tab bar on mobile — same nav entries either way. Comptoir Championship
 * design language per code-apps/DESIGN.md (sticker shadows, pill nav items,
 * gravy-ink borders).
 */
export function NavShell({ children }: NavShellProps) {
  return (
    <div className="nav-shell">
      <aside className="nav-shell__sidebar" aria-label="Primary navigation">
        <div className="nav-shell__brand">
          <span className="nav-shell__brand-mark" aria-hidden="true">
            🍟
          </span>
          <span className="nav-shell__brand-name">Poutine League</span>
        </div>
        <nav className="nav-shell__nav-list">
          {NAV_ENTRIES.map((entry) => (
            <NavItem key={entry.to} entry={entry} />
          ))}
        </nav>
      </aside>

      <main className="nav-shell__content">{children}</main>

      <nav className="nav-shell__bottom-bar" aria-label="Primary navigation">
        {NAV_ENTRIES.map((entry) => (
          <NavItem key={entry.to} entry={entry} variant="bottom" />
        ))}
      </nav>
    </div>
  );
}

function NavItem({
  entry,
  variant = "sidebar",
}: {
  entry: NavEntry;
  variant?: "sidebar" | "bottom";
}) {
  const className = `nav-shell__item nav-shell__item--${variant}`;

  if (entry.disabled) {
    return (
      <span
        className={`${className} nav-shell__item--disabled`}
        title={entry.disabledHint}
        aria-disabled="true"
      >
        <span className="nav-shell__item-icon">{entry.icon}</span>
        <span className="nav-shell__item-label">{entry.label}</span>
        {entry.disabledHint && (
          <span className="nav-shell__item-badge">{entry.disabledHint}</span>
        )}
      </span>
    );
  }

  return (
    <NavLink
      to={entry.to}
      className={({ isActive }) =>
        `${className}${isActive ? " nav-shell__item--active" : ""}`
      }
    >
      <span className="nav-shell__item-icon">{entry.icon}</span>
      <span className="nav-shell__item-label">{entry.label}</span>
    </NavLink>
  );
}

/* Minimal inline icon set — plain geometric strokes, no icon-tile chrome
   per DESIGN.md's "no generic rounded-icon-tile" rule. */
function IconSubmit() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4v16M4 12h16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function IconBrowse() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function IconMap() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M9 4v14M15 6v14" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function IconLeaderboard() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 20V10M12 20V4M18 20v-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function IconChat() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 5h16v11H8l-4 4V5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
