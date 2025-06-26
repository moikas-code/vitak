const fs = require('fs');
const path = require('path');

// Simple SVG icon
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="64" fill="#10b981"/>
  <text x="256" y="300" font-family="Arial, sans-serif" font-size="200" font-weight="bold" text-anchor="middle" fill="white">VK</text>
  <text x="256" y="380" font-family="Arial, sans-serif" font-size="60" text-anchor="middle" fill="white">Tracker</text>
</svg>`;

// Save SVG
fs.writeFileSync(path.join(__dirname, '../public/icon.svg'), svgIcon);

console.log('Icon generated successfully!');
console.log('Note: For production, you should generate proper PNG icons using a tool like:');
console.log('- https://realfavicongenerator.net/');
console.log('- https://favicon.io/');
console.log('- Or use a design tool to create custom icons');

// Create placeholder files for PWA
const sizes = [192, 256, 384, 512];
sizes.forEach(size => {
  const placeholderSvg = svgIcon.replace('width="512" height="512"', `width="${size}" height="${size}"`);
  fs.writeFileSync(path.join(__dirname, `../public/icon-${size}x${size}.svg`), placeholderSvg);
});