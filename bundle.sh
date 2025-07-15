#!/bin/bash

# SlowSurf Chrome Extension Bundle Script
# Creates a production-ready ZIP file for Chrome Web Store submission

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
EXTENSION_NAME="slowsurf"
VERSION=$(grep '"version"' manifest.json | sed 's/.*"version": "\([^"]*\)".*/\1/')
OUTPUT_DIR="dist"
BUNDLE_NAME="${EXTENSION_NAME}-v${VERSION}.zip"

echo -e "${BLUE}📦 SlowSurf Extension Bundler${NC}"
echo -e "${BLUE}================================${NC}"

# Create output directory
echo -e "${YELLOW}🗂️  Creating output directory...${NC}"
mkdir -p "${OUTPUT_DIR}"

# Clean previous builds
if [ -f "${OUTPUT_DIR}/${BUNDLE_NAME}" ]; then
    echo -e "${YELLOW}🧹 Removing previous bundle...${NC}"
    rm "${OUTPUT_DIR}/${BUNDLE_NAME}"
fi

# Files to include in the bundle
FILES_TO_INCLUDE=(
    "manifest.json"
    "background.js"
    "content.js"
    "delay.html"
    "delay.js"
    "options.html"
    "options.js"
    "styles.css"
)

# Optional files (include if they exist)
OPTIONAL_FILES=(
    "icons/icon16.png"
    "icons/icon48.png"
    "icons/icon128.png"
)

echo -e "${YELLOW}📋 Validating required files...${NC}"

# Check if all required files exist
missing_files=()
for file in "${FILES_TO_INCLUDE[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -ne 0 ]; then
    echo -e "${RED}❌ Missing required files:${NC}"
    for file in "${missing_files[@]}"; do
        echo -e "${RED}   - $file${NC}"
    done
    exit 1
fi

echo -e "${GREEN}✅ All required files found${NC}"

# Validate manifest.json
echo -e "${YELLOW}🔍 Validating manifest.json...${NC}"
if ! python3 -m json.tool manifest.json > /dev/null 2>&1; then
    echo -e "${RED}❌ Invalid JSON in manifest.json${NC}"
    exit 1
fi

# Check manifest version
if [ -z "$VERSION" ]; then
    echo -e "${RED}❌ Could not extract version from manifest.json${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Manifest validation passed (version: $VERSION)${NC}"

# Create the bundle
echo -e "${YELLOW}📦 Creating bundle: ${BUNDLE_NAME}...${NC}"

# Start with required files
zip_command="zip -r \"${OUTPUT_DIR}/${BUNDLE_NAME}\""
for file in "${FILES_TO_INCLUDE[@]}"; do
    zip_command+=" \"$file\""
done

# Add optional files if they exist
existing_optional=()
for file in "${OPTIONAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        zip_command+=" \"$file\""
        existing_optional+=("$file")
    fi
done

# Execute the zip command
eval $zip_command > /dev/null

# Show bundle contents
echo -e "${YELLOW}📋 Bundle contents:${NC}"
echo -e "${BLUE}Required files:${NC}"
for file in "${FILES_TO_INCLUDE[@]}"; do
    size=$(wc -c < "$file" | tr -d ' ')
    echo -e "   ✓ $file (${size} bytes)"
done

if [ ${#existing_optional[@]} -gt 0 ]; then
    echo -e "${BLUE}Optional files:${NC}"
    for file in "${existing_optional[@]}"; do
        size=$(wc -c < "$file" | tr -d ' ')
        echo -e "   ✓ $file (${size} bytes)"
    done
fi

# Show missing optional files
missing_optional=()
for file in "${OPTIONAL_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        missing_optional+=("$file")
    fi
done

if [ ${#missing_optional[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Missing optional files:${NC}"
    for file in "${missing_optional[@]}"; do
        echo -e "${YELLOW}   - $file${NC}"
    done
    echo -e "${YELLOW}   (Extension will work without these, but won't have custom icons)${NC}"
fi

# Bundle statistics
bundle_size=$(wc -c < "${OUTPUT_DIR}/${BUNDLE_NAME}" | tr -d ' ')
bundle_size_kb=$((bundle_size / 1024))

echo -e "${GREEN}✅ Bundle created successfully!${NC}"
echo -e "${GREEN}📦 File: ${OUTPUT_DIR}/${BUNDLE_NAME}${NC}"
echo -e "${GREEN}📏 Size: ${bundle_size} bytes (${bundle_size_kb} KB)${NC}"

# Chrome Web Store size limit check
max_size=$((10 * 1024 * 1024))  # 10MB in bytes
if [ $bundle_size -gt $max_size ]; then
    echo -e "${RED}⚠️  Warning: Bundle size exceeds Chrome Web Store limit (10MB)${NC}"
else
    echo -e "${GREEN}✅ Bundle size is within Chrome Web Store limits${NC}"
fi

echo ""
echo -e "${BLUE}🚀 Next steps:${NC}"
echo -e "1. Go to Chrome Web Store Developer Dashboard:"
echo -e "   ${BLUE}https://chrome.google.com/webstore/devconsole${NC}"
echo -e "2. Click 'Add new item' or update existing extension"
echo -e "3. Upload: ${GREEN}${OUTPUT_DIR}/${BUNDLE_NAME}${NC}"
echo -e "4. Fill out store listing details"
echo -e "5. Submit for review"

echo ""
echo -e "${GREEN}📦 Bundle ready for Chrome Web Store submission!${NC}"