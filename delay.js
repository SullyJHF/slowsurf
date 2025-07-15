class SlowSurfDelay {
  constructor() {
    this.init();
  }

  init() {
    this.parseUrlParams();
    this.setupDiscouragingMessages();
    this.setupEventListeners();
    this.startCountdown();
  }

  parseUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    this.targetUrl = decodeURIComponent(urlParams.get('target') || '');
    this.delaySeconds = parseInt(urlParams.get('delay') || '10');
    this.pattern = decodeURIComponent(urlParams.get('pattern') || '');

    document.getElementById('targetWebsite').textContent = this.extractDomain(this.targetUrl);
    document.getElementById('countdownNumber').textContent = this.delaySeconds;
    document.getElementById('btnCountdown').textContent = `(${this.delaySeconds})`;
  }

  extractDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }

  setupDiscouragingMessages() {
    const messages = [
      "Is this really how you want to spend your time?",
      "What could you accomplish instead of browsing?",
      "Consider taking a short walk or doing some stretches.",
      "Maybe it's time to focus on something more productive?",
      "Are you browsing out of boredom or genuine interest?",
      "What would happen if you closed this tab instead?",
      "Could you spend this time learning something new?",
      "Is this the best use of your mental energy right now?",
      "What important task are you avoiding?",
      "Would your future self thank you for this decision?",
      "Are you mindlessly scrolling or intentionally browsing?",
      "What would you do if the internet wasn't available?",
      "Is this bringing you joy or just filling time?",
      "Could you connect with a friend or family member instead?",
      "What creative project could you work on instead?"
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    document.getElementById('discouragingMessage').innerHTML = `<p>${randomMessage}</p>`;
  }

  setupEventListeners() {
    document.getElementById('continueButton').addEventListener('click', () => {
      this.continueToWebsite();
    });

    document.getElementById('cancelButton').addEventListener('click', () => {
      this.cancelNavigation();
    });

    document.getElementById('settingsLink').addEventListener('click', (e) => {
      e.preventDefault();
      this.openSettings();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !document.getElementById('continueButton').disabled) {
        this.continueToWebsite();
      } else if (e.key === 'Escape') {
        this.cancelNavigation();
      }
    });
  }

  startCountdown() {
    this.remainingSeconds = this.delaySeconds;
    
    this.countdownInterval = setInterval(() => {
      this.remainingSeconds--;
      
      document.getElementById('countdownNumber').textContent = this.remainingSeconds;
      document.getElementById('btnCountdown').textContent = `(${this.remainingSeconds})`;
      
      const progressPercentage = ((this.delaySeconds - this.remainingSeconds) / this.delaySeconds) * 100;
      document.getElementById('progressBar').style.width = `${progressPercentage}%`;
      
      if (this.remainingSeconds <= 0) {
        this.enableContinueButton();
      }
    }, 1000);
  }

  enableContinueButton() {
    clearInterval(this.countdownInterval);
    
    const continueBtn = document.getElementById('continueButton');
    const btnCountdown = document.getElementById('btnCountdown');
    
    continueBtn.disabled = false;
    continueBtn.classList.add('enabled');
    btnCountdown.style.display = 'none';
    
    document.getElementById('countdownNumber').textContent = '0';
    document.getElementById('progressBar').style.width = '100%';
    
    continueBtn.focus();
  }

  continueToWebsite() {
    if (!document.getElementById('continueButton').disabled) {
      // Mark this tab as bypassed for this domain
      chrome.runtime.sendMessage({
        action: 'markTabBypassed',
        targetUrl: this.targetUrl
      });
      
      // Navigate to the target website
      window.location.href = this.targetUrl;
    }
  }

  cancelNavigation() {
    window.close();
    
    setTimeout(() => {
      window.location.href = 'about:blank';
    }, 100);
  }

  openSettings() {
    chrome.runtime.openOptionsPage();
  }
}

const delayPage = new SlowSurfDelay();