import React, { useState, useEffect, useCallback } from 'react';
import ModelConfig from './components/ModelConfig';
import TrainingControls from './components/TrainingControls';
import TrainingVisuals from './components/TrainingVisuals';
import './styles/App.css';
import './styles/ModelConfig.css';
import { logger } from './services/logger';
import ProgressBar from './components/ProgressBar';
import axios from 'axios';

function App() {
  const [sessionId, setSessionId] = useState(null);
  const [trainingStatus, setTrainingStatus] = useState({
    model1: false,
    model2: false
  });
  const [modelConfigs, setModelConfigs] = useState({
    model1: {
      layers: [],
      optimizer_type: 'adam',
      loss_function: 'cross_entropy',
      learning_rate: 0.001,
      batch_size: 32,
      num_epochs: 10,
      device: 'cuda',
      augmentations: []
    },
    model2: {
      layers: [],
      optimizer_type: 'adam',
      loss_function: 'cross_entropy',
      learning_rate: 0.001,
      batch_size: 32,
      num_epochs: 10,
      device: 'cuda',
      augmentations: []
    }
  });
  const [currentEpoch1, setCurrentEpoch1] = useState(0);
  const [currentEpoch2, setCurrentEpoch2] = useState(0);

  useEffect(() => {
    const testAPI = async () => {
      try {
        const response = await axios.get('/api/test');
        console.log('API Test Response:', response.data);
      } catch (error) {
        console.error('API Test Error:', error);
      }
    };
    testAPI();
  }, []);

  const handleConfigChange = useCallback((modelNum, newConfig) => {
    if (validateConfig(newConfig)) {
      logger.debug(`Model ${modelNum} Configuration Change`, newConfig);
      setModelConfigs(prev => ({
        ...prev,
        [`model${modelNum}`]: newConfig
      }));
    } else {
      logger.error(`Invalid configuration for Model ${modelNum}`);
      alert('Invalid configuration format');
    }
  }, []);

  const validateConfig = (config) => {
    const requiredFields = [
      'layers',
      'optimizer_type',
      'learning_rate',
      'batch_size',
      'num_epochs'
    ];
    
    return requiredFields.every(field => field in config) &&
           Array.isArray(config.layers);
  };

  const handleTrainingUpdate = (data) => {
    if (data.model === 'model1') {
      setCurrentEpoch1(data.epoch);
    } else {
      setCurrentEpoch2(data.epoch);
    }
  };

  return (
    <div className="App">
      <h1>Neural Network Architecture Comparison</h1>
      
      <div className="models-container">
        <div className="model-section">
          <h2>Model 1</h2>
          <div className="model-progress">
            <h4>Model 1 Progress</h4>
            <ProgressBar current={currentEpoch1} total={modelConfigs.model1.num_epochs} />
          </div>
          <ModelConfig 
            modelNum={1} 
            onConfigChange={(config) => handleConfigChange(1, config)}
            initialConfig={modelConfigs.model1}
            sessionId={sessionId}
            isTraining={trainingStatus.model1}
            onStatusChange={(status) => setTrainingStatus(prev => ({...prev, model1: status}))}
          />
        </div>
        
        <div className="model-section">
          <h2>Model 2</h2>
          <div className="model-progress">
            <h4>Model 2 Progress</h4>
            <ProgressBar current={currentEpoch2} total={modelConfigs.model2.num_epochs} />
          </div>
          <ModelConfig 
            modelNum={2}
            onConfigChange={(config) => handleConfigChange(2, config)}
            initialConfig={modelConfigs.model2}
            sessionId={sessionId}
            isTraining={trainingStatus.model2}
            onStatusChange={(status) => setTrainingStatus(prev => ({...prev, model2: status}))}
          />
        </div>
      </div>
      
      <TrainingVisuals
        sessionId={sessionId}
        currentEpoch1={currentEpoch1}
        currentEpoch2={currentEpoch2}
        totalEpochs={Math.max(
          modelConfigs.model1.num_epochs,
          modelConfigs.model2.num_epochs
        )}
      />
    </div>
  );
}

export default App; 