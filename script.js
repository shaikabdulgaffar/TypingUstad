/**
 * ============================================================
 *  Learn Pro Typing — script.js
 *  A full-featured typing practice engine
 *  inspired by MonkeyType & TypingClub.
 * ============================================================
 */

// ============================================================
// 0. TEXT BANK  — varied difficulty paragraphs
// ============================================================
const TEXT_BANK = [
  "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump. The five boxing wizards jump quickly.",
  "Programming is the art of telling another human what one wants the computer to do. Good code is its own best documentation. Any fool can write code that a computer can understand.",
  "Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful. Never stop learning because life never stops teaching.",
  "The only way to do great work is to love what you do. Innovation distinguishes between a leader and a follower. Your time is limited, so do not waste it living someone else's life.",
  "In the beginning was the word, and the word was with code. Every great developer you know got there by solving problems they were unqualified to solve until they actually did it.",
  "Simplicity is the soul of efficiency. Before software can be reusable it first has to be usable. Make it work, make it right, make it fast. Clean code always looks like it was written by someone who cares.",
  "The best error message is the one that never shows up. Debugging is twice as hard as writing the code in the first place. If you write the code as cleverly as possible, you are by definition not smart enough to debug it.",
  "A language that does not affect the way you think about programming is not worth knowing. The most important property of a program is whether it accomplishes the intention of its user."
];

// ============================================================
// 0.5. THEME MANAGEMENT
// ============================================================

// Get saved theme or default to dark
const savedTheme = localStorage.getItem('typing-pro-theme') || 'dark';

// Apply theme on load
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('typing-pro-theme', theme);
}

// Toggle between themes
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
}

// Initialize theme
applyTheme(savedTheme);

// ============================================================
// 0. APP STATE & NAVIGATION
// ============================================================
let currentPage = 'home'; // 'home', 'practice', 'test', 'games', 'settings'
let currentMode = 'test';   // 'practice', 'test', 'games'

// ============================================================
// 1. GAME STATE
// ============================================================
const state = {
  text: '',
  textIndex: 0,
  chars: [],
  currentIndex: 0,
  totalKeys: 0,
  correctKeys: 0,
  errors: 0,
  started: false,
  finished: false,
  timer: 60,
  timerInterval: null,
  startTime: null
};

// ============================================================
// 0.3. SETTINGS MANAGEMENT
// ============================================================
const defaultSettings = {
  testDuration: 60,
  difficultyLevel: 'medium',
  fontSize: 'medium',
  showKeyboard: true,
  soundEffects: false,
  theme: 'dark',
  caretStyle: 'line',
  smoothCaret: true,
  timerWarning: true,
  stopOnError: false,
  quickRestart: true,
  autoStartNext: false,
  statsTracking: 'local'
};

let userSettings = { ...defaultSettings };

// Load settings from localStorage
function loadSettings() {
  const saved = localStorage.getItem('typing-pro-settings');
  if (saved) {
    userSettings = { ...defaultSettings, ...JSON.parse(saved) };
  }
  applySettings();
}

// Save settings to localStorage
function saveSettings() {
  localStorage.setItem('typing-pro-settings', JSON.stringify(userSettings));
}

// Apply settings to UI
function applySettings() {
  // Apply font size
  const fontSizes = { small: '1.1rem', medium: '1.35rem', large: '1.6rem' };
  document.documentElement.style.setProperty('--typing-font-size', fontSizes[userSettings.fontSize]);
  
  // Apply keyboard visibility
  const keyboard = document.querySelector('.keyboard-section');
  if (keyboard) {
    keyboard.style.display = userSettings.showKeyboard ? 'block' : 'none';
  }
  
  // Apply caret style
  if (caretEl) {
    caretEl.className = `caret caret-${userSettings.caretStyle}`;
  }
  
  // Update timer based on test duration
  if (currentMode === 'practice') {
    state.timer = 9999; // Unlimited time for practice
    if (liveTimer) liveTimer.textContent = '∞';
    if (timerChip) timerChip.style.display = 'none';
  } else {
    state.timer = userSettings.testDuration;
    if (liveTimer) liveTimer.textContent = state.timer;
    if (timerChip) {
      timerChip.style.display = 'flex';
      timerChip.classList.remove('warning');
    }
  }
}

// ============================================================
// 0.4. STATISTICS MANAGEMENT
// ============================================================
let userStats = {
  bestWpm: 0,
  avgAccuracy: 0,
  testsTaken: 0,
  timeTyped: 0, // in minutes
  sessionsHistory: []
};

