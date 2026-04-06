// ============================================================
// Queue Number: The Great Allocation — App Controller
// ============================================================
// Handles: screen management, theme, room creation/joining,
// lobby, game wiring, bottom nav, reconnection, and event binding.
// ============================================================

// ============================================================
// APP STATE
// ============================================================

const App = {
  roomCode: null,
  playerId: null,
  playerName: null,
  isHost: false,
  gameEngine: null,
  players: {},
  lobbyListeners: [],
  logListener: null,

  // --- Screen Management ---
  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(screenId);
    if (screen) screen.classList.add('active');

    // Update meta theme color based on screen
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      meta.content = isDark ? '#0D1117' : '#F8FAFC';
    }
  },

  // --- Theme Management ---
  initTheme() {
    const saved = localStorage.getItem('qn-theme');
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
    }
    this.updateThemeIcon();
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('qn-theme', next);
    this.updateThemeIcon();

    // Regenerate QR with new colors if in lobby
    if (this.roomCode && document.getElementById('screen-lobby').classList.contains('active')) {
      QRHelper.generateRoomQR(this.roomCode);
    }
  },

  updateThemeIcon() {
    const icon = document.getElementById('theme-icon');
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    if (icon) icon.innerHTML = isDark ? '&#9790;' : '&#9728;';
  },

  // --- Session Management ---
  saveSession() {
    localStorage.setItem('qn-session', JSON.stringify({
      roomCode: this.roomCode,
      playerId: this.playerId,
      playerName: this.playerName,
      isHost: this.isHost,
    }));
  },

  loadSession() {
    try {
      const data = JSON.parse(localStorage.getItem('qn-session'));
      return data;
    } catch {
      return null;
    }
  },

  clearSession() {
    localStorage.removeItem('qn-session');
  },

  // ============================================================
  // ROOM CREATION
  // ============================================================

  async createRoom() {
    // Generate unique room code
    let roomCode;
    let exists = true;
    let attempts = 0;

    while (exists && attempts < 10) {
      roomCode = FirebaseHelper.generateRoomCode();
      const data = await FirebaseHelper.getData(`rooms/${roomCode}`);
      exists = data !== null;
      attempts++;
    }

    this.roomCode = roomCode;
    this.playerId = FirebaseHelper.generatePlayerId();
    this.isHost = true;

    // Prompt for name
    const name = await this.promptPlayerName();
    if (!name) return;
    this.playerName = name;

    // Create room in Firebase
    await FirebaseHelper.setData(`rooms/${roomCode}`, {
      meta: {
        host: this.playerId,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        status: 'lobby',
        settings: {
          maxPlayers: 5,
        },
      },
      players: {
        [this.playerId]: {
          name: name,
          joinedAt: firebase.database.ServerValue.TIMESTAMP,
          connected: true,
          order: 0,
        },
      },
    });

    // Setup presence
    FirebaseHelper.setupPresence(roomCode, this.playerId);

    this.saveSession();
    this.showLobby();
  },

  // ============================================================
  // ROOM JOINING
  // ============================================================

  async joinRoom(code) {
    const roomCode = (code || '').toUpperCase().trim();
    if (roomCode.length !== 4) {
      Toast.show('Please enter a 4-character room code', 'error');
      return;
    }

    // Check room exists
    const roomData = await FirebaseHelper.getData(`rooms/${roomCode}`);
    if (!roomData) {
      Toast.show('Room not found', 'error');
      return;
    }

    if (roomData.meta && roomData.meta.status === 'finished') {
      Toast.show('This game has already ended', 'error');
      return;
    }

    // Check player count
    const players = roomData.players || {};
    const maxPlayers = (roomData.meta && roomData.meta.settings && roomData.meta.settings.maxPlayers) || 5;
    if (Object.keys(players).length >= maxPlayers) {
      Toast.show('Room is full', 'error');
      return;
    }

    // Prompt for name
    const name = await this.promptPlayerName();
    if (!name) return;

    this.roomCode = roomCode;
    this.playerId = FirebaseHelper.generatePlayerId();
    this.playerName = name;
    this.isHost = false;

    // Add player to room
    const order = Object.keys(players).length;
    await FirebaseHelper.setData(`rooms/${roomCode}/players/${this.playerId}`, {
      name: name,
      joinedAt: firebase.database.ServerValue.TIMESTAMP,
      connected: true,
      order: order,
    });

    // Setup presence
    FirebaseHelper.setupPresence(roomCode, this.playerId);

    this.saveSession();
    this.showLobby();
  },

  // ============================================================
  // RECONNECTION
  // ============================================================

  async attemptReconnect() {
    const session = this.loadSession();
    if (!session || !session.roomCode || !session.playerId) return false;

    // Check if room still exists
    const roomData = await FirebaseHelper.getData(`rooms/${session.roomCode}`);
    if (!roomData) {
      this.clearSession();
      return false;
    }

    // Check if player still in room
    const playerData = roomData.players && roomData.players[session.playerId];
    if (!playerData) {
      this.clearSession();
      return false;
    }

    // Reconnect
    this.roomCode = session.roomCode;
    this.playerId = session.playerId;
    this.playerName = session.playerName;
    this.isHost = session.isHost;

    // Update connection status
    await FirebaseHelper.updateData(`rooms/${this.roomCode}/players/${this.playerId}`, {
      connected: true,
    });

    FirebaseHelper.setupPresence(this.roomCode, this.playerId);

    // Check game status
    const status = roomData.meta && roomData.meta.status;
    if (status === 'playing') {
      this.showLobby();
      // Lobby will detect playing status and transition to game
      return true;
    } else if (status === 'lobby') {
      this.showLobby();
      return true;
    }

    this.clearSession();
    return false;
  },

  // ============================================================
  // LOBBY
  // ============================================================

  showLobby() {
    this.showScreen('screen-lobby');

    // Display room code
    document.getElementById('lobby-room-code').textContent = this.roomCode;
    document.getElementById('game-room-code').textContent = this.roomCode;

    // Generate QR
    QRHelper.generateRoomQR(this.roomCode);

    // Show share button on mobile if supported
    if (navigator.share) {
      document.getElementById('btn-share').style.display = '';
    }

    // Start listening to players
    this.startLobbyListeners();

    // Only host can start
    const startBtn = document.getElementById('btn-start-game');
    if (!this.isHost) {
      startBtn.style.display = 'none';
      document.getElementById('lobby-status-text').textContent = 'Waiting for host to start...';
    } else {
      startBtn.style.display = '';
    }
  },

  startLobbyListeners() {
    // Clean up old listeners
    this.lobbyListeners.forEach(ref => ref.off());
    this.lobbyListeners = [];

    // Listen to player list
    const playersRef = FirebaseHelper.onValue(`rooms/${this.roomCode}/players`, (data) => {
      this.players = data || {};
      this.renderPlayerList();
      this.updateStartButton();

      // Share with game engine if it exists
      if (this.gameEngine) {
        this.gameEngine.players = this.players;
      }
    });
    this.lobbyListeners.push(playersRef);

    // Listen to game status
    const statusRef = FirebaseHelper.onValue(`rooms/${this.roomCode}/meta/status`, (status) => {
      if (status === 'playing') {
        this.startGame();
      }
    });
    this.lobbyListeners.push(statusRef);
  },

  renderPlayerList() {
    const list = document.getElementById('lobby-player-list');
    const countEl = document.getElementById('lobby-player-count');
    if (!list) return;

    const playerEntries = Object.entries(this.players);
    if (countEl) countEl.textContent = `${playerEntries.length} / 5`;

    list.innerHTML = '';
    playerEntries
      .sort((a, b) => (a[1].order || 0) - (b[1].order || 0))
      .forEach(([pid, player], index) => {
        const card = document.createElement('div');
        card.className = 'lobby-player-card';

        const isMe = pid === this.playerId;
        const isHost = index === 0; // first player is host by order

        card.innerHTML = `
          <div class="player-avatar player-avatar-${index % 5}">${(player.name || '?')[0].toUpperCase()}</div>
          <div class="player-info">
            <div class="player-name">${player.name || 'Unknown'}${isMe ? ' (you)' : ''}</div>
            <div class="player-status">${player.connected ? 'Connected' : 'Disconnected'}</div>
          </div>
          ${isHost ? '<span class="player-host-badge">Host</span>' : ''}
          <div class="connection-dot ${player.connected ? 'online' : 'offline'}"></div>
        `;

        list.appendChild(card);
      });
  },

  updateStartButton() {
    const btn = document.getElementById('btn-start-game');
    const statusText = document.getElementById('lobby-status-text');
    if (!this.isHost) return;

    const count = Object.keys(this.players).length;
    if (count >= 2) {
      btn.disabled = false;
      statusText.textContent = `${count} players ready. You can start!`;
    } else {
      btn.disabled = true;
      statusText.textContent = 'Need at least 2 players to start';
    }
  },

  // ============================================================
  // GAME START
  // ============================================================

  async startGame() {
    if (this.gameEngine) return; // Already started

    this.showScreen('screen-game');

    // Initialize game engine
    this.gameEngine = new GameEngine(this.roomCode, this.playerId, this.isHost);
    this.gameEngine.players = this.players;

    if (this.isHost) {
      // Host sets status to playing and initializes game
      await FirebaseHelper.updateData(`rooms/${this.roomCode}/meta`, { status: 'playing' });
      await this.gameEngine.initGame(this.players);
    } else {
      // Non-host just starts listeners
      this.gameEngine.startListeners();
    }

    // Start log listener
    this.startLogListener();

    // Setup bottom nav
    this.initBottomNav();

    // Setup action button
    this.initActionButton();

    // Show tutorial on first play
    setTimeout(() => this.showTutorial(), 500);
  },

  // ============================================================
  // GAME UI WIRING
  // ============================================================

  initBottomNav() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.getAttribute('data-tab');

        // Update active tab
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Update active content
        document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
        const target = document.getElementById(targetId);
        if (target) target.classList.add('active');

        // Hide waiting overlay when switching tabs (it's in the main area)
      });
    });
  },

  initActionButton() {
    const btn = document.getElementById('btn-action');
    btn.addEventListener('click', () => {
      if (!this.gameEngine) return;

      if (this.gameEngine.phase === 'commit' && !this.gameEngine.hasSubmitted) {
        this.gameEngine.submitCommitment();
      } else if (this.gameEngine.phase === 'resolve' && this.isHost) {
        this.gameEngine.advanceRound();
      }
    });
  },

  startLogListener() {
    if (this.logListener) this.logListener.off();

    this.logListener = FirebaseHelper.onValue(`rooms/${this.roomCode}/gameState/log`, (data) => {
      const logContainer = document.getElementById('game-log');
      if (!logContainer || !data) return;

      logContainer.innerHTML = '';
      const entries = Object.values(data).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      entries.forEach(entry => {
        const div = document.createElement('div');
        div.className = 'log-entry';
        div.innerHTML = `
          <span class="log-round">R${entry.round || '?'}</span>
          <span class="log-text">${entry.message || ''}</span>
        `;
        logContainer.appendChild(div);
      });
    });
  },

  // ============================================================
  // LOCAL TEST MODE
  // ============================================================

  async startLocalTest() {
    // Simulate a game without Firebase for testing UI
    Toast.show('Starting local test mode...', 'info');

    this.roomCode = 'TEST';
    this.playerId = 'local_p1';
    this.playerName = 'You';
    this.isHost = true;

    this.players = {
      'local_p1': { name: 'You', connected: true, order: 0 },
      'local_p2': { name: 'Bot Alice', connected: true, order: 1 },
      'local_p3': { name: 'Bot Bob', connected: true, order: 2 },
    };

    this.showScreen('screen-game');

    // Create a mock game engine that doesn't use Firebase
    const engine = new GameEngine(this.roomCode, this.playerId, true);
    engine.players = this.players;
    engine.totalRounds = 8;
    engine.round = 1;
    engine.phase = 'commit';
    engine.time = 10;

    // Deal a hand locally
    const decks = createShuffledDecks();
    engine.hand = dealCards(decks.queueDeck, 5);
    engine.opportunityRow = dealCards(decks.opportunityDeck, 3);
    engine.disruption = dealCards(decks.disruptionDeck, 1)[0];
    engine.milestones = [decks.milestoneDeck[0]];
    engine.scores = {
      'local_p1': { time: 10, score: 0, milestones: [decks.milestoneDeck[0]], wonOpportunities: [], auctionSpent: 0 },
      'local_p2': { time: 10, score: 0, milestones: [decks.milestoneDeck[1]], wonOpportunities: [], auctionSpent: 0 },
      'local_p3': { time: 10, score: 0, milestones: [decks.milestoneDeck[2]], wonOpportunities: [], auctionSpent: 0 },
    };

    this.gameEngine = engine;

    // Render everything
    engine.renderHeader();
    engine.renderBoard();
    engine.renderHand();
    engine.renderDisruption();
    engine.renderScores();
    engine.renderPlayerMilestones();
    engine.updateActionBar();

    this.initBottomNav();
    this.initActionButton();

    // Override submit for local test
    const originalSubmit = engine.submitCommitment.bind(engine);
    engine.submitCommitment = async () => {
      if (engine.selectedCardIndex === null || engine.selectedOpportunityIndex === null) return;
      engine.hasSubmitted = true;
      Toast.show('Submitted! (Local test — simulating resolution)', 'success');
      engine.updateActionBar();
      engine.showWaiting();

      // Simulate bots submitting after a delay
      setTimeout(() => {
        // Simulate resolution
        const fakeResults = engine.opportunityRow.map((opp, i) => {
          if (i === engine.selectedOpportunityIndex) {
            return {
              opportunityName: opp.name,
              resolution: opp.resolution,
              winners: [{ playerId: 'local_p1', name: 'You' }],
              losers: [{ playerId: 'local_p2', name: 'Bot Alice' }],
            };
          }
          return {
            opportunityName: opp.name,
            resolution: opp.resolution,
            winners: [{ playerId: 'local_p2', name: 'Bot Alice' }],
            losers: [],
          };
        });

        engine.hideWaiting();
        engine.phase = 'resolve';
        engine.renderHeader();
        engine.updateActionBar();
        engine.showRoundResults(fakeResults);
      }, 2000);
    };

    // Override advance for local test
    engine.advanceRound = async () => {
      engine.round++;
      if (engine.round > engine.totalRounds) {
        Toast.show('Game over! (Local test)', 'info');
        return;
      }
      engine.phase = 'commit';
      engine.selectedCardIndex = null;
      engine.selectedOpportunityIndex = null;
      engine.timeBid = 0;
      engine.hasSubmitted = false;

      // Draw new opportunities
      engine.opportunityRow = dealCards(decks.opportunityDeck, 3);
      engine.disruption = decks.disruptionDeck.length > 0 ? dealCards(decks.disruptionDeck, 1)[0] : null;

      // Replace played card
      if (engine.hand.length < 5 && decks.queueDeck.length > 0) {
        engine.hand.push(decks.queueDeck.shift());
      }

      engine.renderHeader();
      engine.renderBoard();
      engine.renderHand();
      engine.renderDisruption();
      engine.updateActionBar();
      Toast.show(`Round ${engine.round} begins!`, 'info');

      document.getElementById('results-modal').close();
    };

    // Add log
    const logContainer = document.getElementById('game-log');
    if (logContainer) {
      logContainer.innerHTML = `
        <div class="log-entry">
          <span class="log-round">R1</span>
          <span class="log-text">Local test mode started. Select a card and an opportunity, then submit!</span>
        </div>
      `;
    }
  },

  // ============================================================
  // TUTORIAL
  // ============================================================

  showTutorial(force = false) {
    if (!force && localStorage.getItem('qn-tutorial-seen')) return;

    const modal = document.getElementById('tutorial-modal');
    if (!modal) return;

    this.tutorialSlide = 0;
    this.updateTutorialSlide();
    modal.showModal();
  },

  updateTutorialSlide() {
    const slides = document.querySelectorAll('#tutorial-slides .tutorial-slide');
    const dots = document.querySelectorAll('#tutorial-dots .tutorial-dot');
    const prevBtn = document.getElementById('tutorial-prev');
    const nextBtn = document.getElementById('tutorial-next');
    const total = slides.length;

    slides.forEach((s, i) => s.classList.toggle('active', i === this.tutorialSlide));
    dots.forEach((d, i) => d.classList.toggle('active', i === this.tutorialSlide));

    if (prevBtn) prevBtn.disabled = this.tutorialSlide === 0;
    if (nextBtn) {
      if (this.tutorialSlide === total - 1) {
        nextBtn.textContent = 'Got it!';
        nextBtn.className = 'btn btn-primary';
      } else {
        nextBtn.textContent = 'Next';
        nextBtn.className = 'btn btn-primary';
      }
    }
  },

  closeTutorial() {
    const modal = document.getElementById('tutorial-modal');
    if (modal) modal.close();
    localStorage.setItem('qn-tutorial-seen', '1');
  },

  tutorialSlide: 0,

  // ============================================================
  // HELPERS
  // ============================================================

  promptPlayerName() {
    return new Promise((resolve) => {
      const modal = document.getElementById('name-modal');
      const input = document.getElementById('input-player-name');
      const btn = document.getElementById('btn-confirm-name');
      const cancelBtn = document.getElementById('btn-cancel-name');
      if (!modal || !input || !btn) {
        const name = prompt('Enter your display name:');
        resolve(name && name.trim() ? name.trim().substring(0, 20) : null);
        return;
      }

      input.value = '';
      btn.disabled = true;

      const onInput = () => { btn.disabled = !input.value.trim(); };
      input.addEventListener('input', onInput);

      const onKeyup = (e) => { if (e.key === 'Enter' && input.value.trim()) btn.click(); };
      input.addEventListener('keyup', onKeyup);

      const cleanup = () => {
        input.removeEventListener('input', onInput);
        input.removeEventListener('keyup', onKeyup);
        modal.close();
      };

      btn.onclick = () => {
        const name = input.value.trim().substring(0, 20);
        cleanup();
        resolve(name || null);
      };

      cancelBtn.onclick = () => { cleanup(); resolve(null); };
      modal.addEventListener('cancel', () => { cleanup(); resolve(null); }, { once: true });

      modal.showModal();
      setTimeout(() => input.focus(), 100);
    });
  },

  // ============================================================
  // REMATCH / HOME
  // ============================================================

  async rematch() {
    if (!this.isHost) {
      Toast.show('Only the host can start a rematch', 'error');
      return;
    }

    // Reset game state, keep same room and players
    if (this.gameEngine) {
      this.gameEngine.destroy();
      this.gameEngine = null;
    }

    await FirebaseHelper.updateData(`rooms/${this.roomCode}/meta`, { status: 'lobby' });
    await FirebaseHelper.removeData(`rooms/${this.roomCode}/gameState`);
    await FirebaseHelper.removeData(`rooms/${this.roomCode}/hands`);
    await FirebaseHelper.removeData(`rooms/${this.roomCode}/submissions`);
    await FirebaseHelper.removeData(`rooms/${this.roomCode}/decks`);
    await FirebaseHelper.removeData(`rooms/${this.roomCode}/milestoneChoices`);

    this.showLobby();
    Toast.show('Room reset! Start a new game when ready.', 'info');
  },

  goHome() {
    if (this.gameEngine) {
      this.gameEngine.destroy();
      this.gameEngine = null;
    }
    this.lobbyListeners.forEach(ref => ref.off());
    this.lobbyListeners = [];
    if (this.logListener) {
      this.logListener.off();
      this.logListener = null;
    }

    this.roomCode = null;
    this.playerId = null;
    this.isHost = false;
    this.players = {};
    this.clearSession();
    this.showScreen('screen-landing');
  },
};


