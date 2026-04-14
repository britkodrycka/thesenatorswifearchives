/**
 * main.js
 * App entry point.
 * Wires up the modal overlay click-outside handler and boots the app.
 *
 * Script load order (enforced in index.html):
 *   supabase CDN → config.js → api.js → admin.js → render.js → main.js
 */

// Close modal when clicking the backdrop
document.getElementById('modalOverlay').addEventListener('click', function (e) {
  if (e.target === this) closeModal();
});

// Boot — load all data from Supabase then render
loadAll();
