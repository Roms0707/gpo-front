export interface ElementRect {
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
const TOOLTIP_HEIGHT = 180;
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

export function calculateTooltipPosition(
  elementRect: ElementRect,
  preferredPosition: 'top' | 'bottom' | 'left' | 'right' | 'center' = 'bottom'
): TooltipPosition {
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  const scrollY = window.scrollY;

  const elementCenterX = elementRect.left + elementRect.width / 2;
  const elementCenterY = elementRect.top + elementRect.height / 2;

  const spaceAbove = elementRect.top - scrollY;
  const spaceBelow = viewportHeight - (elementRect.bottom - scrollY);
  const spaceLeft = elementRect.left;
  const spaceRight = viewportWidth - elementRect.right;

  let position = preferredPosition;

  if (position === 'bottom' && spaceBelow < TOOLTIP_HEIGHT + VIEWPORT_PADDING) {
    position = spaceAbove > TOOLTIP_HEIGHT + VIEWPORT_PADDING ? 'top' : 'bottom';
  } else if (position === 'top' && spaceAbove < TOOLTIP_HEIGHT + VIEWPORT_PADDING) {
    position = spaceBelow > TOOLTIP_HEIGHT + VIEWPORT_PADDING ? 'bottom' : 'top';
  }

  let top: number;
  let left: number;
  let arrowPosition: 'top' | 'bottom' | 'left' | 'right';

  switch (position) {
    case 'top':
      top = elementRect.top - TOOLTIP_HEIGHT - ARROW_OFFSET;
      left = elementCenterX - TOOLTIP_WIDTH / 2;
      arrowPosition = 'bottom';
      break;
    case 'bottom':
      top = elementRect.bottom + ARROW_OFFSET;
      left = elementCenterX - TOOLTIP_WIDTH / 2;
      arrowPosition = 'top';
      break;
    case 'left':
      top = elementCenterY - TOOLTIP_HEIGHT / 2;
      left = elementRect.left - TOOLTIP_WIDTH - ARROW_OFFSET;
      arrowPosition = 'right';
      break;
    case 'right':
      top = elementCenterY - TOOLTIP_HEIGHT / 2;
      left = elementRect.right + ARROW_OFFSET;
      arrowPosition = 'left';
      break;
    default:
      top = viewportHeight / 2 - TOOLTIP_HEIGHT / 2 + scrollY;
      left = viewportWidth / 2 - TOOLTIP_WIDTH / 2;
      arrowPosition = 'bottom';
  }

  left = Math.max(VIEWPORT_PADDING, Math.min(left, viewportWidth - TOOLTIP_WIDTH - VIEWPORT_PADDING));
  top = Math.max(scrollY + VIEWPORT_PADDING, top);

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
