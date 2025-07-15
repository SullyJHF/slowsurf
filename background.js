class SlowSurfBackground {
  constructor() {
    this.init();
  }

  init() {
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'loading' && tab.url) {
        this.handleTabUpdate(tabId, tab.url);
      }
    });

    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync') {
        console.log('Settings changed:', changes);
      }
    });
  }

  async handleTabUpdate(tabId, url) {
    try {
      const settings = await this.getSettings();
      
      if (!settings.enabled) {
        return;
      }

      const matchedWebsite = this.findMatchingWebsite(url, settings.websites);
      
      if (matchedWebsite) {
        console.log(`Matched website: ${matchedWebsite.pattern} for URL: ${url}`);
        
        await chrome.tabs.update(tabId, {
          url: chrome.runtime.getURL(`delay.html?target=${encodeURIComponent(url)}&delay=${matchedWebsite.delay}&pattern=${encodeURIComponent(matchedWebsite.pattern)}`)
        });
      }
    } catch (error) {
      console.error('Error in handleTabUpdate:', error);
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