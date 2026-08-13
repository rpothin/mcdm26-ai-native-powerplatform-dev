import type { ReactNode } from "react";
import "./EmptyState.css";

interface EmptyStateProps {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
}

/**
 * Standard placeholder for screens that don't yet have real content —
 * used across Phase 0's nav shell for every screen before its feature
 * work lands. Card treatment per DESIGN.md (`card-poutine`-style
 * container: paper-white, md radius, sticker shadow).
 */
export function EmptyState({ eyebrow, title, description, children }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {eyebrow && <p className="empty-state__eyebrow">{eyebrow}</p>}
      <h1 className="empty-state__title">{title}</h1>
      <p className="empty-state__description">{description}</p>
      {children}
    </div>
  );
}
