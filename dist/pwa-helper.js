// This script helps fix PWA issues with GitHub Pages by handling various edge cases
document.addEventListener('DOMContentLoaded', function() {
  // Detect base path - handle GitHub Pages and other deployments
  let basePath = '';
  const baseElement = document.querySelector('base');
  if (baseElement && baseElement.href) {
    basePath = new URL(baseElement.href).pathname;
  } else if (window.location.pathname.includes('/ADHDplanner/')) {
    basePath = '/ADHDplanner/';
  }
  
  // Handle manifest fallback
  if (navigator.serviceWorker) {
    const manifestLink = document.querySelector('link[rel="manifest"]');
    
    // Try to fetch from multiple locations to help with GitHub Pages
    if (manifestLink) {
      // First try the standard path
      fetch(manifestLink.href)
        .catch(() => {
          console.log('Manifest fetch failed, trying alternatives...');
          
          // Try different paths
          const alternativePaths = [
            'manifest.json',
            `${basePath}manifest.json`,
            '/manifest.json',
            '/ADHDplanner/manifest.json',
            './manifest.json'
          ];
          
          // Try each alternative path
          const tryNextPath = (index) => {
            if (index >= alternativePaths.length) {
              console.warn('All manifest locations failed');
              return;
            }
            
            fetch(alternativePaths[index])
              .then(response => {
                if (response.ok) {
                  console.log(`Found manifest at ${alternativePaths[index]}`);
                  manifestLink.href = alternativePaths[index];
                }
              })
              .catch(() => {
                tryNextPath(index + 1);
              });
          };
          
          tryNextPath(0);
        });
    }
  }
  
  // Fix module script loading issues by handling type="module" scripts with workaround
  // for MIME type issues
  document.querySelectorAll('script[type="module"]').forEach(script => {
    // Skip scripts that have already been processed
    if (script.getAttribute('data-processed')) return;
    
    const originalSrc = script.src;
    
    // Only process scripts using relative URLs or URLs with our base path
    if (originalSrc) {
      // First mark as processed to avoid infinite recursion
      script.setAttribute('data-processed', 'true');

      // Add error handler for the original script
      script.onerror = function(error) {
        console.warn('Module script failed to load, trying fallback', error);
        
        // Create a regular script element as fallback
        const fallbackScript = document.createElement('script');
        
        // Try to fix path duplication issues
        let fixedPath = originalSrc;
        if (originalSrc.includes('/ADHDplanner/ADHDplanner/')) {
          fixedPath = originalSrc.replace('/ADHDplanner/ADHDplanner/', '/ADHDplanner/');
        }
        
        fallbackScript.src = fixedPath;
        fallbackScript.type = 'text/javascript'; // Use regular script type for compatibility
        
        // Replace the original script with the fallback
        script.parentNode.replaceChild(fallbackScript, script);
      };
    }
  });
  
  // Fix any duplicate paths in all links and scripts
  const fixDuplicatePathsInElements = (selector, attribute) => {
    document.querySelectorAll(selector).forEach(element => {
      const path = element.getAttribute(attribute);
      if (path && path.includes('/ADHDplanner/ADHDplanner/')) {
        element.setAttribute(
          attribute,
          path.replace('/ADHDplanner/ADHDplanner/', '/ADHDplanner/')
        );
      }
    });
  };
  
  // Fix paths in various elements
  fixDuplicatePathsInElements('link[rel="icon"]', 'href');
  fixDuplicatePathsInElements('link[rel="shortcut icon"]', 'href');
  fixDuplicatePathsInElements('link[rel="apple-touch-icon"]', 'href');
  fixDuplicatePathsInElements('link[rel="manifest"]', 'href');
  fixDuplicatePathsInElements('script', 'src');
  fixDuplicatePathsInElements('img', 'src');
});