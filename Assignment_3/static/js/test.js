(function() {
    try {
        console.log('test.js loaded and executing');
        // Test DOM access
        document.addEventListener('DOMContentLoaded', function() {
            console.log('test.js: DOM Content Loaded');
        });
    } catch (error) {
        console.error('Error in test.js:', error);
    }
})(); 