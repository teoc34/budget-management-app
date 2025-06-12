const { spawn } = require('child_process');
const path = require('path');

exports.runPatternAnalysis = (userId) => {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, 'ml-patterns.py');
        const process = spawn('python', [scriptPath, userId]);

        let result = '';
        process.stdout.on('data', (data) => {
            result += data.toString();
        });

        process.stderr.on('data', (data) => {
            console.error('Python error:', data.toString());
        });

        process.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Process exited with code ${code}`));
            } else {
                try {
                    const parsed = JSON.parse(result);
                    resolve(parsed);
                } catch (err) {
                    reject(new Error('Invalid JSON from Python script'));
                }
            }
        });
    });
};
