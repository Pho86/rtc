const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function convertLogo() {
  const logoPath = path.join(__dirname, 'public', 'logo.png');
  const publicDir = path.join(__dirname, 'public');
  
  try {
    // Check if logo exists
    if (!fs.existsSync(logoPath)) {
      console.error('logo.png not found in public directory');
      return;
    }

    console.log('Converting logo.png to various icon formats...');

    // Convert to favicon.ico (16x16 and 32x32)
    await sharp(logoPath)
      .resize(32, 32)
      .png()
      .toFile(path.join(publicDir, 'favicon.png'));

    // Convert to 192x192 PNG
    await sharp(logoPath)
      .resize(192, 192)
      .png()
      .toFile(path.join(publicDir, 'icon-192x192.png'));

    // Convert to 512x512 PNG
    await sharp(logoPath)
      .resize(512, 512)
      .png()
      .toFile(path.join(publicDir, 'icon-512x512.png'));

    // Create a simple SVG version (you may want to replace this with a proper SVG)
    const svgContent = `<svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
  <image href="logo.png" width="192" height="192"/>
</svg>`;

    fs.writeFileSync(path.join(publicDir, 'icon-192x192.svg'), svgContent);

    const svgContent512 = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <image href="logo.png" width="512" height="512"/>
</svg>`;

    fs.writeFileSync(path.join(publicDir, 'icon-512x512.svg'), svgContent512);

    // Create favicon.svg
    const faviconSvg = `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <image href="logo.png" width="32" height="32"/>
</svg>`;

    fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg);

    console.log('✅ Successfully converted logo.png to all icon formats:');
    console.log('  - favicon.png (32x32)');
    console.log('  - favicon.svg');
    console.log('  - icon-192x192.png');
    console.log('  - icon-192x192.svg');
    console.log('  - icon-512x512.png');
    console.log('  - icon-512x512.svg');

  } catch (error) {
    console.error('Error converting logo:', error);
  }
}

convertLogo();
