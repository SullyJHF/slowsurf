class SlowSurfContent {
  constructor() {
    this.init();
  }

  init() {
    // Content script simplified - background script handles all URL interception
    // This prevents race conditions and ensures consistent tab-level bypass tracking
    console.log('SlowSurf content script loaded');
  }

  isDelayPage() {
    return window.location.href.includes(chrome.runtime.getURL('delay.html'));
  }

}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new SlowSurfContent();
  });
} else {
  new SlowSurfContent();
}