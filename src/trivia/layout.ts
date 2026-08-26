import { isMobile } from '@dcl/sdk/platform'

// The SDK replaces a 16:9 virtual canvas with 1600x720 on mobile, so every
// absolute position designed for 1920x1080 has to be recomputed there.
const DESKTOP_CANVAS = { width: 1920, height: 1080 }
const MOBILE_CANVAS = { width: 1600, height: 720 }

const MOBILE_HUD_TOP_OFFSET = 72
const MOBILE_HUD_LEFT_OFFSET = -80

export function isMobileLayout(): boolean {
  return isMobile()
}

export function canvasWidth(): number {
  return isMobileLayout() ? MOBILE_CANVAS.width : DESKTOP_CANVAS.width
}

export function centeredLeft(width: number): number {
  return Math.round((canvasWidth() - width) / 2)
}

export function hudTopOffset(): number {
  return isMobileLayout() ? MOBILE_HUD_TOP_OFFSET : 0
}

/** Horizontal anchor shared by every panel of the in-game HUD group. */
export function hudLeft(width: number): number {
  return centeredLeft(width) + (isMobileLayout() ? MOBILE_HUD_LEFT_OFFSET : 0)
}