// Load stats from localStorage
function loadStats() {
  const saved = localStorage.getItem('typing-pro-stats');
  if (saved && userSettings.statsTracking !== 'none') {
    userStats = { ...userStats, ...JSON.parse(saved) };
  }
  updateStatsDisplay();
}

// Save stats to localStorage
function saveStats() {
  if (userSettings.statsTracking === 'local') {
    localStorage.setItem('typing-pro-stats', JSON.stringify(userStats));
  }
}

// Update stats display on home page
function updateStatsDisplay() {
  const bestWpmEl = document.getElementById('best-wpm');
  const avgAccEl = document.getElementById('avg-acc');
  const testsTakenEl = document.getElementById('tests-taken');
  const timeTypedEl = document.getElementById('time-typed');
  
  if (bestWpmEl) bestWpmEl.textContent = userStats.bestWpm;
  if (avgAccEl) avgAccEl.textContent = userStats.avgAccuracy + '%';
  if (testsTakenEl) testsTakenEl.textContent = userStats.testsTaken;
  if (timeTypedEl) timeTypedEl.textContent = userStats.timeTyped + 'm';
}

// ============================================================
// 0.5. NAVIGATION SYSTEM
// ============================================================
function showPage(page) {
  // Hide all pages
  const homeContainer = document.getElementById('home-container');
  const gameContainer = document.getElementById('game-container');
  const settingsContainer = document.getElementById('settings-container');
  const homeNav = document.getElementById('home-nav');
  const gameStats = document.getElementById('game-stats');
  
  if (homeContainer) homeContainer.style.display = 'none';
  if (gameContainer) gameContainer.style.display = 'none';
  if (settingsContainer) settingsContainer.style.display = 'none';
  if (homeNav) homeNav.style.display = 'none';
  if (gameStats) gameStats.style.display = 'none';
  
  currentPage = page;
  
  switch(page) {
    case 'home':
      if (homeContainer) homeContainer.style.display = 'flex';
      if (homeNav) homeNav.style.display = 'flex';
      loadStats();
      updateStatsDisplay();
      break;
      
    case 'practice':
    case 'test':
    case 'games':
      if (gameContainer) gameContainer.style.display = 'flex';
      if (gameStats) gameStats.style.display = 'flex';
      const gameModeTitle = document.getElementById('game-mode-title');
      if (gameModeTitle) {
        gameModeTitle.textContent = 
          page === 'practice' ? 'Practice Mode' : 
          page === 'test' ? 'Speed Test' : 'Games';
      }
      currentMode = page;
      setTimeout(() => initGame(false), 100); // Small delay to ensure DOM is ready
      break;
      
    case 'settings':
      if (settingsContainer) settingsContainer.style.display = 'block';
      if (homeNav) homeNav.style.display = 'flex';
      loadSettingsUI();
      break;
  }
}

// ============================================================
// 1. DOM REFERENCES (Updated)
// ============================================================
let wordsContainer, typingArea, caretEl, hiddenInput, instructionBanner;
let liveWpm, liveAcc, liveTimer, timerChip;
let btnRestart, btnNewText, btnBack, themeToggle;
let navHome, navStats, settingsBack;
let modePractice, modeTest, modeGames;
let modalOverlay, resultWpm, resultAcc, resultCorrect, resultErrors;
let perfFill, perfTag, modalRestart, modalNew, modalHome;

// Keyboard keys map: key value → DOM element(s)
let keyElements = {};

