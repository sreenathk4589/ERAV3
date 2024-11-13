import React, { useState, useEffect } from 'react';
import { logger } from '../services/logger';

function ModelConfig({ modelNum, onConfigChange }) {
  const [layers, setLayers] = useState([]);
  const [config, setConfig] = useState({
    layers: [],
    optimizer_type: 'adam',
    loss_function: 'cross_entropy',
    learning_rate: 0.001,
    batch_size: 32,
    num_epochs: 10,
    device: 'cuda',
    augmentations: []
  });

  useEffect(() => {
    const fullConfig = {
      ...config,
      layers: layers
    };
    onConfigChange(fullConfig);
  }, [JSON.stringify(layers), JSON.stringify(config)]);

  const addLayer = (type) => {
    logger.info(`Adding ${type} Layer to Model ${modelNum}`);
    let newLayer;
    const lastLayer = layers[layers.length - 1];
    
    switch(type) {
      case 'conv2d':
        let inChannels;
        if (!lastLayer) {
          inChannels = 1; // First layer, input is grayscale image
        } else if (lastLayer.layer_type === 'conv2d') {
          inChannels = lastLayer.out_channels;
        } else if (lastLayer.layer_type === 'maxpool') {
          const lastConvLayer = [...layers].reverse().find(l => l.layer_type === 'conv2d');
          inChannels = lastConvLayer ? lastConvLayer.out_channels : 1;
        } else if (lastLayer.layer_type === 'activation') {
          const lastConvLayer = [...layers].reverse().find(l => 
            l.layer_type === 'conv2d' || l.layer_type === 'maxpool'
          );
          inChannels = lastConvLayer ? 
            (lastConvLayer.layer_type === 'conv2d' ? lastConvLayer.out_channels : lastConvLayer.channels) 
            : 1;
        }
        
        newLayer = { 
          layer_type: 'conv2d', 
          in_channels: inChannels,
          out_channels: inChannels, // Initialize with same as input, user can modify
          kernel_size: 3,
          stride: 1,
          padding: 1
        };
        break;

      case 'maxpool':
        const lastChannelLayer = [...layers].reverse().find(l => 
          l.layer_type === 'conv2d' || l.layer_type === 'maxpool'
        );
        const channels = lastChannelLayer ? 
          (lastChannelLayer.layer_type === 'conv2d' ? lastChannelLayer.out_channels : lastChannelLayer.channels) 
          : 1;

        newLayer = {
          layer_type: 'maxpool',
          kernel_size: 2,
          stride: 2,
          channels: channels  // Store the number of channels
        };
        break;

      case 'activation':
        newLayer = {
          layer_type: 'activation',
          function: 'relu'
        };
        break;

      case 'linear':
        let inFeatures;
        if (!lastLayer) {
          inFeatures = 784; // 28x28 flattened image
        } else if (lastLayer.layer_type === 'linear') {
          inFeatures = lastLayer.out_features;
        } else if (lastLayer.layer_type === 'conv2d') {
          let size = 28; // Initial image size
          let channels = lastLayer.out_channels;
          
          layers.forEach(l => {
            if (l.layer_type === 'conv2d') {
              size = Math.floor((size - l.kernel_size + 2*l.padding) / l.stride) + 1;
            } else if (l.layer_type === 'maxpool') {
              size = Math.floor(size / l.kernel_size);
            }
          });
          
          inFeatures = size * size * channels;
        }
        
        newLayer = { 
          layer_type: 'linear', 
          in_features: inFeatures,
          out_features: layers.length === layers.length - 1 ? 10 : 128
        };
        break;

      default:
        return;
    }
    setLayers([...layers, newLayer]);
  };

  const removeLastLayer = () => {
    if (layers.length > 0) {
      setLayers(layers.slice(0, -1));
    }
  };

  const updateLayer = (index, field, value) => {
    logger.debug(`Updating Layer ${index} in Model ${modelNum}`, {
      field,
      value
    });
    const updatedLayers = [...layers];
    const currentLayer = updatedLayers[index];
    
    // Parse value based on field type
    let parsedValue;
    if (field === 'function') {
      parsedValue = value;
    } else {
      parsedValue = parseInt(value);
      if (isNaN(parsedValue)) {
        console.warn(`Invalid value for ${field}:`, value);
        return; // Don't update if value is invalid
      }
    }

    // Update the current layer
    currentLayer[field] = parsedValue;
    
    // Update dependent layers
    if (field === 'out_channels' && currentLayer.layer_type === 'conv2d') {
      for (let i = index + 1; i < updatedLayers.length; i++) {
        if (updatedLayers[i].layer_type === 'maxpool') {
          updatedLayers[i].channels = parsedValue;
        } else if (updatedLayers[i].layer_type === 'conv2d') {
          updatedLayers[i].in_channels = parsedValue;
          break;
        }
      }
    }

    // Force a re-render by creating a new array
    setLayers(updatedLayers);
  };

  const updateConfig = (field, value) => {
    console.log(`=== Updating ${field} ===`);
    console.log('New value:', value);
    let processedValue;
    
    switch(field) {
      case 'learning_rate':
        processedValue = parseFloat(value);
        break;
      case 'batch_size':
      case 'num_epochs':
        processedValue = parseInt(value) || 1; // Default to 1 if parsing fails
        break;
      case 'augmentations':
        processedValue = value;
        break;
      default:
        processedValue = value;
    }

    console.log(`Updating ${field} to:`, processedValue); // Debug log

    const newConfig = {
      ...config,
      [field]: processedValue
    };
    
    setConfig(newConfig);
    onConfigChange(newConfig); // Make sure to call this to update parent
  };

  const renderLayerConfig = (layer, index) => {
    switch(layer.layer_type) {
      case 'conv2d':
        return (
          <div className="layer-box conv2d">
            <h4>Conv2D Layer {index + 1}</h4>
            <div className="layer-params">
              <label>
                In Channels:
                <input
                  type="number"
                  min="1"
                  defaultValue={layer.in_channels}
                  onBlur={(e) => updateLayer(index, 'in_channels', e.target.value)}
                />
              </label>
              <label>
                Out Channels:
                <input
                  type="number"
                  min="1"
                  defaultValue={layer.out_channels}
                  onBlur={(e) => updateLayer(index, 'out_channels', e.target.value)}
                />
              </label>
              <label>
                Kernel Size:
                <input
                  type="number"
                  min="1"
                  defaultValue={layer.kernel_size}
                  onBlur={(e) => updateLayer(index, 'kernel_size', e.target.value)}
                />
              </label>
              <label>
                Stride:
                <input
                  type="number"
                  min="1"
                  defaultValue={layer.stride}
                  onBlur={(e) => updateLayer(index, 'stride', e.target.value)}
                />
              </label>
              <label>
                Padding:
                <input
                  type="number"
                  min="0"
                  defaultValue={layer.padding}
                  onBlur={(e) => updateLayer(index, 'padding', e.target.value)}
                />
              </label>
            </div>
          </div>
        );
      
      case 'maxpool':
        return (
          <div className="layer-box maxpool">
            <h4>MaxPool Layer {index + 1}</h4>
            <div className="layer-params">
              <label>
                Channels: {layer.channels}
              </label>
              <label>
                Kernel Size:
                <input
                  type="number"
                  min="1"
                  defaultValue={layer.kernel_size}
                  onBlur={(e) => updateLayer(index, 'kernel_size', e.target.value)}
                />
              </label>
              <label>
                Stride:
                <input
                  type="number"
                  min="1"
                  defaultValue={layer.stride}
                  onBlur={(e) => updateLayer(index, 'stride', e.target.value)}
                />
              </label>
            </div>
          </div>
        );

      case 'activation':
        return (
          <div className="layer-box activation">
            <h4>Activation Layer {index + 1}</h4>
            <div className="layer-params">
              <label>
                Function:
                <select
                  value={layer.function}
                  onChange={(e) => updateLayer(index, 'function', e.target.value)}
                >
                  <option value="relu">ReLU</option>
                  <option value="sigmoid">Sigmoid</option>
                  <option value="tanh">Tanh</option>
                  <option value="leaky_relu">Leaky ReLU</option>
                </select>
              </label>
            </div>
          </div>
        );

      case 'linear':
        return (
          <div className="layer-box linear">
            <h4>Linear Layer {index + 1}</h4>
            <div className="layer-params">
              <label>
                In Features:
                <input
                  type="number"
                  min="1"
                  defaultValue={layer.in_features}
                  onBlur={(e) => updateLayer(index, 'in_features', e.target.value)}
                />
              </label>
              <label>
                Out Features:
                <input
                  type="number"
                  min="1"
                  defaultValue={layer.out_features}
                  onBlur={(e) => updateLayer(index, 'out_features', e.target.value)}
                />
              </label>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="model-config">
      <div className="layer-controls">
        <div className="button-group">
          <button className="button" onClick={() => addLayer('conv2d')}>Add Conv2D</button>
          <button className="button" onClick={() => addLayer('maxpool')}>Add MaxPool</button>
          <button className="button" onClick={() => addLayer('activation')}>Add Activation</button>
          <button className="button" onClick={() => addLayer('linear')}>Add Linear</button>
          <button 
            className="button button-danger" 
            onClick={removeLastLayer}
            disabled={layers.length === 0}
          >
            Undo Last Layer
          </button>
        </div>
        
        <div className="layers-visualization">
          {layers.map((layer, index) => (
            <div key={index} className="layer-container">
              {renderLayerConfig(layer, index)}
              {index < layers.length - 1 && <div className="layer-arrow">→</div>}
            </div>
          ))}
        </div>
      </div>
      
      <div className="training-config">
        <h4>Training Configuration</h4>
        <div className="config-grid">
          <div className="config-item">
            <label>
              Optimizer:
              <select 
                value={config.optimizer_type}
                onChange={(e) => updateConfig('optimizer_type', e.target.value)}
              >
                <option value="adam">Adam</option>
                <option value="sgd">SGD</option>
                <option value="rmsprop">RMSprop</option>
              </select>
            </label>
          </div>

          <div className="config-item">
            <label>
              Batch Size:
              <input
                type="number"
                min="1"
                max="512"
                value={config.batch_size}
                onChange={(e) => updateConfig('batch_size', e.target.value)}
                onBlur={(e) => {
                  let value = parseInt(e.target.value);
                  if (isNaN(value) || value < 1) value = 1;
                  if (value > 512) value = 512;
                  updateConfig('batch_size', value);
                }}
              />
            </label>
          </div>

          <div className="config-item">
            <label>
              Number of Epochs:
              <input
                type="number"
                min="1"
                value={config.num_epochs}
                onChange={(e) => updateConfig('num_epochs', e.target.value)}
                onBlur={(e) => {
                  let value = parseInt(e.target.value);
                  if (isNaN(value) || value < 1) value = 1;
                  updateConfig('num_epochs', value);
                }}
              />
            </label>
          </div>

          <div className="config-item learning-rate-container">
            <label>
              Learning Rate: {config.learning_rate.toExponential(3)}
              <input
                type="range"
                min="-5"
                max="-1"
                step="0.1"
                value={Math.log10(config.learning_rate)}
                onChange={(e) => {
                  const value = Math.pow(10, parseFloat(e.target.value));
                  updateConfig('learning_rate', value);
                }}
              />
            </label>
          </div>

          <div className="config-item">
            <label>
              Device:
              <select
                value={config.device}
                onChange={(e) => updateConfig('device', e.target.value)}
              >
                <option value="cuda">GPU (CUDA)</option>
                <option value="cpu">CPU</option>
              </select>
            </label>
          </div>
        </div>
        
        <div className="augmentations">
          <h4>Augmentations</h4>
          <div className="augmentations-grid">
            <label>
              <input 
                type="checkbox"
                checked={config.augmentations.includes('random_horizontal_flip')}
                onChange={(e) => {
                  const newAugs = e.target.checked 
                    ? [...config.augmentations, 'random_horizontal_flip']
                    : config.augmentations.filter(aug => aug !== 'random_horizontal_flip');
                  updateConfig('augmentations', newAugs);
                }}
              />
              Random Horizontal Flip
            </label>
            {/* Add more augmentations here */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModelConfig;