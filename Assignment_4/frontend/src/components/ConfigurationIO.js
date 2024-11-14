import React from 'react';
import '../styles/ConfigurationIO.css';

const ConfigurationIO = ({ modelNum, currentConfig, onConfigImport }) => {
  const handleExport = () => {
    const configData = JSON.stringify(currentConfig, null, 2);
    const blob = new Blob([configData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `model${modelNum}_config.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target.result);
          onConfigImport(config);
        } catch (error) {
          alert('Invalid configuration file');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="config-io-container">
      <button 
        className="config-io-button export"
        onClick={handleExport}
        disabled={!currentConfig}
      >
        Export Configuration
      </button>
      <div className="import-wrapper">
        <input
          type="file"
          id={`import-config-${modelNum}`}
          accept=".json"
          onChange={handleImport}
          className="import-input"
        />
        <label 
          htmlFor={`import-config-${modelNum}`}
          className="config-io-button import"
        >
          Import Configuration
        </label>
      </div>
    </div>
  );
};

export default ConfigurationIO; 