function initializeElements() {
  wordsContainer   = document.getElementById('words-container');
  typingArea       = document.getElementById('typing-area');
  caretEl          = document.getElementById('caret');
  hiddenInput      = document.getElementById('hidden-input');
  instructionBanner = document.getElementById('instruction-banner');

  // Header live stats
  liveWpm          = document.getElementById('live-wpm');
  liveAcc          = document.getElementById('live-acc');
  liveTimer        = document.getElementById('live-timer');
  timerChip        = document.getElementById('header-time');

  // Action buttons
  btnRestart       = document.getElementById('btn-restart');
  btnNewText       = document.getElementById('btn-new-text');
  btnBack          = document.getElementById('btn-back');
  themeToggle      = document.getElementById('theme-toggle');

  // Navigation
  navHome          = document.getElementById('nav-home');
  navStats         = document.getElementById('nav-stats');
  settingsBack     = document.getElementById('settings-back');

  // Mode cards
  modePractice     = document.getElementById('mode-practice');
  modeTest         = document.getElementById('mode-test');
  modeGames        = document.getElementById('mode-games');

  // Modal
  modalOverlay     = document.getElementById('modal-overlay');
  resultWpm        = document.getElementById('result-wpm');
  resultAcc        = document.getElementById('result-acc');
  resultCorrect    = document.getElementById('result-correct');
  resultErrors     = document.getElementById('result-errors');
  perfFill         = document.getElementById('perf-fill');
  perfTag          = document.getElementById('perf-tag');
  modalRestart     = document.getElementById('modal-restart');
  modalNew         = document.getElementById('modal-new');
  modalHome        = document.getElementById('modal-home');

  // Initialize keyboard elements
  keyElements = {};
  document.querySelectorAll('.key').forEach(el => {
    const k = el.dataset.key;
    if (!keyElements[k]) keyElements[k] = [];
    keyElements[k].push(el);
  });
}

// ============================================================
// 3. INITIALISATION (Updated)
// ============================================================
function initGame(useNewText = false) {
  // Clear any running timer
  clearInterval(state.timerInterval);

  if (useNewText) {
    state.textIndex = (state.textIndex + 1) % TEXT_BANK.length;
  }

  // Reset state
  state.text          = TEXT_BANK[state.textIndex];
  state.currentIndex  = 0;
  state.totalKeys     = 0;
  state.correctKeys   = 0;
  state.errors        = 0;
  state.started       = false;
  state.finished      = false;
  state.startTime     = null;

  // Update timer based on current mode and settings
  if (currentMode === 'practice') {
    state.timer = 9999; // Unlimited time for practice
    if (liveTimer) liveTimer.textContent = '∞';
    if (timerChip) timerChip.style.display = 'none';
  } else {
    state.timer = userSettings.testDuration;
    if (liveTimer) liveTimer.textContent = state.timer;
    if (timerChip) {
      timerChip.style.display = 'flex';
      timerChip.classList.remove('warning');
    }
  }

  // Update UI
  if (liveWpm) liveWpm.textContent = '0';
  if (liveAcc) liveAcc.textContent = '100%';

  // Build character spans
  renderText();

  // Show instruction banner
  if (instructionBanner) instructionBanner.classList.remove('hidden');

  // Hide modal
  if (modalOverlay) modalOverlay.classList.remove('visible');

  // Remove active class from typing area
  if (typingArea) typingArea.classList.remove('active');

  // Position caret on first char
  setTimeout(() => positionCaret(), 10);

  // Clear all key highlights
  clearKeyHighlights();

  // Highlight the first key to press
  highlightNextKey();
}

/** Render text characters as individual <span> elements */
function renderText() {
  if (!wordsContainer) return;
  
  wordsContainer.innerHTML = '';
  state.chars = [];

  for (let i = 0; i < state.text.length; i++) {
    const span = document.createElement('span');
    span.classList.add('char');

    if (state.text[i] === ' ') {
      span.classList.add('space-char');
      span.innerHTML = '&nbsp;';
    } else {
      span.textContent = state.text[i];
    }

    wordsContainer.appendChild(span);
    state.chars.push(span);
  }

  // Mark first char as current
  if (state.chars.length > 0) {
    state.chars[0].classList.add('current');
  }
}

// ============================================================
// 4. CARET POSITIONING
// ============================================================
function positionCaret() {
  if (!caretEl || !state.chars || state.chars.length === 0) return;

  const currentChar = state.chars[state.currentIndex];
  if (!currentChar) return;

  const rect = currentChar.getBoundingClientRect();
  const containerRect = typingArea.getBoundingClientRect();

  caretEl.style.left = (rect.left - containerRect.left) + 'px';
  caretEl.style.top = (rect.top - containerRect.top) + 'px';
}

