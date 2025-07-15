class SlowSurfOptions {
  constructor() {
    this.init();
  }

  async init() {
    this.detectPopupMode();
    await this.loadSettings();
    this.bindEvents();
    this.renderWebsiteList();
  }

  detectPopupMode() {
    // Check if this is opened as a popup (small window dimensions)
    if (window.innerWidth < 500 || window.innerHeight < 600) {
      document.body.classList.add('popup');
    }
  }

  async loadSettings() {
    const result = await chrome.storage.sync.get({
      enabled: true,
      defaultDelay: 30,
      websites: []
    });
    
    this.settings = result;
    
    document.getElementById('enableExtension').checked = this.settings.enabled;
    document.getElementById('defaultDelay').value = this.settings.defaultDelay;
  }

  bindEvents() {
    document.getElementById('addWebsite').addEventListener('click', () => this.addWebsite());
    document.getElementById('websiteInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addWebsite();
    });
    document.getElementById('resetSettings').addEventListener('click', () => this.resetSettings());
    
    // Auto-save on settings changes
    document.getElementById('enableExtension').addEventListener('change', () => this.autoSave());
    document.getElementById('defaultDelay').addEventListener('change', () => this.autoSave());
    document.getElementById('defaultDelay').addEventListener('input', () => this.debouncedAutoSave());
  }

  addWebsite() {
    const websiteInput = document.getElementById('websiteInput');
    const delayInput = document.getElementById('websiteDelay');
    
    const website = websiteInput.value.trim();
    const delay = parseInt(delayInput.value) || this.settings.defaultDelay;
    
    if (!website) {
      alert('Please enter a website URL');
      return;
    }

    if (this.settings.websites.find(w => w.pattern === website)) {
      alert('This website is already in the list');
      return;
    }

    this.settings.websites.push({
      pattern: website,
      delay: delay,
      enabled: true
    });

    websiteInput.value = '';
    delayInput.value = this.settings.defaultDelay;
    
    this.renderWebsiteList();
    this.autoSave();
  }

  removeWebsite(index) {
    this.settings.websites.splice(index, 1);
    this.renderWebsiteList();
    this.autoSave();
  }

  toggleWebsite(index) {
    this.settings.websites[index].enabled = !this.settings.websites[index].enabled;
    this.renderWebsiteList();
    this.autoSave();
  }

  renderWebsiteList() {
    const listContainer = document.getElementById('websiteList');
    
    if (this.settings.websites.length === 0) {
      listContainer.innerHTML = '<p class="empty-state">No websites configured yet. Add one above!</p>';
      return;
    }

    listContainer.innerHTML = this.settings.websites.map((website, index) => `
      <div class="website-item ${website.enabled ? 'enabled' : 'disabled'}">
        <div class="website-info">
          <span class="website-pattern">${website.pattern}</span>
          <span class="website-delay">${website.delay}s delay</span>
        </div>
        <div class="website-actions">
          <button class="toggle-btn" onclick="options.toggleWebsite(${index})">
            ${website.enabled ? 'Disable' : 'Enable'}
          </button>
          <button class="remove-btn" onclick="options.removeWebsite(${index})">Remove</button>
        </div>
      </div>
    `).join('');
  }

  async autoSave() {
    this.settings.enabled = document.getElementById('enableExtension').checked;
    this.settings.defaultDelay = parseInt(document.getElementById('defaultDelay').value);
    
    await chrome.storage.sync.set(this.settings);
    
    // Show brief save indicator
    this.showSaveIndicator();
  }

  debouncedAutoSave() {
    // Clear existing timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    // Set new timeout for 500ms after user stops typing
    this.saveTimeout = setTimeout(() => {
      this.autoSave();
    }, 500);
  }

  showSaveIndicator() {
    // Create or update save indicator
    let indicator = document.getElementById('autoSaveIndicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'autoSaveIndicator';
      indicator.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: #4CAF50;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s;
      `;
      indicator.textContent = 'Saved ✓';
      document.body.appendChild(indicator);
    }
    
    // Show and hide the indicator
    indicator.style.opacity = '1';
    setTimeout(() => {
      indicator.style.opacity = '0';
    }, 1500);
  }

  async saveSettings() {
    // Keep this method for backward compatibility and explicit saves
    await this.autoSave();
  }

  async resetSettings() {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      this.settings = {
        enabled: true,
        defaultDelay: 30,
        websites: []
      };
      
      await chrome.storage.sync.set(this.settings);
      await this.loadSettings();
      this.renderWebsiteList();
    }
  }
}

const options = new SlowSurfOptions();