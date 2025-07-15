class SlowSurfContent {
  constructor() {
    this.init();
  }

  init() {
    if (this.isDelayPage()) {
      return;
    }

    this.checkForDelayRedirect();
  }

  isDelayPage() {
    return window.location.href.includes(chrome.runtime.getURL('delay.html'));
  }

  async checkForDelayRedirect() {
    try {
      const currentUrl = window.location.href;
      
      if (this.isExcludedUrl(currentUrl)) {
        return;
      }

      const settings = await this.getSettings();
      
      if (!settings.enabled) {
        return;
      }

      const matchedWebsite = this.findMatchingWebsite(currentUrl, settings.websites);
      
      if (matchedWebsite && !this.hasVisitedRecently(currentUrl)) {
        this.redirectToDelayPage(currentUrl, matchedWebsite);
      }
    } catch (error) {
      console.error('SlowSurf Content Script Error:', error);
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
      '127.0.0.1',
      chrome.runtime.getURL('')
    ];

    return excludedPatterns.some(pattern => url.includes(pattern));
  }

  async getSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get({
        enabled: true,
        defaultDelay: 10,
        websites: []
      }, resolve);
    });
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

  hasVisitedRecently(url) {
    const visitKey = `slowsurf_visited_${url}`;
    const lastVisit = sessionStorage.getItem(visitKey);
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (lastVisit && (now - parseInt(lastVisit)) < fiveMinutes) {
      return true;
    }

    return false;
  }

  redirectToDelayPage(targetUrl, matchedWebsite) {
    const visitKey = `slowsurf_visited_${targetUrl}`;
    sessionStorage.setItem(visitKey, Date.now().toString());

    const delayPageUrl = chrome.runtime.getURL(
      `delay.html?target=${encodeURIComponent(targetUrl)}&delay=${matchedWebsite.delay}&pattern=${encodeURIComponent(matchedWebsite.pattern)}`
    );

    window.location.replace(delayPageUrl);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new SlowSurfContent();
  });
} else {
  new SlowSurfContent();
}