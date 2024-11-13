import React, { useState } from 'react';
import axios from 'axios';
import { logger } from '../services/logger';

function TrainingControls({ modelNum, sessionId, isTraining, onStatusChange, modelConfig }) {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleStartTraining = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!modelConfig) {
        throw new Error('Model configuration is not set');
      }

      logger.info(`Starting Training for Model ${modelNum}`, modelConfig);

      const requestData = {
        config1: modelConfig,
        config2: modelConfig
      };

      const response = await axios.post('/api/start-training', requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.data.session_id) {
        const sessionId = response.data.session_id;
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds timeout

        const checkStatus = async () => {
          const statusResponse = await axios.get(`/api/training-status/${sessionId}`);
          if (statusResponse.data.status === 'ready') {
            logger.info(`Training initialized for Model ${modelNum}`);
            onStatusChange(true);
          } else if (statusResponse.data.status === 'error') {
            throw new Error(statusResponse.data.error || 'Initialization failed');
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(checkStatus, 1000); // Check every second
          } else {
            throw new Error('Initialization timed out');
          }
        };

        await checkStatus();
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message;
      logger.error(`Training Error for Model ${modelNum}`, errorMessage);
      setError(`Failed to start training: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopTraining = async () => {
    try {
      setError(null);
      await axios.post(`/api/stop-training/${sessionId}/${modelNum}`);
      onStatusChange(false);
    } catch (err) {
      setError('Failed to stop training: ' + err.message);
    }
  };

  const handleDownloadWeights = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      const response = await axios.get(
        `/api/download-weights/${sessionId}/${modelNum}`,
        { responseType: 'blob' }
      );
      
      const blob = new Blob([response.data], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `model${modelNum}_weights.pth`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download weights: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="training-controls">
      {error && <div className="error-message">{error}</div>}
      
      <div className="button-group">
        {!isTraining ? (
          <button
            className="button button-primary"
            onClick={handleStartTraining}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading-spinner" />
            ) : (
              'Start Training'
            )}
          </button>
        ) : (
          <button
            className="button button-danger"
            onClick={handleStopTraining}
          >
            Stop Training
          </button>
        )}
        
        <button
          className="button button-success"
          onClick={handleDownloadWeights}
          disabled={isLoading || !sessionId}
        >
          {isLoading ? (
            <span className="loading-spinner" />
          ) : (
            'Download Weights'
          )}
        </button>
      </div>
    </div>
  );
}

export default TrainingControls; 