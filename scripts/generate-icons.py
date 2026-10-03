#!/usr/bin/env python3
"""Generate all native icon assets from the single authoritative source.

Source of truth: public/assets/icon.png (512x512 RGBA).
Outputs (deterministic, reproducible):
  build/icon.png          authoritative copy (512x512)
  build/icon.icns         macOS icon (multi-size 16..512)
  build/icon.ico          Windows icon (multi-size 16..256)
  build/icons/<size>.png Linux PNG set (16, 32, 48, 64, 128, 256, 512)

Android launcher icons are NOT regenerated here: they are adaptive
(foreground + background XML) and verified separately by validate-build.
"""
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "assets" / "icon.png"
BUILD = ROOT / "build"
ICONS_DIR = BUILD / "icons"

SIZES_PNG = [16, 32, 48, 64, 128, 256, 512]
SIZES_ICO = [16, 24, 32, 48, 64, 128, 256]


def main() -> int:
    if not SRC.exists():
        print(f"FATAL: authoritative source missing: {SRC}", file=sys.stderr)
        return 1
    img = Image.open(SRC).convert("RGBA")
    if img.size != (512, 512):
        print(f"FATAL: source must be 512x512, got {img.size}", file=sys.stderr)
        return 1

    BUILD.mkdir(parents=True, exist_ok=True)
    ICONS_DIR.mkdir(parents=True, exist_ok=True)

    # Authoritative copy
    img.save(BUILD / "icon.png")

    # Linux PNG set
    for size in SIZES_PNG:
        out = ICONS_DIR / f"{size}x{size}.png"
        img.resize((size, size), Image.LANCZOS).save(out)

    # Windows ICO (multi-image)
    ico_sizes = [(s, s) for s in SIZES_ICO]
    img.save(BUILD / "icon.ico", sizes=ico_sizes)

    # macOS ICNS (Pillow embeds 16..512 incl. @2x variants)
    img.save(BUILD / "icon.icns")

    print("Icons generated:")
    for p in sorted(BUILD.rglob("icon*")) + sorted(ICONS_DIR.glob("*.png")):
        print(f"  {p.relative_to(ROOT)} ({p.stat().st_size} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
