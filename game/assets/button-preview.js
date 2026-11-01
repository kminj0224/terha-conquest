/* Comparison is deliberately URL-only: never stored in settings or saves. */
(() => {
  const theme = new URLSearchParams(location.search).get('button-preview');
  if (theme === 'silver' || theme === 'dark') {
    document.body.dataset.buttonPreview = theme;
  }
})();
