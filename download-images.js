const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Load your JSON
const politicians = require('./public/politicians.json');

const downloadDir = path.join(__dirname, 'public', 'images', 'politicians');

// Ensure directory exists
if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir, { recursive: true });
}

async function downloadImages() {
  console.log(`Starting download of ${politicians.length} images...`);

  for (const p of politicians) {
    const url = p.img || p.image_url;
    if (!url) continue;

    // Create a filename: "john-doe.jpg"
    const fileName = p.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '.jpg';
    const filePath = path.join(downloadDir, fileName);

    if (fs.existsSync(filePath)) {
      console.log(`⏩ Skipping ${p.name}, already exists.`);
      continue;
    }

    try {
      const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
        timeout: 10000, // 10s timeout
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      console.log(`✅ Downloaded: ${p.name}`);
    } catch (error) {
      console.error(`❌ Failed to download ${p.name}: ${error.message}`);
    }
  }
  console.log('Done!');
}

downloadImages();