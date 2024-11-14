import React from 'react';
import axios from 'axios';
import { logger } from '../services/logger';
import '../styles/TrainingControls.css';

function TrainingControls({ modelNum, sessionId, isTraining, onStatusChange, modelConfig }) {
  const startTraining = async () => {
    try {
      console.log('Sending training request:', {
        model_num: modelNum,
        session_id: sessionId,
        config: modelConfig
      });
      
      const response = await axios.post('/api/train', {
        model_num: modelNum,
        session_id: sessionId,
        config: modelConfig
      });
      
      if (response.data.success) {
        onStatusChange(true);
        logger.info(`Started training Model ${modelNum}`);
      }
    } catch (error) {
      logger.error(`Failed to start training Model ${modelNum}:`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });
      alert('Failed to start training. Please check the console for details.');
    }
  };

  const stopTraining = async () => {
    try {
      const response = await axios.post('/api/stop', {
        model_num: modelNum,
        session_id: sessionId
      });
      
      if (response.data.success) {
        onStatusChange(false);
        logger.info(`Stopped training Model ${modelNum}`);
      }
    } catch (error) {
      logger.error(`Failed to stop training Model ${modelNum}:`, error);
      alert('Failed to stop training. Please check the console for details.');
    }
  };

  const downloadWeights = async () => {
    try {
      const response = await axios.get(`/api/weights/${sessionId}/model${modelNum}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `model${modelNum}_weights.pth`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      logger.info(`Downloaded weights for Model ${modelNum}`);
    } catch (error) {
      logger.error(`Failed to download weights for Model ${modelNum}:`, error);
      alert('Failed to download weights. Please check the console for details.');
    }
  };

  return (
    <div className="training-controls">
      <div className="control-buttons">
        {!isTraining ? (
          <button 
            className="control-button start"
            onClick={startTraining}
            disabled={!modelConfig || modelConfig.layers.length === 0}
          >
            Start Training
          </button>
        ) : (
          <button 
            className="control-button stop"
            onClick={stopTraining}
          >
            Stop Training
          </button>
        )}
        <button
          className="control-button download"
          onClick={downloadWeights}
          disabled={!sessionId}
        >
          Download Weights
        </button>
      </div>
    </div>
  );
}

export default TrainingControls; 