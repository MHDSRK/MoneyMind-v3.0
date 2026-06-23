#!/usr/bin/env node
/**
 * Generate PNG icons from logo.svg for PWA and web app manifests
 * Generates: icon-192.png, icon-512.png, apple-touch-icon.png, favicon.ico
 */

const fs = require("fs");
const path = require("path");

// Check if sharp is available
let sharp;
try {
  sharp = require("sharp");
} catch (err) {
  console.error("❌ sharp not found. Install with: npm install -D sharp");
  console.error("   sharp is needed to convert SVG to PNG");
  process.exit(1);
}

const publicDir = path.join(__dirname, "public");
const logoSvgPath = path.join(publicDir, "logo.svg");

// Icon configurations: { filename, size }
const iconConfigs = [
  { filename: "icon-192.png", size: 192, description: "Android install banner" },
  { filename: "icon-512.png", size: 512, description: "PWA home screen" },
  { filename: "apple-touch-icon.png", size: 180, description: "iPhone home screen" },
];

async function generateIcons() {
  console.log("🎨 Generating PNG icons from logo.svg...\n");

  try {
    // Verify logo.svg exists
    if (!fs.existsSync(logoSvgPath)) {
      throw new Error(`logo.svg not found at ${logoSvgPath}`);
    }

    // Generate PNG icons
    for (const config of iconConfigs) {
      const outputPath = path.join(publicDir, config.filename);
      console.log(`  📦 ${config.filename} (${config.size}x${config.size}) - ${config.description}`);

      await sharp(logoSvgPath, { density: 300 })
        .resize(config.size, config.size, { fit: "contain", background: "#000814" })
        .png({ quality: 95 })
        .toFile(outputPath);

      console.log(`     ✓ Created ${outputPath}`);
    }

    // Generate favicon.ico (using 64x64 PNG converted to ICO)
    const faviconPngPath = path.join(publicDir, "favicon.png");
    
    // Try to convert PNG to ICO if available
    try {
      const pngToIco = require("png-to-ico");
      const faviconBuffer = await sharp(logoSvgPath, { density: 300 })
        .resize(64, 64, { fit: "contain", background: "#000814" })
        .png({ quality: 95 })
        .toBuffer();
      
      const favicon = pngToIco(faviconBuffer);
      fs.writeFileSync(path.join(publicDir, "favicon.ico"), favicon);
      console.log(`  📦 favicon.ico (64x64) - Browser favicon`);
      console.log(`     ✓ Created ${path.join(publicDir, "favicon.ico")}`);
    } catch (err) {
      console.log(`  ⚠️  favicon.ico generation skipped: ${err.message}`);
      // Fallback: just create favicon.png if ICO fails
      await sharp(logoSvgPath, { density: 300 })
        .resize(64, 64, { fit: "contain", background: "#000814" })
        .png({ quality: 95 })
        .toFile(faviconPngPath);
      console.log(`  📦 favicon.png (64x64) - Browser favicon fallback`);
      console.log(`     ✓ Created ${faviconPngPath}`);
    }

    console.log("\n✅ All icons generated successfully!");
    console.log("\n📋 Add to index.html:");
    console.log('  <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png">');
    console.log('  <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png">');
    console.log('  <link rel="apple-touch-icon" href="/apple-touch-icon.png">');
    console.log('  <link rel="icon" href="/favicon.ico">');
    console.log("\n📋 Add to public/manifest.json:");
    console.log('  "icons": [');
    console.log('    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },');
    console.log('    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" }');
    console.log("  ]");
  } catch (error) {
    console.error("❌ Error generating icons:", error.message);
    process.exit(1);
  }
}

generateIcons();