// ============================================================
// 5. KEYBOARD HANDLING
// ============================================================
function handleKeyDown(e) {
  if (state.finished || currentPage !== 'practice' && currentPage !== 'test' && currentPage !== 'games') return;

  // Start the game on first keypress
  if (!state.started) {
    startGame();
  }

  const key = e.key;

  // Handle special keys
  if (key === 'Escape') {
    initGame(false);
    e.preventDefault();
    return;
  }

  // Ignore modifier keys
  if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(key)) {
    e.preventDefault();
    return;
  }

  // Handle backspace
  if (key === 'Backspace') {
    handleBackspace();
    e.preventDefault();
    return;
  }

  // Handle regular typing
  if (state.currentIndex < state.text.length) {
    const expectedChar = state.text[state.currentIndex];
    state.totalKeys++;

    // Visual key press feedback
    animateKeyPress(key);

    if (key === expectedChar) {
      // Correct keystroke
      state.correctKeys++;
      state.chars[state.currentIndex].classList.remove('current', 'incorrect');
      state.chars[state.currentIndex].classList.add('correct');
      state.currentIndex++;

      // Mark next char as current
      if (state.currentIndex < state.chars.length) {
        state.chars[state.currentIndex].classList.add('current');
      }
    } else {
      // Incorrect keystroke
      state.errors++;
      state.chars[state.currentIndex].classList.add('incorrect');
      
      if (!userSettings.stopOnError) {
        state.chars[state.currentIndex].classList.remove('current');
        state.currentIndex++;
        if (state.currentIndex < state.chars.length) {
          state.chars[state.currentIndex].classList.add('current');
        }
      }
    }

    // Update live stats
    updateLiveStats();

    // Position caret
    positionCaret();

    // Highlight next key
    highlightNextKey();

    // Check if finished
    if (state.currentIndex >= state.text.length) {
      endGame();
    }
  }

  e.preventDefault();
}

function handleBackspace() {
  if (state.currentIndex > 0) {
    state.currentIndex--;
    state.chars[state.currentIndex].classList.remove('correct', 'incorrect');
    state.chars[state.currentIndex].classList.add('current');

    // Remove current class from next char
    if (state.currentIndex + 1 < state.chars.length) {
      state.chars[state.currentIndex + 1].classList.remove('current');
    }

    positionCaret();
    highlightNextKey();
  }
}

function startGame() {
  state.started = true;
  state.startTime = Date.now();
  
  // Hide instruction banner
  if (instructionBanner) instructionBanner.classList.add('hidden');
  
  // Add active class to typing area
  if (typingArea) typingArea.classList.add('active');
  
  // Start caret animation
  if (caretEl) caretEl.classList.add('typing');

  // Start timer (only for timed modes)
  if (currentMode !== 'practice') {
    state.timerInterval = setInterval(() => {
      state.timer--;
      if (liveTimer) liveTimer.textContent = state.timer;

      // Warning at 10 seconds
      if (state.timer <= 10 && userSettings.timerWarning) {
        if (timerChip) timerChip.classList.add('warning');
      }

      if (state.timer <= 0) {
        endGame();
      }
    }, 1000);
  }
}

// ============================================================
// 6. CALCULATIONS
// ============================================================
function calculateWPM() {
  if (!state.started || !state.startTime) return 0;
  
  const timeElapsed = (Date.now() - state.startTime) / 1000 / 60; // in minutes
  if (timeElapsed === 0) return 0;
  
  const wordsTyped = state.correctKeys / 5; // Standard: 5 characters = 1 word
  return Math.round(wordsTyped / timeElapsed);
}

function calculateAccuracy() {
  if (state.totalKeys === 0) return 100;
  return Math.round((state.correctKeys / state.totalKeys) * 100);
}

function updateLiveStats() {
  if (liveWpm) liveWpm.textContent = calculateWPM();
  if (liveAcc) liveAcc.textContent = calculateAccuracy() + '%';
}

// ============================================================
// 7. KEYBOARD HIGHLIGHTING
// ============================================================
function highlightNextKey() {
  clearKeyHighlights();
  
  if (state.currentIndex >= state.text.length) return;
  
  const nextChar = state.text[state.currentIndex];
  let keyToHighlight = nextChar.toLowerCase();
  
  // Map special characters
  if (keyToHighlight === ' ') keyToHighlight = ' ';
  
  if (keyElements[keyToHighlight]) {
    keyElements[keyToHighlight].forEach(el => {
      el.classList.add('highlight');
    });
  }
}

function clearKeyHighlights() {
  document.querySelectorAll('.key.highlight').forEach(el => {
    el.classList.remove('highlight');
  });
}

function animateKeyPress(key) {
  let keyToPress = key.toLowerCase();
  if (keyToPress === ' ') keyToPress = ' ';
  
  if (keyElements[keyToPress]) {
    keyElements[keyToPress].forEach(el => {
      el.classList.add('pressed');
      setTimeout(() => el.classList.remove('pressed'), 100);
    });
  }
}

