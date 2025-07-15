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
      defaultDelay: 10,
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
    document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());
    document.getElementById('resetSettings').addEventListener('click', () => this.resetSettings());
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
  }

  removeWebsite(index) {
    this.settings.websites.splice(index, 1);
    this.renderWebsiteList();
  }

  toggleWebsite(index) {
    this.settings.websites[index].enabled = !this.settings.websites[index].enabled;
    this.renderWebsiteList();
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

  async saveSettings() {
    this.settings.enabled = document.getElementById('enableExtension').checked;
    this.settings.defaultDelay = parseInt(document.getElementById('defaultDelay').value);
    
    await chrome.storage.sync.set(this.settings);
    
    const saveBtn = document.getElementById('saveSettings');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Saved!';
    saveBtn.style.backgroundColor = '#4CAF50';
    
    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.style.backgroundColor = '';
    }, 1000);
  }

  async resetSettings() {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      this.settings = {
        enabled: true,
        defaultDelay: 10,
        websites: []
      };
      
      await chrome.storage.sync.set(this.settings);
      await this.loadSettings();
      this.renderWebsiteList();
    }
  }
}

const options = new SlowSurfOptions();