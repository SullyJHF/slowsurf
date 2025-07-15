#!/bin/bash

# SlowSurf Version Tagging Script
# Usage: ./tag.sh [major|minor|patch]
# Example: ./tag.sh minor

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to display usage
show_usage() {
    echo -e "${BLUE}SlowSurf Version Tagging Script${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
    echo "Usage: $0 [major|minor|patch]"
    echo ""
    echo "Examples:"
    echo "  $0 patch   # 1.0.0 -> 1.0.1"
    echo "  $0 minor   # 1.0.0 -> 1.1.0"
    echo "  $0 major   # 1.0.0 -> 2.0.0"
    echo ""
    exit 1
}

# Function to increment version
increment_version() {
    local version=$1
    local increment_type=$2
    
    # Split version into parts
    IFS='.' read -r major minor patch <<< "$version"
    
    case $increment_type in
        major)
            ((major++))
            minor=0
            patch=0
            ;;
        minor)
            ((minor++))
            patch=0
            ;;
        patch)
            ((patch++))
            ;;
        *)
            echo -e "${RED}❌ Invalid increment type: $increment_type${NC}"
            show_usage
            ;;
    esac
    
    echo "$major.$minor.$patch"
}

# Function to update manifest.json version
update_manifest_version() {
    local new_version=$1
    local manifest_file="manifest.json"
    
    # Create backup
    cp "$manifest_file" "$manifest_file.bak"
    
    # Update version in manifest.json
    if command -v sed >/dev/null 2>&1; then
        # Use sed to replace version
        sed -i.tmp "s/\"version\": \"[^\"]*\"/\"version\": \"$new_version\"/" "$manifest_file"
        rm "$manifest_file.tmp" 2>/dev/null || true
    else
        echo -e "${RED}❌ sed command not found${NC}"
        exit 1
    fi
    
    # Verify the change
    local updated_version=$(grep '"version"' "$manifest_file" | sed 's/.*"version": "\([^"]*\)".*/\1/')
    if [ "$updated_version" != "$new_version" ]; then
        echo -e "${RED}❌ Failed to update manifest.json version${NC}"
        mv "$manifest_file.bak" "$manifest_file"
        exit 1
    fi
    
    rm "$manifest_file.bak"
    echo -e "${GREEN}✅ Updated manifest.json version to $new_version${NC}"
}

# Main script
main() {
    echo -e "${BLUE}🏷️  SlowSurf Version Tagging Script${NC}"
    echo -e "${BLUE}===================================${NC}"
    
    # Check if argument is provided
    if [ $# -eq 0 ]; then
        show_usage
    fi
    
    local increment_type=$1
    
    # Validate increment type
    if [[ ! "$increment_type" =~ ^(major|minor|patch)$ ]]; then
        echo -e "${RED}❌ Invalid increment type: $increment_type${NC}"
        show_usage
    fi
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        echo -e "${RED}❌ Not in a git repository${NC}"
        exit 1
    fi
    
    # Check if manifest.json exists
    if [ ! -f "manifest.json" ]; then
        echo -e "${RED}❌ manifest.json not found${NC}"
        exit 1
    fi
    
    # Check for uncommitted changes
    if ! git diff --quiet || ! git diff --cached --quiet; then
        echo -e "${YELLOW}⚠️  You have uncommitted changes:${NC}"
        git status --porcelain
        echo ""
        read -p "Do you want to continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}❌ Aborted${NC}"
            exit 1
        fi
    fi
    
    # Get current version from manifest.json
    local current_version=$(grep '"version"' manifest.json | sed 's/.*"version": "\([^"]*\)".*/\1/')
    
    if [ -z "$current_version" ]; then
        echo -e "${RED}❌ Could not extract version from manifest.json${NC}"
        exit 1
    fi
    
    # Validate version format (semantic versioning)
    if [[ ! "$current_version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        echo -e "${RED}❌ Invalid version format in manifest.json: $current_version${NC}"
        echo -e "${RED}Expected format: X.Y.Z (e.g., 1.0.0)${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}📋 Current version: $current_version${NC}"
    
    # Calculate new version
    local new_version=$(increment_version "$current_version" "$increment_type")
    echo -e "${BLUE}🚀 New version: $new_version${NC}"
    
    # Check if tag already exists
    if git tag -l | grep -q "^v$new_version$"; then
        echo -e "${RED}❌ Tag v$new_version already exists${NC}"
        exit 1
    fi
    
    # Confirm with user
    echo ""
    echo -e "${YELLOW}This will:${NC}"
    echo -e "${YELLOW}1. Update manifest.json version from $current_version to $new_version${NC}"
    echo -e "${YELLOW}2. Create extension bundle for Chrome Web Store${NC}"
    echo -e "${YELLOW}3. Commit the change with message 'Version v$new_version'${NC}"
    echo -e "${YELLOW}4. Create git tag 'v$new_version'${NC}"
    echo -e "${YELLOW}5. Push commit and tag to origin${NC}"
    echo ""
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}❌ Aborted${NC}"
        exit 1
    fi
    
    echo ""
    echo -e "${BLUE}🔄 Processing...${NC}"
    
    # Update manifest.json
    update_manifest_version "$new_version"
    
    # Run bundle script to create extension package
    echo -e "${BLUE}📦 Creating extension bundle...${NC}"
    if [ -f "./bundle.sh" ]; then
        ./bundle.sh
        echo -e "${GREEN}✅ Extension bundle created${NC}"
    else
        echo -e "${YELLOW}⚠️  bundle.sh not found, skipping bundle creation${NC}"
    fi
    
    # Stage the manifest.json change
    git add manifest.json
    
    # Commit the version change
    git commit -m "Version v$new_version"
    echo -e "${GREEN}✅ Committed version change${NC}"
    
    # Create git tag
    git tag "v$new_version"
    echo -e "${GREEN}✅ Created tag v$new_version${NC}"
    
    # Push to remote
    echo -e "${BLUE}📤 Pushing to origin...${NC}"
    git push origin main
    git push origin "v$new_version"
    echo -e "${GREEN}✅ Pushed commit and tag to origin${NC}"
    
    echo ""
    echo -e "${GREEN}🎉 Successfully tagged version v$new_version!${NC}"
    echo -e "${GREEN}🚀 GitHub Actions will now build and create the release${NC}"
    echo -e "${GREEN}🔗 Check: https://github.com/SullyJHF/slowsurf/releases${NC}"
    echo ""
    echo -e "${BLUE}📋 Summary:${NC}"
    echo -e "${BLUE}  - Version: $current_version → $new_version${NC}"
    echo -e "${BLUE}  - Tag: v$new_version${NC}"
    echo -e "${BLUE}  - Commit: Version v$new_version${NC}"
}

# Run main function
main "$@"