// ============================================================
// 9. GAME OVER (Updated)
// ============================================================
function endGame() {
  if (state.finished) return;
  state.finished = true;
  clearInterval(state.timerInterval);
  if (caretEl) caretEl.classList.remove('typing');
  clearKeyHighlights();

  const finalWpm = calculateWPM();
  const finalAcc = calculateAccuracy();

  // Update user statistics
  if (userSettings.statsTracking !== 'none' && currentMode !== 'practice') {
    userStats.testsTaken++;
    userStats.bestWpm = Math.max(userStats.bestWpm, finalWpm);
    userStats.avgAccuracy = Math.round(
      ((userStats.avgAccuracy * (userStats.testsTaken - 1)) + finalAcc) / userStats.testsTaken
    );
    userStats.timeTyped += Math.round((userSettings.testDuration - state.timer) / 60);
    
    // Save the session
    userStats.sessionsHistory.push({
      wpm: finalWpm,
      accuracy: finalAcc,
      errors: state.errors,
      mode: currentMode,
      date: new Date().toISOString()
    });
    
    saveStats();
  }

  // Populate modal
  if (resultWpm) resultWpm.textContent = finalWpm;
  if (resultAcc) resultAcc.textContent = finalAcc + '%';
  if (resultCorrect) resultCorrect.textContent = state.correctKeys;
  if (resultErrors) resultErrors.textContent = state.errors;

  // Performance bar (cap at 120 wpm = 100%)
  const fillPct = Math.min((finalWpm / 120) * 100, 100);
  setTimeout(() => { 
    if (perfFill) perfFill.style.width = fillPct + '%'; 
  }, 100);

  // Performance tag
  let tag = 'Beginner';
  if      (finalWpm >= 100) tag = '🚀 Speed Demon';
  else if (finalWpm >= 80)  tag = '⚡ Advanced';
  else if (finalWpm >= 60)  tag = '🔥 Proficient';
  else if (finalWpm >= 40)  tag = '✨ Intermediate';
  else if (finalWpm >= 20)  tag = '📈 Progressing';
  else                      tag = '🌱 Beginner';
  if (perfTag) perfTag.textContent = tag;

  // Show modal with slight delay for animation
  setTimeout(() => { 
    if (modalOverlay) modalOverlay.classList.add('visible'); 
  }, 300);
}

// ============================================================
// 10. SETTINGS UI MANAGEMENT
// ============================================================
function loadSettingsUI() {
  // Load all settings into the UI elements
  const elements = {
    'test-duration': userSettings.testDuration,
    'difficulty-level': userSettings.difficultyLevel,
    'font-size': userSettings.fontSize,
    'show-keyboard': userSettings.showKeyboard,
    'sound-effects': userSettings.soundEffects,
    'theme-select': userSettings.theme,
    'caret-style': userSettings.caretStyle,
    'smooth-caret': userSettings.smoothCaret,
    'timer-warning': userSettings.timerWarning,
    'stop-on-error': userSettings.stopOnError,
    'quick-restart': userSettings.quickRestart,
    'auto-start-next': userSettings.autoStartNext,
    'stats-tracking': userSettings.statsTracking
  };

  Object.entries(elements).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) {
      if (element.type === 'checkbox') {
        element.checked = value;
      } else {
        element.value = value;
      }
    }
  });
}

function handleSettingChange(key, value) {
  userSettings[key] = value;
  saveSettings();
  applySettings();
}

