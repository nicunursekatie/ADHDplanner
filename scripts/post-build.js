import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the ADHDplanner directory exists in dist
const adhpDir = path.join(__dirname, '../dist/ADHDplanner');
if (!fs.existsSync(adhpDir)) {
  fs.mkdirSync(adhpDir, { recursive: true });
}

// Copy manifest.json to the root of dist to make it accessible at /manifest.json
console.log('Copying manifest.json to root...');
fs.copyFileSync(
  path.join(__dirname, '../public/manifest.json'),
  path.join(__dirname, '../dist/manifest.json')
);

// Copy assets to the ADHDplanner directory
const assetsToCopy = [
  'manifest.json',
  'favicon.ico',
  'apple-touch-icon.png',
  'masked-icon.svg',
  'pwa-192x192.png',
  'pwa-512x512.png'
];

console.log('Copying assets to /ADHDplanner directory...');
assetsToCopy.forEach(asset => {
  const src = path.join(__dirname, '../public', asset);
  const dest = path.join(adhpDir, asset);
  
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${asset} to ${dest}`);
  } else {
    console.log(`Warning: Could not find ${src}`);
  }
});

console.log('Post-build processing complete!');