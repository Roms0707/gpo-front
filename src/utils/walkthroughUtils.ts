export interface ElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

export interface ViewportRelativeRect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

export interface TooltipPosition {
  top: number;
  left: number;
  arrowPosition: 'top' | 'bottom' | 'left' | 'right';
}

const TOOLTIP_WIDTH = 320;
const TOOLTIP_HEIGHT = 200;
const ARROW_OFFSET = 16;
const VIEWPORT_PADDING = 20;
const SPOTLIGHT_PADDING = 12;

export function getElementRect(elementId: string): ElementRect | null {
  const element = document.getElementById(elementId);
  if (!element) return null;

  const rect = element.getBoundingClientRect();
  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    width: rect.width,
    height: rect.height,
    bottom: rect.bottom + window.scrollY,
    right: rect.right + window.scrollX,
  };
}

export function getViewportRect(elementId: string): DOMRect | null {
  const element = document.getElementById(elementId);
  if (!element) return null;
  return element.getBoundingClientRect();
}

export function getVisiblePortionRect(elementId: string): ViewportRelativeRect | null {
  const element = document.getElementById(elementId);
  if (!element) return null;

  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  const visibleTop = Math.max(0, rect.top);
  const visibleLeft = Math.max(0, rect.left);
  const visibleBottom = Math.min(viewportHeight, rect.bottom);
  const visibleRight = Math.min(viewportWidth, rect.right);

  if (visibleBottom <= visibleTop || visibleRight <= visibleLeft) {
    return null;
  }

  return {
    top: visibleTop,
    left: visibleLeft,
    width: visibleRight - visibleLeft,
    height: visibleBottom - visibleTop,
    bottom: visibleBottom,
    right: visibleRight,
  };
}

interface PositionCandidate {
  position: 'top' | 'bottom' | 'left' | 'right';
  top: number;
  left: number;
  arrowPosition: 'top' | 'bottom' | 'left' | 'right';
  score: number;
}

export function calculateTooltipPosition(
  viewportRect: ViewportRelativeRect,
  preferredPosition: 'top' | 'bottom' | 'left' | 'right' | 'center' = 'bottom'
): TooltipPosition {
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  const elementCenterX = viewportRect.left + viewportRect.width / 2;
  const elementCenterY = viewportRect.top + viewportRect.height / 2;

  const spaceAbove = viewportRect.top;
  const spaceBelow = viewportHeight - viewportRect.bottom;
  const spaceLeft = viewportRect.left;
  const spaceRight = viewportWidth - viewportRect.right;

  const candidates: PositionCandidate[] = [];

  const topCandidate: PositionCandidate = {
    position: 'top',
    top: viewportRect.top - TOOLTIP_HEIGHT - ARROW_OFFSET,
    left: elementCenterX - TOOLTIP_WIDTH / 2,
    arrowPosition: 'bottom',
    score: spaceAbove >= TOOLTIP_HEIGHT + ARROW_OFFSET + VIEWPORT_PADDING ? spaceAbove : -1,
  };
  candidates.push(topCandidate);

  const bottomCandidate: PositionCandidate = {
    position: 'bottom',
    top: viewportRect.bottom + ARROW_OFFSET,
    left: elementCenterX - TOOLTIP_WIDTH / 2,
    arrowPosition: 'top',
    score: spaceBelow >= TOOLTIP_HEIGHT + ARROW_OFFSET + VIEWPORT_PADDING ? spaceBelow : -1,
  };
  candidates.push(bottomCandidate);

  const leftCandidate: PositionCandidate = {
    position: 'left',
    top: elementCenterY - TOOLTIP_HEIGHT / 2,
    left: viewportRect.left - TOOLTIP_WIDTH - ARROW_OFFSET,
    arrowPosition: 'right',
    score: spaceLeft >= TOOLTIP_WIDTH + ARROW_OFFSET + VIEWPORT_PADDING ? spaceLeft : -1,
  };
  candidates.push(leftCandidate);

  const rightCandidate: PositionCandidate = {
    position: 'right',
    top: elementCenterY - TOOLTIP_HEIGHT / 2,
    left: viewportRect.right + ARROW_OFFSET,
    arrowPosition: 'left',
    score: spaceRight >= TOOLTIP_WIDTH + ARROW_OFFSET + VIEWPORT_PADDING ? spaceRight : -1,
  };
  candidates.push(rightCandidate);

  let selected: PositionCandidate | null = null;

  const preferred = candidates.find(c => c.position === preferredPosition);
  if (preferred && preferred.score > 0) {
    selected = preferred;
  }

  if (!selected) {
    const validCandidates = candidates.filter(c => c.score > 0);
    if (validCandidates.length > 0) {
      selected = validCandidates.reduce((best, current) =>
        current.score > best.score ? current : best
      );
    }
  }

  if (!selected) {
    if (spaceBelow >= spaceAbove) {
      selected = bottomCandidate;
    } else {
      selected = topCandidate;
    }
  }

  let { top, left } = selected;
  const { arrowPosition } = selected;

  left = Math.max(VIEWPORT_PADDING, Math.min(left, viewportWidth - TOOLTIP_WIDTH - VIEWPORT_PADDING));
  top = Math.max(VIEWPORT_PADDING, top);
  top = Math.min(top, viewportHeight - TOOLTIP_HEIGHT - VIEWPORT_PADDING);

  return { top, left, arrowPosition };
}

