class Logger {
    constructor() {
        this.logs = [];
        this.logFile = null;
        this.maxLogSize = 100 * 1024; // 100KB
        this.maxEntries = 100;  // Maximum number of log entries to keep
        this.batchSize = 10;    // Number of logs before writing to file
        this.initializeLogFile();
    }

    initializeLogFile() {
        this.logFile = new Blob([], { type: 'text/plain' });
    }

    async saveLogsToFile() {
        if (this.logs.length === 0) return;

        try {
            // Keep only the last maxEntries logs
            if (this.logs.length > this.maxEntries) {
                this.logs = this.logs.slice(-this.maxEntries);
            }

            const content = this.logs.join('\n');
            this.logFile = new Blob([content], { type: 'text/plain' });

            // Only save if file size is significant
            if (this.logFile.size > 1024) {  // More than 1KB
                const url = window.URL.createObjectURL(this.logFile);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = 'frontend_debug.log';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Failed to save log file:', error);
        }
    }

    appendToFile(message) {
        const timestamp = new Date().toISOString();
        const logEntry = `${timestamp} - ${message}`;
        
        this.logs.push(logEntry);
        
        // Save logs when batch size is reached
        if (this.logs.length % this.batchSize === 0) {
            this.saveLogsToFile();
        }
    }

    info(message, data = null) {
        // Only log significant events
        if (message.includes('Training') || message.includes('Error')) {
            const logMessage = data ? 
                `INFO: ${message} - ${JSON.stringify(data, null, 2)}` : 
                `INFO: ${message}`;
            this.appendToFile(logMessage);
            console.log(logMessage);
        }
    }

    error(message, error = null) {
        const logMessage = error ? 
            `ERROR: ${message} - ${error.toString()}` : 
            `ERROR: ${message}`;
        this.appendToFile(logMessage);
        console.error(logMessage);
    }

    debug(message, data = null) {
        // Only log critical debug information
        if (message.includes('Training') || message.includes('Error')) {
            const logMessage = data ? 
                `DEBUG: ${message} - ${JSON.stringify(data, null, 2)}` : 
                `DEBUG: ${message}`;
            this.appendToFile(logMessage);
            console.debug(logMessage);
        }
    }

    saveLogs() {
        this.saveLogsToFile();
    }
}

export const logger = new Logger();

// Save logs before window closes
window.addEventListener('beforeunload', () => {
    logger.saveLogs();
});