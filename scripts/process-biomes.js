
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SOURCE_DIR = path.join(__dirname, '../biomes');
const TARGET_DIR = path.join(__dirname, '../public/textures/biomes');

const TARGET_SIZE = 1024; // Power of 2 for GPU optimization

async function processBiomes() {
    if (!fs.existsSync(SOURCE_DIR)) {
        console.error(`Source directory not found: ${SOURCE_DIR}`);
        return;
    }

    if (!fs.existsSync(TARGET_DIR)) {
        fs.mkdirSync(TARGET_DIR, { recursive: true });
    }

    const files = fs.readdirSync(SOURCE_DIR).filter(f => f.match(/\.(png|jpg|jpeg)$/i));

    console.log(`Found ${files.length} biome assets. Processing...`);

    for (const file of files) {
        const inputPath = path.join(SOURCE_DIR, file);
        // Normalize filename: "desert 1.png" -> "desert_1.webp"
        const outputName = file.toLowerCase().replace(/\s+/g, '_').replace(/\.[^/.]+$/, "") + ".webp";
        const outputPath = path.join(TARGET_DIR, outputName);

        try {
            await sharp(inputPath)
                .resize(TARGET_SIZE, TARGET_SIZE, {
                    fit: 'cover',
                    position: 'center'
                })
                .webp({ quality: 80, effort: 6 }) // High compression effort
                .toFile(outputPath);

            console.log(`✓ Processed: ${file} -> ${outputName}`);
        } catch (err) {
            console.error(`✗ Failed: ${file}`, err);
        }
    }

    console.log("Biome processing complete.");
}

processBiomes();
