const TONES = new Set(['success', 'info', 'error']);

export function createNotification(tone, message, id = Date.now()) {
  if (!TONES.has(tone)) throw new Error('Tono notifica non valido');
  return { id, tone, message: String(message) };
}

export function renderNotification(notification, escapeHtml) {
  if (!notification) return '';
  const role = notification.tone === 'error' ? 'alert' : 'status';
  return `<aside class="notification" data-tone="${notification.tone}" role="${role}" aria-atomic="true"><span>${escapeHtml(notification.message)}</span><button type="button" class="notification-dismiss" data-action="dismiss-notification" aria-label="Chiudi notifica">×</button></aside>`;
}
