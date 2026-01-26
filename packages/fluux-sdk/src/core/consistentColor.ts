/**
 * XEP-0392: Consistent Color Generation
 *
 * Generates consistent colors from strings (JIDs, nicknames) using the
 * XEP-0392 algorithm. The same input always produces the same color,
 * ensuring visual consistency across clients.
 *
 * Algorithm:
 * 1. SHA-1 hash the UTF-8 encoded input string
 * 2. Extract least-significant 16 bits to get a hue angle (0-360°)
 * 3. Convert HSLuv(hue, saturation, lightness) to RGB
 *
 * HSLuv is used instead of HSL for perceptually uniform colors -
 * all hues appear equally bright at the same lightness value.
 *
 * @see https://xmpp.org/extensions/xep-0392.html
 */

// ============================================================================
// HSLuv Color Space Implementation
// Based on https://www.hsluv.org/
// ============================================================================

// sRGB D65 reference white
const REF_U = 0.19783000664283681
const REF_V = 0.468319994938791

// CIE LUV constants
const KAPPA = 903.2962962962963
const EPSILON = 0.008856451679035631

// sRGB to XYZ matrix (D65)
const M_INV: [number, number, number][] = [
  [3.240969941904521, -1.537383177570093, -0.498610760293],
  [-0.96924363628087, 1.8759675015077202, 0.041555057407175],
  [0.055630079696993, -0.20397695888897, 1.0569715142428786],
]

/**
 * Calculate the bounds of the RGB gamut for a given lightness in LCH space.
 * These bounds define the maximum chroma available at each hue angle.
 */
function getBounds(l: number): [number, number][] {
  const result: [number, number][] = []
  const sub1 = Math.pow(l + 16, 3) / 1560896
  const sub2 = sub1 > EPSILON ? sub1 : l / KAPPA

  for (let c = 0; c < 3; c++) {
    const m1 = M_INV[c][0]
    const m2 = M_INV[c][1]
    const m3 = M_INV[c][2]

    for (let t = 0; t < 2; t++) {
      const top1 = (284517 * m1 - 94839 * m3) * sub2
      const top2 = (838422 * m3 + 769860 * m2 + 731718 * m1) * l * sub2 - 769860 * t * l
      const bottom = (632260 * m3 - 126452 * m2) * sub2 + 126452 * t
      result.push([top1 / bottom, top2 / bottom])
    }
  }

  return result
}

/**
 * Calculate the maximum chroma available at a given hue and lightness.
 */
function maxChromaForLH(l: number, h: number): number {
  const hrad = (h / 360) * Math.PI * 2
  const bounds = getBounds(l)
  let min = Infinity

  for (const [m, b] of bounds) {
    const length = b / (Math.sin(hrad) - m * Math.cos(hrad))
    if (length >= 0) {
      min = Math.min(min, length)
    }
  }

  return min
}

/**
 * Convert L*u*v* to XYZ color space.
 */
function luvToXyz(l: number, u: number, v: number): [number, number, number] {
  if (l === 0) return [0, 0, 0]

  const varU = u / (13 * l) + REF_U
  const varV = v / (13 * l) + REF_V
  const y = l > KAPPA * EPSILON ? Math.pow((l + 16) / 116, 3) : l / KAPPA
  const x = y * 9 * varU / (4 * varV)
  const z = y * (12 - 3 * varU - 20 * varV) / (4 * varV)

  return [x, y, z]
}

/**
 * Convert XYZ to linear RGB (before gamma correction).
 */
function xyzToRgb(x: number, y: number, z: number): [number, number, number] {
  return [
    M_INV[0][0] * x + M_INV[0][1] * y + M_INV[0][2] * z,
    M_INV[1][0] * x + M_INV[1][1] * y + M_INV[1][2] * z,
    M_INV[2][0] * x + M_INV[2][1] * y + M_INV[2][2] * z,
  ]
}

/**
 * Apply sRGB gamma correction to a linear RGB value.
 */
function toSrgb(c: number): number {
  if (c <= 0.0031308) {
    return 12.92 * c
  }
  return 1.055 * Math.pow(c, 1 / 2.4) - 0.055
}

/**
 * Convert LCH (Lightness, Chroma, Hue) to L*u*v*.
 */
function lchToLuv(l: number, c: number, h: number): [number, number, number] {
  const hrad = (h / 360) * Math.PI * 2
  return [l, Math.cos(hrad) * c, Math.sin(hrad) * c]
}

/**
 * Convert HSLuv to LCH (Lightness, Chroma, Hue).
 * HSLuv saturation is relative to the maximum chroma available at that hue/lightness.
 */
function hsluvToLch(h: number, s: number, l: number): [number, number, number] {
  if (l > 99.9999999) return [100, 0, h]
  if (l < 0.00000001) return [0, 0, h]

  const max = maxChromaForLH(l, h)
  const c = max / 100 * s

  return [l, c, h]
}

/**
 * Convert HSLuv color to RGB.
 *
 * @param h - Hue angle (0-360)
 * @param s - Saturation (0-100)
 * @param l - Lightness (0-100)
 * @returns RGB values as [r, g, b] where each is 0-255
 */
export function hsluvToRgb(h: number, s: number, l: number): [number, number, number] {
  const [lch_l, lch_c, lch_h] = hsluvToLch(h, s, l)
  const [luv_l, luv_u, luv_v] = lchToLuv(lch_l, lch_c, lch_h)
  const [x, y, z] = luvToXyz(luv_l, luv_u, luv_v)
  const [lr, lg, lb] = xyzToRgb(x, y, z)

  // Apply gamma correction and clamp to [0, 255]
  const r = Math.round(Math.max(0, Math.min(1, toSrgb(lr))) * 255)
  const g = Math.round(Math.max(0, Math.min(1, toSrgb(lg))) * 255)
  const b = Math.round(Math.max(0, Math.min(1, toSrgb(lb))) * 255)

  return [r, g, b]
}

