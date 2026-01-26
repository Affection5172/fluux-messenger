# Assets

Source design files for the application.

## Files

- `chat_icon.svg` - Vector source for app icons

## Regenerating Icons

To regenerate all app icons from the SVG source:

```bash
# Export SVG to 1024x1024 PNG first (using Inkscape, or any vector editor)
# Then run from the repository root:

SOURCE="path/to/exported.png"
WEB_PUBLIC="apps/web-client/public"
TAURI_ICONS="apps/web-client/src-tauri/icons"

# Web client
magick "$SOURCE" -resize 32x32 "$WEB_PUBLIC/favicon.png"
magick "$SOURCE" -resize 512x512 "$WEB_PUBLIC/icon-512.png"

# Tauri (see full script in project documentation)
magick "$SOURCE" -resize 512x512 "$TAURI_ICONS/icon.png"
# ... etc
```
