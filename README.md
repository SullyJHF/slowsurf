# SlowSurf

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/I3I51I3E28)

A Chrome extension that adds intentional delays before visiting configured websites to reduce impulsive browsing and promote mindful internet usage.

🌐 **Website**: [slowsurf.solvy.dev](https://slowsurf.solvy.dev)  
📖 **Privacy Policy**: [slowsurf.solvy.dev/privacy](https://slowsurf.solvy.dev/privacy)

## Features

- **Configurable Delays**: Set custom delay times (5s to 15:00 minutes) for specific websites
- **Flexible Time Input**: Support for both seconds (30) and MM:SS (1:30) time formats
- **Wildcard Support**: Use patterns like `*.reddit.com` or `facebook.com/*` to match multiple URLs
- **Countdown Timer**: Visual countdown with progress bar on delay page
- **Randomized Messages**: Thoughtful prompts to encourage reflection before browsing
- **Auto-Save Settings**: Configuration saves automatically without manual intervention
- **Compact Interface**: Clean, streamlined popup with optimized layout
- **Session Memory**: Prevents repeated delays within the same browsing session

## Installation

### Manual Installation (Developer Mode)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the `slowsurf` folder
5. The extension should now appear in your extensions list

### Chrome Web Store (Coming Soon)

The extension will be available on the Chrome Web Store once reviewed and approved.

## Usage

### Initial Setup

1. Click the SlowSurf icon in your Chrome toolbar
2. Configure your global settings:
   - Enable/disable the extension
3. Add websites you want to slow down:
   - Enter the website pattern (e.g., `reddit.com`)
   - Set a custom delay time (defaults to 30 seconds if empty)
   - Press Enter or click "Add Website"
   - Remove entries with the "Remove" button

### Website Pattern Examples

- `reddit.com` - Exact domain match
- `*.reddit.com` - All subdomains of reddit.com
- `facebook.com/*` - All pages on facebook.com
- `*.social-media.com` - All subdomains

### How It Works

1. When you navigate to a configured website, you'll see a delay page instead
2. A countdown timer shows the remaining delay time
3. Random thoughtful messages encourage reflection
4. After the countdown ends, you can choose to continue or go elsewhere
5. If you continue, you can browse normally until you close the tab

## Repository Structure

```
slowsurf/
├── manifest.json          # Extension configuration
├── background.js          # Background service worker
├── content.js            # Content script for URL interception
├── delay.html            # Delay page template
├── delay.js              # Delay page functionality
├── options.html          # Settings page template
├── options.js            # Settings page functionality
├── styles.css            # Styling for all pages
├── icons/               # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── website/             # Website hosting (slowsurf.solvy.dev)
│   ├── index.html          # Homepage with Ko-fi widget
│   ├── PRIVACY_POLICY.html # Privacy policy page
│   ├── 404.html           # 404 error page
│   ├── favicon.ico        # Favicon (converted from extension icons)
│   ├── nginx.conf         # Nginx configuration
│   ├── Dockerfile         # Docker image for website
│   ├── docker-compose.yml # Production deployment
│   ├── docker-compose.local.yml # Local development
│   └── deploy.sh          # Deployment script
├── .github/workflows/   # GitHub Actions CI/CD
│   └── deploy.yml         # Auto-deploy website changes
├── bundle.sh            # Create extension bundle for Chrome Web Store
├── tag.sh               # Automated versioning and release script
└── README.md            # This file
```

## Technical Details

### Architecture

- **Manifest V3**: Uses the latest Chrome extension APIs
- **Service Worker**: Background script handles URL matching and redirection
- **Content Script**: Minimal content script for URL interception
- **Chrome Storage**: Syncs settings across devices with auto-save
- **Per-Tab Bypass**: Prevents repeated delays in the same browsing session
- **Event-Driven UI**: Proper event listeners for reliable button functionality

### Permissions

- `tabs`: Read tab properties for URL matching
- `storage`: Store and sync user preferences
- `<all_urls>`: Required for content script injection

## Development

### Running Locally

1. Clone the repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable Developer mode
4. Click "Load unpacked" and select the project folder
5. Make changes to the code
6. Click the refresh icon on the extension card to reload

### Creating Releases

This project uses automated semantic versioning and releases. Use the provided script to create new versions:

```bash
# Increment patch version (1.0.0 -> 1.0.1)
./tag.sh patch

# Increment minor version (1.0.0 -> 1.1.0)
./tag.sh minor

# Increment major version (1.0.0 -> 2.0.0)
./tag.sh major
```

**What the script does:**
1. Updates the version in `manifest.json`
2. Creates extension bundle automatically
3. Commits the change with message "Version vX.X.X"
4. Creates a git tag `vX.X.X`
5. Pushes to GitHub
6. Triggers GitHub Actions to build and create a release

**Manual Bundle Creation:**
```bash
# Create extension bundle for Chrome Web Store
./bundle.sh
```

### Website Development

The website is hosted at [slowsurf.solvy.dev](https://slowsurf.solvy.dev) and automatically deploys when changes are pushed to the `website/` directory.

**Local Development:**
```bash
cd website
./deploy.sh local
# Website available at http://localhost:8080
```

**Production Deployment:**
- Automatic via GitHub Actions when pushing to main branch
- Manual deployment: `cd website && ./deploy.sh`
- Requires server access and Docker setup

**Website Features:**
- Responsive design with purple gradient matching extension
- Ko-fi widget for donations
- Automatic favicon from extension icons
- Privacy policy hosting
- Health check endpoints for monitoring

### Testing

**Extension Testing:**
Test the extension with various website patterns and scenarios:

1. Add test websites to your configuration using different time formats
2. Navigate to those websites
3. Verify the delay page appears with proper time display
4. Test the countdown timer and continue functionality
5. Verify session memory works (no repeated delays)
6. Test the remove button functionality
7. Verify auto-save works by refreshing the popup

**Website Testing:**
Test the website locally before deployment:

1. Run `cd website && ./deploy.sh local`
2. Visit http://localhost:8080 and verify homepage loads
3. Test privacy policy at http://localhost:8080/privacy
4. Verify favicon appears in browser tab
5. Test responsive design on different screen sizes
6. Verify Ko-fi widget functionality

## Privacy & Security

- All data is stored locally using Chrome's storage API
- No external network requests are made
- No user data is collected or transmitted
- Website patterns are processed locally only

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter any issues or have feature requests, please open an issue on the GitHub repository.