// ============================================================================
// XEP-0392 Implementation
// ============================================================================

/**
 * Generate a consistent hue angle from a string using SHA-1.
 *
 * Per XEP-0392:
 * 1. UTF-8 encode the input
 * 2. SHA-1 hash
 * 3. Extract least-significant 16 bits (first two bytes, little-endian)
 * 4. Map to 0-360 degree range
 *
 * @param input - String to generate hue from (JID, nickname, etc.)
 * @returns Hue angle in degrees (0-360)
 */
export async function generateHueAngle(input: string): Promise<number> {
  // UTF-8 encode the input
  const encoder = new TextEncoder()
  const data = encoder.encode(input)

  // SHA-1 hash
  const hashBuffer = await crypto.subtle.digest('SHA-1', data)
  const hashArray = new Uint8Array(hashBuffer)

  // Extract least-significant 16 bits (first two bytes, little-endian)
  // Per XEP-0392: "the two least significant bits of the hash (first two bytes, with the second byte being the most significant one)"
  const value = hashArray[0] | (hashArray[1] << 8)

  // Map to hue angle (0-360)
  return (value / 65536) * 360
}

/**
 * Synchronous hue generation for environments where async is inconvenient.
 * Uses a simple hash function instead of SHA-1 (djb2 algorithm).
 *
 * Note: This produces different results than the async version and is
 * not XEP-0392 compliant. Use generateHueAngle() for compliance.
 *
 * @param input - String to generate hue from
 * @returns Hue angle in degrees (0-360)
 */
export function generateHueAngleSync(input: string): number {
  // djb2 hash algorithm
  let hash = 5381
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(i)
  }

  // Ensure positive value and map to 0-360
  const positiveHash = hash >>> 0
  return (positiveHash % 65536) / 65536 * 360
}

/**
 * Color generation options.
 */
export interface ConsistentColorOptions {
  /**
   * Saturation (0-100). Default: 100
   * Higher values produce more vivid colors.
   */
  saturation?: number

  /**
   * Lightness (0-100). Default: 50
   * Adjust based on background: higher for dark backgrounds, lower for light.
   */
  lightness?: number
}

/**
 * Default options for light theme (dark text on light background).
 * Lightness 35 provides good contrast on white backgrounds.
 */
export const LIGHT_THEME_DEFAULTS: Required<ConsistentColorOptions> = {
  saturation: 100,
  lightness: 35,
}

/**
 * Default options for dark theme (light text on dark background).
 */
export const DARK_THEME_DEFAULTS: Required<ConsistentColorOptions> = {
  saturation: 100,
  lightness: 65,
}

/**
 * Generate a consistent color from a string.
 *
 * @param input - String to generate color from (JID, nickname, etc.)
 * @param options - Color generation options
 * @returns Promise resolving to RGB color as [r, g, b]
 */
export async function generateConsistentColor(
  input: string,
  options?: ConsistentColorOptions
): Promise<[number, number, number]> {
  const { saturation = 100, lightness = 50 } = options ?? {}
  const hue = await generateHueAngle(input)
  return hsluvToRgb(hue, saturation, lightness)
}

/**
 * Synchronous version of generateConsistentColor.
 *
 * Note: Uses djb2 hash instead of SHA-1, so results differ from async version.
 * Use generateConsistentColor() for XEP-0392 compliance.
 *
 * @param input - String to generate color from
 * @param options - Color generation options
 * @returns RGB color as [r, g, b]
 */
export function generateConsistentColorSync(
  input: string,
  options?: ConsistentColorOptions
): [number, number, number] {
  const { saturation = 100, lightness = 50 } = options ?? {}
  const hue = generateHueAngleSync(input)
  return hsluvToRgb(hue, saturation, lightness)
}

/**
 * Generate a CSS color string from an input string.
 *
 * @param input - String to generate color from (JID, nickname, etc.)
 * @param options - Color generation options
 * @returns Promise resolving to CSS rgb() color string
 */
export async function generateConsistentColorCss(
  input: string,
  options?: ConsistentColorOptions
): Promise<string> {
  const [r, g, b] = await generateConsistentColor(input, options)
  return `rgb(${r}, ${g}, ${b})`
}

/**
 * Synchronous version of generateConsistentColorCss.
 *
 * @param input - String to generate color from
 * @param options - Color generation options
 * @returns CSS rgb() color string
 */
export function generateConsistentColorCssSync(
  input: string,
  options?: ConsistentColorOptions
): string {
  const [r, g, b] = generateConsistentColorSync(input, options)
  return `rgb(${r}, ${g}, ${b})`
}

/**
 * Generate a hex color string from an input string.
 *
 * @param input - String to generate color from (JID, nickname, etc.)
 * @param options - Color generation options
 * @returns Promise resolving to hex color string (e.g., "#ff5500")
 */
export async function generateConsistentColorHex(
  input: string,
  options?: ConsistentColorOptions
): Promise<string> {
  const [r, g, b] = await generateConsistentColor(input, options)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

/**
 * Synchronous version of generateConsistentColorHex.
 *
 * @param input - String to generate color from
 * @param options - Color generation options
 * @returns Hex color string (e.g., "#ff5500")
 */
export function generateConsistentColorHexSync(
  input: string,
  options?: ConsistentColorOptions
): string {
  const [r, g, b] = generateConsistentColorSync(input, options)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}
