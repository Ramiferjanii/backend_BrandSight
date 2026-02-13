const { spawn } = require('child_process');
const path = require('path');
const Website = require('../models/Website');

/**
 * Scrapes a website using the Python scraper script.
 * @param {string} websiteId - The ID of the website in the database
 * @param {string} mode - 'static' or 'selenium'
 * @returns {Promise<Object>} - The updated website object
 */
async function scrapeWebsiteTask(websiteId, mode = 'static') {
    console.log(`Starting scrapeWebsiteTask for ID: ${websiteId}, Mode: ${mode}`);
    return new Promise((resolve, reject) => {
        // Use a more portable way to find Python
        const fs = require('fs');
        let pythonPath = 'python'; // Default system fallback

        // Potential paths for virtual environment python
        const venvPath = path.join(__dirname, '../../.venv/Scripts/python.exe');
        const venvPathUnix = path.join(__dirname, '../../.venv/bin/python');

        if (fs.existsSync(venvPath)) {
            pythonPath = venvPath;
        } else if (fs.existsSync(venvPathUnix)) {
            pythonPath = venvPathUnix;
        }

        const scriptPath = path.join(__dirname, '../python_scraper/scraper.py');

        console.log(`Executing Python scraper using: ${pythonPath} for ID: ${websiteId}`);

        const pythonProcess = spawn(pythonPath, [scriptPath, websiteId, mode]);

        pythonProcess.on('error', (err) => {
            console.error('Failed to start Python process:', err);
            reject(new Error(`Failed to start Python process: ${err.message}`));
        });

        let output = '';
        let errorOutput = '';

        pythonProcess.stdout.on('data', (data) => {
            const str = data.toString();
            output += str;
            console.log(`Python stdout: ${str}`);
        });

        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        pythonProcess.on('close', async (code) => {
            if (code !== 0) {
                console.error(`Python stderr: ${errorOutput}`);
                return reject(new Error(`Python process exited with code ${code}. Error: ${errorOutput}`));
            }

            try {
                // Find the JSON line in the output (in case there are other print statements)
                const lines = output.trim().split('\n');
                let result = null;

                for (let i = lines.length - 1; i >= 0; i--) {
                    try {
                        result = JSON.parse(lines[i]);
                        break;
                    } catch (e) {
                        continue;
                    }
                }

                if (!result) {
                    throw new Error('No valid JSON output found from Python script');
                }

                if (result.error) {
                    return reject(new Error(result.error));
                }

                // Fetch updated website from DB
                const updatedWebsite = await Website.findById(websiteId);
                resolve(updatedWebsite);
            } catch (err) {
                console.error('Failed to parse Python output:', output);
                reject(new Error(`Failed to parse scraper results: ${err.message}`));
            }
        });
    });
}

module.exports = {
    scrapeWebsiteTask
};