// ============================================================
// EVENT BINDING (on DOM ready)
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  // --- Theme ---
  App.initTheme();
  document.getElementById('theme-toggle').addEventListener('click', () => App.toggleTheme());

  // --- Landing page buttons ---
  document.getElementById('btn-create-room').addEventListener('click', () => App.createRoom());

  document.getElementById('btn-join-room').addEventListener('click', () => {
    const code = document.getElementById('input-join-code').value;
    App.joinRoom(code);
  });

  // Allow enter key on room code input
  document.getElementById('input-join-code').addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      const code = document.getElementById('input-join-code').value;
      App.joinRoom(code);
    }
  });

  document.getElementById('btn-local-test').addEventListener('click', (e) => {
    e.preventDefault();
    App.startLocalTest();
  });

  // --- Lobby buttons ---
  document.getElementById('btn-copy-code').addEventListener('click', () => {
    QRHelper.copyRoomCode(App.roomCode);
  });

  document.getElementById('btn-copy-link').addEventListener('click', () => {
    QRHelper.copyJoinLink(App.roomCode);
  });

  document.getElementById('btn-share').addEventListener('click', () => {
    QRHelper.shareRoom(App.roomCode);
  });

  document.getElementById('btn-start-game').addEventListener('click', () => {
    App.startGame();
  });

  // --- Leave room ---
  document.getElementById('btn-leave-room').addEventListener('click', () => App.goHome());

  // --- Modal close buttons ---
  document.getElementById('modal-close').addEventListener('click', () => {
    document.getElementById('card-modal').close();
  });

  document.getElementById('results-modal-close').addEventListener('click', () => {
    document.getElementById('results-modal').close();
  });

  document.getElementById('btn-continue-round').addEventListener('click', () => {
    document.getElementById('results-modal').close();
  });

  // --- Tutorial modal ---
  document.getElementById('tutorial-modal-close').addEventListener('click', () => App.closeTutorial());

  document.getElementById('tutorial-next').addEventListener('click', () => {
    const totalSlides = document.querySelectorAll('#tutorial-slides .tutorial-slide').length;
    if (App.tutorialSlide >= totalSlides - 1) {
      App.closeTutorial();
    } else {
      App.tutorialSlide++;
      App.updateTutorialSlide();
    }
  });

  document.getElementById('tutorial-prev').addEventListener('click', () => {
    if (App.tutorialSlide > 0) {
      App.tutorialSlide--;
      App.updateTutorialSlide();
    }
  });

  // --- Help button ---
  document.getElementById('btn-help').addEventListener('click', () => App.showTutorial(true));

  // Close modals on backdrop click
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close();
    });
  });

  // --- Game over buttons ---
  document.getElementById('btn-rematch').addEventListener('click', () => App.rematch());
  document.getElementById('btn-home').addEventListener('click', () => App.goHome());

  // --- URL parameter handling (QR join) ---
  const params = new URLSearchParams(window.location.search);
  const joinCode = params.get('join');
  if (joinCode) {
    document.getElementById('input-join-code').value = joinCode.toUpperCase();
    // Clean URL
    window.history.replaceState({}, '', window.location.pathname);
    // Auto-focus join
    setTimeout(() => {
      document.getElementById('btn-join-room').focus();
      Toast.show(`Room code ${joinCode.toUpperCase()} detected!`, 'info');
    }, 300);
  }

  // --- Attempt reconnect ---
  App.attemptReconnect().then(reconnected => {
    if (reconnected) {
      Toast.show('Reconnected to your game!', 'success');
    }
  });
});
