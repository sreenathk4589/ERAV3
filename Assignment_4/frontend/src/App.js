import React, { useState } from 'react';
import ModelConfig from './components/ModelConfig';
import TrainingControls from './components/TrainingControls';
import TrainingVisuals from './components/TrainingVisuals';
import './styles/App.css';
import './styles/ModelConfig.css';
import { logger } from './services/logger';

function App() {
  const [sessionId, setSessionId] = useState(null);
  const [trainingStatus, setTrainingStatus] = useState({
    model1: false,
    model2: false
  });
  const [modelConfigs, setModelConfigs] = useState({
    model1: null,
    model2: null
  });

  const handleConfigChange = (modelNum, newConfig) => {
    logger.debug(`Model ${modelNum} Configuration Change`, newConfig);
    setModelConfigs(prev => ({
      ...prev,
      [`model${modelNum}`]: newConfig
    }));
  };

  return (
    <div className="App">
      <h1>Neural Network Architecture Comparison</h1>
      
      <div className="models-container">
        <div className="model-section">
          <h2>Model 1</h2>
          <ModelConfig 
            modelNum={1} 
            onConfigChange={(config) => handleConfigChange(1, config)}
          />
          <TrainingControls 
            modelNum={1}
            sessionId={sessionId}
            isTraining={trainingStatus.model1}
            onStatusChange={(status) => setTrainingStatus(prev => ({...prev, model1: status}))}
            modelConfig={modelConfigs.model1}
          />
        </div>
        
        <div className="model-section">
          <h2>Model 2</h2>
          <ModelConfig 
            modelNum={2}
            onConfigChange={(config) => handleConfigChange(2, config)}
          />
          <TrainingControls 
            modelNum={2}
            sessionId={sessionId}
            isTraining={trainingStatus.model2}
            onStatusChange={(status) => setTrainingStatus(prev => ({...prev, model2: status}))}
            modelConfig={modelConfigs.model2}
          />
        </div>
      </div>
      
      <TrainingVisuals sessionId={sessionId} />
    </div>
  );
}

export default App; 