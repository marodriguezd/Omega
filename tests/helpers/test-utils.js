import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

/**
 * Reads a file from project root or returns null if not found.
 */
export function readProjectFile(relativePath) {
  const fullPath = path.resolve(PROJECT_ROOT, relativePath);
  try {
    return fs.readFileSync(fullPath, 'utf8');
  } catch (err) {
    return null;
  }
}

/**
 * Checks if a file exists relative to project root.
 */
export function fileExists(relativePath) {
  const fullPath = path.resolve(PROJECT_ROOT, relativePath);
  return fs.existsSync(fullPath);
}

/**
 * Parses CSS custom properties (--variable: value) from CSS content.
 */
export function parseCssVariables(cssContent) {
  if (!cssContent) return new Map();
  const vars = new Map();
  const regex = /(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g;
  let match;
  while ((match = regex.exec(cssContent)) !== null) {
    vars.set(match[1].trim(), match[2].trim());
  }
  return vars;
}

/**
 * Parses @keyframes rules and returns map of keyframe names to content.
 */
export function parseKeyframes(cssContent) {
  if (!cssContent) return new Map();
  const keyframes = new Map();
  const regex = /@keyframes\s+([a-zA-Z0-9_-]+)\s*\{([^}]+(?:\}[^}]*)*)\}/g;
  let match;
  while ((match = regex.exec(cssContent)) !== null) {
    keyframes.set(match[1].trim(), match[2].trim());
  }
  return keyframes;
}

/**
 * Parses @media blocks and their queries.
 */
export function parseMediaQueries(cssContent) {
  if (!cssContent) return [];
  const queries = [];
  const regex = /@media\s*([^{]+)\{([\s\S]*?)(?=\n\s*@media|\n\s*$|\Z)/g;
  let match;
  while ((match = regex.exec(cssContent)) !== null) {
    queries.push({
      query: match[1].trim(),
      body: match[2].trim()
    });
  }
  return queries;
}

/**
 * Computes WCAG 2.1 relative luminance for hex color.
 */
export function getRelativeLuminance(hexColor) {
  let hex = hexColor.replace('#', '').trim();
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const toLinear = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Computes WCAG 2.1 contrast ratio between two hex colors.
 */
export function calculateContrastRatio(hex1, hex2) {
  const lum1 = getRelativeLuminance(hex1);
  const lum2 = getRelativeLuminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Custom assert with clear diagnostic formatting.
 */
export const testAssert = {
  ok: assert.ok,
  strictEqual: assert.strictEqual,
  deepStrictEqual: assert.deepStrictEqual,
  match: assert.match,
  doesNotMatch: assert.doesNotMatch,
  rejects: assert.rejects,
  doesNotReject: assert.doesNotReject
};
