class SlowSurfBackground {
  constructor() {
    this.bypassedTabs = new Map(); // Track tabs that have completed delay for specific sites
    this.init();
  }

  init() {
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'loading' && tab.url) {
        this.handleTabUpdate(tabId, tab.url);
      }
    });

    // Clean up bypassed tabs when they're closed
    chrome.tabs.onRemoved.addListener((tabId) => {
      this.bypassedTabs.delete(tabId);
    });

    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync') {
        console.log('Settings changed:', changes);
      }
    });

    // Listen for messages from delay page
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'markTabBypassed' && sender.tab) {
        const tabId = sender.tab.id;
        const targetUrl = message.targetUrl;
        
        // Store that this tab has bypassed the delay for this specific site
        if (!this.bypassedTabs.has(tabId)) {
          this.bypassedTabs.set(tabId, new Set());
        }
        this.bypassedTabs.get(tabId).add(this.getDomainFromUrl(targetUrl));
        
        console.log(`Tab ${tabId} bypassed delay for ${this.getDomainFromUrl(targetUrl)}`);
      }
    });
  }

  async handleTabUpdate(tabId, url) {
    try {
      // Skip if URL is already our extension page (prevent infinite loop)
      if (url.startsWith(chrome.runtime.getURL(''))) {
        return;
      }

      // Skip excluded URLs
      if (this.isExcludedUrl(url)) {
        return;
      }

      const settings = await this.getSettings();
      
      if (!settings.enabled) {
        return;
      }

      const matchedWebsite = this.findMatchingWebsite(url, settings.websites);
      
      if (matchedWebsite) {
        // Check if this tab has already bypassed the delay for this domain
        const domain = this.getDomainFromUrl(url);
        if (this.bypassedTabs.has(tabId) && this.bypassedTabs.get(tabId).has(domain)) {
          console.log(`Tab ${tabId} already bypassed delay for ${domain}, allowing access`);
          return;
        }
        
        console.log(`Matched website: ${matchedWebsite.pattern} for URL: ${url}`);
        
        await chrome.tabs.update(tabId, {
          url: chrome.runtime.getURL(`delay.html?target=${encodeURIComponent(url)}&delay=${matchedWebsite.delay}&pattern=${encodeURIComponent(matchedWebsite.pattern)}`)
        });
      }
    } catch (error) {
      console.error('Error in handleTabUpdate:', error);
    }
  }

  isExcludedUrl(url) {
    const excludedPatterns = [
      'chrome://',
      'chrome-extension://',
      'moz-extension://',
      'about:',
      'data:',
      'file://',
      'localhost',
      '127.0.0.1'
    ];

    return excludedPatterns.some(pattern => url.includes(pattern));
  }

  getDomainFromUrl(url) {
    try {
      return new URL(url).hostname;
    } catch (error) {
      return url;
    }
  }

  async getSettings() {
    const result = await chrome.storage.sync.get({
      enabled: true,
      defaultDelay: 10,
      websites: []
    });
    return result;
  }

  findMatchingWebsite(url, websites) {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      const fullUrl = url;

      return websites.find(website => {
        if (!website.enabled) return false;
        
        return this.matchesPattern(hostname, fullUrl, website.pattern);
      });
    } catch (error) {
      console.error('Error parsing URL:', url, error);
      return null;
    }
  }

  matchesPattern(hostname, fullUrl, pattern) {
    const normalizedPattern = pattern.toLowerCase();
    const normalizedHostname = hostname.toLowerCase();
    const normalizedFullUrl = fullUrl.toLowerCase();

    if (normalizedPattern.includes('*')) {
      if (normalizedPattern.startsWith('*.')) {
        const domain = normalizedPattern.slice(2);
        return normalizedHostname === domain || normalizedHostname.endsWith('.' + domain);
      }
      
      if (normalizedPattern.endsWith('/*')) {
        const domain = normalizedPattern.slice(0, -2);
        return normalizedHostname === domain || normalizedFullUrl.startsWith(`https://${domain}/`) || normalizedFullUrl.startsWith(`http://${domain}/`);
      }
      
      const regex = new RegExp(normalizedPattern.replace(/\*/g, '.*'));
      return regex.test(normalizedHostname) || regex.test(normalizedFullUrl);
    }

    return normalizedHostname === normalizedPattern || normalizedFullUrl.includes(normalizedPattern);
  }
}

const background = new SlowSurfBackground();