import assert from 'node:assert/strict';
import test from 'node:test';
import { createNotification, renderNotification } from '../src/notifications.js';

const escapeHtml = (value) => String(value).replaceAll('<', '&lt;').replaceAll('>', '&gt;');

test('renders success as a polite status and error as an alert', () => {
  const success = renderNotification(createNotification('success', 'Configurazione salvata', 1), escapeHtml);
  const error = renderNotification(createNotification('error', 'Backup <non valido>', 2), escapeHtml);

  assert.match(success, /role="status"/);
  assert.match(success, /data-tone="success"/);
  assert.match(error, /role="alert"/);
  assert.match(error, /Backup &lt;non valido&gt;/);
  assert.match(error, /aria-label="Chiudi notifica"/);
});

test('rejects unsupported tones', () => {
  assert.throws(() => createNotification('warning', 'No'), /Tono notifica non valido/);
});
