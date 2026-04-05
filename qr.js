// ============================================================
// QR Code Generation & Share Helpers
// ============================================================

const QRHelper = {
  /** Build the full join URL for a room */
  getJoinUrl(roomCode) {
    const base = window.location.origin + window.location.pathname;
    return `${base}?join=${roomCode}`;
  },

  /** Generate a QR code in the #qr-container element */
  generateRoomQR(roomCode) {
    const container = document.getElementById('qr-container');
    if (!container) return;
    container.innerHTML = '';

    const joinUrl = this.getJoinUrl(roomCode);

    new QRCode(container, {
      text: joinUrl,
      width: 180,
      height: 180,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
  },

  /** Copy the room code to clipboard */
  async copyRoomCode(roomCode) {
    try {
      await navigator.clipboard.writeText(roomCode);
      Toast.show('Room code copied!', 'success');
    } catch {
      this.fallbackCopy(roomCode);
    }
  },

  /** Copy the join link to clipboard */
  async copyJoinLink(roomCode) {
    const url = this.getJoinUrl(roomCode);
    try {
      await navigator.clipboard.writeText(url);
      Toast.show('Join link copied!', 'success');
    } catch {
      this.fallbackCopy(url);
    }
  },

  /** Use Web Share API if available */
  async shareRoom(roomCode) {
    const url = this.getJoinUrl(roomCode);
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Queue Number: The Great Allocation',
          text: `Join my game! Room code: ${roomCode}`,
          url: url
        });
      } catch (e) {
        // User cancelled share, that's fine
      }
    } else {
      this.copyJoinLink(roomCode);
    }
  },

  /** Fallback copy for older browsers */
  fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      Toast.show('Copied!', 'success');
    } catch {
      Toast.show('Could not copy', 'error');
    }
    document.body.removeChild(textarea);
  }
};

// ============================================================
// Toast Notification System
// ============================================================

const Toast = {
  show(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3000);
  }
};