// Data management functions
function exportStats() {
  const data = {
    stats: userStats,
    settings: userSettings,
    exportDate: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'typing-pro-data.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function resetStats() {
  if (confirm('Are you sure you want to reset all statistics? This cannot be undone.')) {
    userStats = {
      bestWpm: 0,
      avgAccuracy: 0,
      testsTaken: 0,
      timeTyped: 0,
      sessionsHistory: []
    };
    saveStats();
    updateStatsDisplay();
    alert('Statistics have been reset.');
  }
}

function clearAllData() {
  if (confirm('Are you sure you want to clear ALL data including settings and statistics? This cannot be undone.')) {
    localStorage.removeItem('typing-pro-settings');
    localStorage.removeItem('typing-pro-stats');
    localStorage.removeItem('typing-pro-theme');
    location.reload();
  }
}

// ============================================================
// 11. EVENT LISTENERS SETUP
// ============================================================
function setupEventListeners() {
  // Window-level keydown for seamless MonkeyType feel
  window.addEventListener('keydown', handleKeyDown);

  // Theme toggle
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // Click anywhere on the typing area to focus (also triggers mobile keyboard)
  if (typingArea) {
    typingArea.addEventListener('click', () => {
      if (hiddenInput) hiddenInput.focus();
    });
  }

  document.addEventListener('click', (e) => {
    if (modalOverlay && !modalOverlay.contains(e.target) && 
        themeToggle && !themeToggle.contains(e.target)) {
      if (hiddenInput) hiddenInput.focus();
    }
  });

  // Mobile: forward input from hidden field to handler
  if (hiddenInput) {
    hiddenInput.addEventListener('input', (e) => {
      const val = e.data;
      if (val) {
        const syntheticEvent = { key: val, preventDefault: () => {} };
        handleKeyDown(syntheticEvent);
      }
      hiddenInput.value = '';
    });
  }

  // Restart buttons
  if (btnRestart) btnRestart.addEventListener('click', () => initGame(false));
  if (modalRestart) modalRestart.addEventListener('click', () => initGame(false));

  // New Text buttons
  if (btnNewText) btnNewText.addEventListener('click', () => initGame(true));
  if (modalNew) modalNew.addEventListener('click', () => initGame(true));

  // Navigation events
  if (navHome) navHome.addEventListener('click', () => showPage('home'));
  if (navStats) navStats.addEventListener('click', () => showPage('home'));
  if (settingsBack) settingsBack.addEventListener('click', () => showPage('home'));
  if (btnBack) btnBack.addEventListener('click', () => showPage('home'));

  // Mode selection events
  if (modePractice) modePractice.addEventListener('click', () => showPage('practice'));
  if (modeTest) modeTest.addEventListener('click', () => showPage('test'));
  if (modeGames) modeGames.addEventListener('click', () => showPage('games'));

  // Settings icon in header
  const settingsIconBtn = document.getElementById('settings-icon-btn');
  if (settingsIconBtn) settingsIconBtn.addEventListener('click', () => showPage('settings'));

  // Modal home button
  if (modalHome) modalHome.addEventListener('click', () => showPage('home'));

  // Settings change listeners
  const settingsElements = [
    { id: 'test-duration', key: 'testDuration', type: 'number' },
    { id: 'difficulty-level', key: 'difficultyLevel', type: 'string' },
    { id: 'font-size', key: 'fontSize', type: 'string' },
    { id: 'show-keyboard', key: 'showKeyboard', type: 'boolean' },
    { id: 'sound-effects', key: 'soundEffects', type: 'boolean' },
    { id: 'theme-select', key: 'theme', type: 'theme' },
    { id: 'caret-style', key: 'caretStyle', type: 'string' },
    { id: 'smooth-caret', key: 'smoothCaret', type: 'boolean' },
    { id: 'timer-warning', key: 'timerWarning', type: 'boolean' },
    { id: 'stop-on-error', key: 'stopOnError', type: 'boolean' },
    { id: 'quick-restart', key: 'quickRestart', type: 'boolean' },
    { id: 'auto-start-next', key: 'autoStartNext', type: 'boolean' },
    { id: 'stats-tracking', key: 'statsTracking', type: 'string' }
  ];

  settingsElements.forEach(({ id, key, type }) => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('change', (e) => {
        let value = e.target.value;
        if (type === 'boolean') value = e.target.checked;
        if (type === 'number') value = parseInt(value);
        
        handleSettingChange(key, value);
        
        if (type === 'theme') {
          applyTheme(value);
        }
      });
    }
  });

  // Data management buttons
  const exportBtn = document.getElementById('export-data');
  const resetBtn = document.getElementById('reset-stats');
  const clearBtn = document.getElementById('clear-data');
  
  if (exportBtn) exportBtn.addEventListener('click', exportStats);
  if (resetBtn) resetBtn.addEventListener('click', resetStats);
  if (clearBtn) clearBtn.addEventListener('click', clearAllData);

  // Reposition caret on window resize
  window.addEventListener('resize', () => {
    setTimeout(positionCaret, 10);
  });
}

// ============================================================
// 12. INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // Initialize all DOM elements
  initializeElements();
  
  // Load settings and stats on startup
  loadSettings();
  loadStats();
  
  // Setup all event listeners
  setupEventListeners();
  
  // Start on home page
  showPage('home');
});