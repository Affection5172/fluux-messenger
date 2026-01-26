import { describe, it, expect } from 'vitest'
import {
  hsluvToRgb,
  generateHueAngle,
  generateHueAngleSync,
  generateConsistentColor,
  generateConsistentColorSync,
  generateConsistentColorCss,
  generateConsistentColorCssSync,
  generateConsistentColorHex,
  generateConsistentColorHexSync,
  LIGHT_THEME_DEFAULTS,
  DARK_THEME_DEFAULTS,
} from './consistentColor'

describe('XEP-0392 Consistent Color Generation', () => {
  describe('hsluvToRgb', () => {
    it('should convert red hue correctly', () => {
      const [r, g, b] = hsluvToRgb(12, 100, 50)
      // HSLuv red is around hue 12 at full saturation
      expect(r).toBeGreaterThan(150)
      expect(g).toBeLessThan(100)
      expect(b).toBeLessThan(100)
    })

    it('should convert green hue correctly', () => {
      const [_r, g, _b] = hsluvToRgb(127, 100, 50)
      // HSLuv green is around hue 127
      expect(g).toBeGreaterThan(100)
    })

    it('should convert blue hue correctly', () => {
      const [_r, _g, b] = hsluvToRgb(265, 100, 50)
      // HSLuv blue is around hue 265
      expect(b).toBeGreaterThan(100)
    })

    it('should return black for lightness 0', () => {
      const [r, g, b] = hsluvToRgb(180, 100, 0)
      expect(r).toBe(0)
      expect(g).toBe(0)
      expect(b).toBe(0)
    })

    it('should return white for lightness 100', () => {
      const [r, g, b] = hsluvToRgb(180, 100, 100)
      expect(r).toBe(255)
      expect(g).toBe(255)
      expect(b).toBe(255)
    })

    it('should return grayscale for saturation 0', () => {
      const [r, g, b] = hsluvToRgb(180, 0, 50)
      // All channels should be equal for grayscale
      expect(r).toBe(g)
      expect(g).toBe(b)
    })

    it('should clamp values to 0-255 range', () => {
      const [r, g, b] = hsluvToRgb(0, 100, 50)
      expect(r).toBeGreaterThanOrEqual(0)
      expect(r).toBeLessThanOrEqual(255)
      expect(g).toBeGreaterThanOrEqual(0)
      expect(g).toBeLessThanOrEqual(255)
      expect(b).toBeGreaterThanOrEqual(0)
      expect(b).toBeLessThanOrEqual(255)
    })

    it('should produce consistent results for same input', () => {
      const result1 = hsluvToRgb(200, 80, 60)
      const result2 = hsluvToRgb(200, 80, 60)
      expect(result1).toEqual(result2)
    })
  })

  describe('generateHueAngle', () => {
    it('should generate hue for "Romeo" matching XEP-0392 test vector', async () => {
      const hue = await generateHueAngle('Romeo')
      // XEP-0392 specifies Romeo should produce 327.255249°
      expect(hue).toBeCloseTo(327.255, 1)
    })

    it('should produce values in 0-360 range', async () => {
      const inputs = ['alice', 'bob', 'carol', 'user@example.com', '']
      for (const input of inputs) {
        const hue = await generateHueAngle(input)
        expect(hue).toBeGreaterThanOrEqual(0)
        expect(hue).toBeLessThan(360)
      }
    })

    it('should produce consistent results for same input', async () => {
      const hue1 = await generateHueAngle('test@example.com')
      const hue2 = await generateHueAngle('test@example.com')
      expect(hue1).toBe(hue2)
    })

    it('should produce different results for different inputs', async () => {
      const hue1 = await generateHueAngle('alice@example.com')
      const hue2 = await generateHueAngle('bob@example.com')
      expect(hue1).not.toBe(hue2)
    })

    it('should handle empty string', async () => {
      const hue = await generateHueAngle('')
      expect(hue).toBeGreaterThanOrEqual(0)
      expect(hue).toBeLessThan(360)
    })

    it('should handle unicode characters', async () => {
      const hue = await generateHueAngle('用户@example.com')
      expect(hue).toBeGreaterThanOrEqual(0)
      expect(hue).toBeLessThan(360)
    })

    it('should handle emojis', async () => {
      const hue = await generateHueAngle('🎉party@example.com')
      expect(hue).toBeGreaterThanOrEqual(0)
      expect(hue).toBeLessThan(360)
    })
  })

  describe('generateHueAngleSync', () => {
    it('should produce values in 0-360 range', () => {
      const inputs = ['alice', 'bob', 'carol', 'user@example.com', '']
      for (const input of inputs) {
        const hue = generateHueAngleSync(input)
        expect(hue).toBeGreaterThanOrEqual(0)
        expect(hue).toBeLessThan(360)
      }
    })

    it('should produce consistent results for same input', () => {
      const hue1 = generateHueAngleSync('test@example.com')
      const hue2 = generateHueAngleSync('test@example.com')
      expect(hue1).toBe(hue2)
    })

    it('should produce different results for different inputs', () => {
      const hue1 = generateHueAngleSync('alice@example.com')
      const hue2 = generateHueAngleSync('bob@example.com')
      expect(hue1).not.toBe(hue2)
    })
  })

  describe('generateConsistentColor', () => {
    it('should return RGB values in 0-255 range', async () => {
      const [r, g, b] = await generateConsistentColor('user@example.com')
      expect(r).toBeGreaterThanOrEqual(0)
      expect(r).toBeLessThanOrEqual(255)
      expect(g).toBeGreaterThanOrEqual(0)
      expect(g).toBeLessThanOrEqual(255)
      expect(b).toBeGreaterThanOrEqual(0)
      expect(b).toBeLessThanOrEqual(255)
    })

    it('should produce consistent colors for same input', async () => {
      const color1 = await generateConsistentColor('room@conference.example.com')
      const color2 = await generateConsistentColor('room@conference.example.com')
      expect(color1).toEqual(color2)
    })

    it('should produce different colors for different inputs', async () => {
      const color1 = await generateConsistentColor('alice@example.com')
      const color2 = await generateConsistentColor('bob@example.com')
      expect(color1).not.toEqual(color2)
    })

    it('should respect saturation option', async () => {
      const saturated = await generateConsistentColor('test', { saturation: 100 })
      const desaturated = await generateConsistentColor('test', { saturation: 0 })
      // Desaturated should be grayscale (all channels equal)
      expect(desaturated[0]).toBe(desaturated[1])
      expect(desaturated[1]).toBe(desaturated[2])
      // Saturated should not be grayscale
      expect(saturated[0] === saturated[1] && saturated[1] === saturated[2]).toBe(false)
    })

    it('should respect lightness option', async () => {
      const light = await generateConsistentColor('test', { lightness: 80 })
      const dark = await generateConsistentColor('test', { lightness: 20 })
      // Light colors should have higher average RGB
      const lightAvg = (light[0] + light[1] + light[2]) / 3
      const darkAvg = (dark[0] + dark[1] + dark[2]) / 3
      expect(lightAvg).toBeGreaterThan(darkAvg)
    })
  })

  describe('generateConsistentColorSync', () => {
    it('should return RGB values in 0-255 range', () => {
      const [r, g, b] = generateConsistentColorSync('user@example.com')
      expect(r).toBeGreaterThanOrEqual(0)
      expect(r).toBeLessThanOrEqual(255)
      expect(g).toBeGreaterThanOrEqual(0)
      expect(g).toBeLessThanOrEqual(255)
      expect(b).toBeGreaterThanOrEqual(0)
      expect(b).toBeLessThanOrEqual(255)
    })

    it('should produce consistent colors for same input', () => {
      const color1 = generateConsistentColorSync('room@conference.example.com')
      const color2 = generateConsistentColorSync('room@conference.example.com')
      expect(color1).toEqual(color2)
    })
  })

  describe('generateConsistentColorCss', () => {
    it('should return valid CSS rgb() string', async () => {
      const css = await generateConsistentColorCss('user@example.com')
      expect(css).toMatch(/^rgb\(\d{1,3}, \d{1,3}, \d{1,3}\)$/)
    })

    it('should produce consistent output for same input', async () => {
      const css1 = await generateConsistentColorCss('test')
      const css2 = await generateConsistentColorCss('test')
      expect(css1).toBe(css2)
    })
  })

  describe('generateConsistentColorCssSync', () => {
    it('should return valid CSS rgb() string', () => {
      const css = generateConsistentColorCssSync('user@example.com')
      expect(css).toMatch(/^rgb\(\d{1,3}, \d{1,3}, \d{1,3}\)$/)
    })
  })

  describe('generateConsistentColorHex', () => {
    it('should return valid hex color string', async () => {
      const hex = await generateConsistentColorHex('user@example.com')
      expect(hex).toMatch(/^#[0-9a-f]{6}$/)
    })

    it('should produce consistent output for same input', async () => {
      const hex1 = await generateConsistentColorHex('test')
      const hex2 = await generateConsistentColorHex('test')
      expect(hex1).toBe(hex2)
    })
  })

  describe('generateConsistentColorHexSync', () => {
    it('should return valid hex color string', () => {
      const hex = generateConsistentColorHexSync('user@example.com')
      expect(hex).toMatch(/^#[0-9a-f]{6}$/)
    })
  })

  describe('theme defaults', () => {
    it('should have reasonable light theme defaults', () => {
      expect(LIGHT_THEME_DEFAULTS.saturation).toBe(100)
      expect(LIGHT_THEME_DEFAULTS.lightness).toBe(35) // Lower lightness for better contrast on white
    })

    it('should have reasonable dark theme defaults', () => {
      expect(DARK_THEME_DEFAULTS.saturation).toBe(100)
      expect(DARK_THEME_DEFAULTS.lightness).toBe(65)
    })

    it('should produce readable colors with light theme defaults', async () => {
      const color = await generateConsistentColor('user', LIGHT_THEME_DEFAULTS)
      // Light theme colors should be relatively dark (readable on light backgrounds)
      const avg = (color[0] + color[1] + color[2]) / 3
      expect(avg).toBeLessThan(180)
    })

    it('should produce readable colors with dark theme defaults', async () => {
      const color = await generateConsistentColor('user', DARK_THEME_DEFAULTS)
      // Dark theme colors should be relatively light (readable on dark backgrounds)
      const avg = (color[0] + color[1] + color[2]) / 3
      expect(avg).toBeGreaterThan(120)
    })
  })

  describe('edge cases', () => {
    it('should handle very long strings', async () => {
      const longString = 'a'.repeat(10000)
      const color = await generateConsistentColor(longString)
      expect(color).toHaveLength(3)
      expect(color.every(c => c >= 0 && c <= 255)).toBe(true)
    })

    it('should handle special characters', async () => {
      const special = 'user+tag@example.com/resource with spaces'
      const color = await generateConsistentColor(special)
      expect(color).toHaveLength(3)
    })

    it('should handle null-like values gracefully', () => {
      const color = generateConsistentColorSync('')
      expect(color).toHaveLength(3)
    })
  })
})
