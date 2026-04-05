// ============================================================
// Firebase Configuration
// ============================================================
// These placeholder tokens are replaced at deploy time by GitHub Actions
// using repository secrets. See .github/workflows/deploy-pages.yml
//
// For local development, create a firebase-config.local.js or
// replace the __FIREBASE_*__ tokens with your actual values.
// ============================================================

const firebaseConfig = {
  apiKey:            "__FIREBASE_API_KEY__",
  authDomain:        "__FIREBASE_AUTH_DOMAIN__",
  databaseURL:       "__FIREBASE_DATABASE_URL__",
  projectId:         "__FIREBASE_PROJECT_ID__",
  storageBucket:     "__FIREBASE_STORAGE_BUCKET__",
  messagingSenderId: "__FIREBASE_MESSAGING_SENDER_ID__",
  appId:             "__FIREBASE_APP_ID__"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ============================================================
// Database Helper Functions
// ============================================================

const FirebaseHelper = {
  /** Get a database reference for a path */
  getRef(path) {
    return db.ref(path);
  },

  /** Set data at a path (overwrites) */
  async setData(path, data) {
    return db.ref(path).set(data);
  },

  /** Update data at a path (merges) */
  async updateData(path, data) {
    return db.ref(path).update(data);
  },

  /** Push a new child with auto-generated key */
  async pushData(path, data) {
    return db.ref(path).push(data);
  },

  /** Read data once */
  async getData(path) {
    const snapshot = await db.ref(path).once('value');
    return snapshot.val();
  },

  /** Listen for value changes */
  onValue(path, callback) {
    const ref = db.ref(path);
    ref.on('value', (snapshot) => callback(snapshot.val()));
    return ref; // return ref so caller can .off() later
  },

  /** Listen for child added */
  onChildAdded(path, callback) {
    const ref = db.ref(path);
    ref.on('child_added', (snapshot) => callback(snapshot.key, snapshot.val()));
    return ref;
  },

  /** Listen for child changed */
  onChildChanged(path, callback) {
    const ref = db.ref(path);
    ref.on('child_changed', (snapshot) => callback(snapshot.key, snapshot.val()));
    return ref;
  },

  /** Listen for child removed */
  onChildRemoved(path, callback) {
    const ref = db.ref(path);
    ref.on('child_removed', (snapshot) => callback(snapshot.key, snapshot.val()));
    return ref;
  },

  /** Remove data at path */
  async removeData(path) {
    return db.ref(path).remove();
  },

  /** Run a transaction */
  async transaction(path, updateFn) {
    return db.ref(path).transaction(updateFn);
  },

  /** Generate a unique room code (4 uppercase letters) */
  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 to avoid confusion
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },

  /** Generate a unique player ID */
  generatePlayerId() {
    return 'p_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  },

  /** Setup presence tracking for a player */
  setupPresence(roomCode, playerId) {
    const connectedRef = db.ref('.info/connected');
    const playerRef = db.ref(`rooms/${roomCode}/players/${playerId}/connected`);

    connectedRef.on('value', (snap) => {
      if (snap.val() === true) {
        playerRef.set(true);
        playerRef.onDisconnect().set(false);
      }
    });
  }
};
