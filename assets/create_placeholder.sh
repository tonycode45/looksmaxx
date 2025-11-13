#!/bin/bash
# Create minimal PNG placeholders using base64 encoded 1x1 pixel PNG

# 1x1 transparent PNG (base64)
PNG_BASE64="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

# Create icon.png (1024x1024) - solid color using sips
sips -s format png -z 1024 1024 --setProperty format png /System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/GenericApplicationIcon.icns 2>/dev/null || \
echo "$PNG_BASE64" | base64 -d > icon.png && sips -z 1024 1024 icon.png --out icon.png 2>/dev/null || \
echo "Creating minimal icon..." && echo "$PNG_BASE64" | base64 -d > icon.png

# Create splash.png
echo "$PNG_BASE64" | base64 -d > splash.png
sips -z 2778 1284 splash.png --out splash.png 2>/dev/null || echo "Splash placeholder created"

# Create adaptive-icon.png
cp icon.png adaptive-icon.png 2>/dev/null || echo "$PNG_BASE64" | base64 -d > adaptive-icon.png

# Create favicon.png
cp icon.png favicon.png 2>/dev/null || echo "$PNG_BASE64" | base64 -d > favicon.png

echo "Placeholder assets created"