export function generateSpotlightStyles(elementRect: ElementRect | null): React.CSSProperties {
  if (!elementRect) {
    return {
      background: 'rgba(0, 0, 0, 0.75)',
    };
  }

  const scrollY = window.scrollY;
  const adjustedTop = elementRect.top - scrollY;

  const spotlightTop = adjustedTop - SPOTLIGHT_PADDING;
  const spotlightLeft = elementRect.left - SPOTLIGHT_PADDING;
  const spotlightWidth = elementRect.width + SPOTLIGHT_PADDING * 2;
  const spotlightHeight = elementRect.height + SPOTLIGHT_PADDING * 2;
  const borderRadius = 12;

  return {
    background: `radial-gradient(
      ellipse ${spotlightWidth + 40}px ${spotlightHeight + 40}px at ${spotlightLeft + spotlightWidth / 2}px ${spotlightTop + spotlightHeight / 2}px,
      transparent 0%,
      transparent ${Math.min(spotlightWidth, spotlightHeight) / 2}px,
      rgba(0, 0, 0, 0.75) ${Math.max(spotlightWidth, spotlightHeight) / 2 + 20}px
    )`,
    maskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Crect width='100%25' height='100%25' fill='white'/%3E%3Crect x='${spotlightLeft}' y='${spotlightTop}' width='${spotlightWidth}' height='${spotlightHeight}' rx='${borderRadius}' fill='black'/%3E%3C/svg%3E")`,
    WebkitMaskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Crect width='100%25' height='100%25' fill='white'/%3E%3Crect x='${spotlightLeft}' y='${spotlightTop}' width='${spotlightWidth}' height='${spotlightHeight}' rx='${borderRadius}' fill='black'/%3E%3C/svg%3E")`,
  };
}

export function scrollToElement(elementId: string, offset: number = 100): void {
  const element = document.getElementById(elementId);
  if (!element) return;

  const rect = element.getBoundingClientRect();
  const elementTop = rect.top + window.scrollY;
  const targetScroll = elementTop - offset;

  window.scrollTo({
    top: Math.max(0, targetScroll),
    behavior: 'smooth',
  });
}

export function scrollToTop(): void {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
}

export function isElementInViewport(elementId: string): boolean {
  const element = document.getElementById(elementId);
  if (!element) return false;

  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.right <= window.innerWidth
  );
}
