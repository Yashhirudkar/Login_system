const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '../../logs/audit.log');

// Ensure logs directory exists
const logDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

class AuditLogger {
    log(event, data) {
        const entry = {
            timestamp: new Date().toISOString(),
            event,
            ...data
        };

        const logString = JSON.stringify(entry) + '\n';

        // Log to console for dev
        console.log(`[AUDIT] ${event}:`, data);

        // Append to file
        fs.appendFile(LOG_FILE, logString, (err) => {
            if (err) console.error('Failed to write to audit log:', err);
        });
    }
}

module.exports = new AuditLogger();
