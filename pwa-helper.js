// This script helps fix PWA issues with GitHub Pages by copying the manifest
document.addEventListener('DOMContentLoaded', function() {
  // Handle manifest fallback
  if (navigator.serviceWorker && !navigator.serviceWorker.controller) {
    const manifestLink = document.querySelector('link[rel="manifest"]');
    
    // Try to fetch from multiple locations to help with GitHub Pages
    if (manifestLink) {
      // First try the standard path
      fetch(manifestLink.href)
        .catch(() => {
          console.log('Trying alternate manifest location...');
          // If that fails, try from root
          const rootManifest = '/manifest.json';
          fetch(rootManifest)
            .then(response => {
              if (response.ok) {
                console.log('Using root manifest instead');
                manifestLink.href = rootManifest;
              }
            })
            .catch(err => {
              console.warn('Could not load manifest from alternate location', err);
            });
        });
    }
  }
});