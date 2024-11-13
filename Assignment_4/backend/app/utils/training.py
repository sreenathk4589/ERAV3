import torch
import torch.nn as nn
import torch.optim as optim
from typing import Dict, Any, Optional
import asyncio
import logging

logger = logging.getLogger(__name__)

class DynamicNet(nn.Module):
    def __init__(self, layers_config: list):
        super().__init__()
        self.layers = nn.ModuleList()
        
        for layer in layers_config:
            if layer.layer_type == "conv2d":
                self.layers.append(
                    nn.Conv2d(
                        in_channels=layer.in_channels,
                        out_channels=layer.out_channels,
                        kernel_size=layer.kernel_size,
                        stride=layer.stride,
                        padding=layer.padding
                    )
                )
            elif layer.layer_type == "maxpool":
                self.layers.append(
                    nn.MaxPool2d(
                        kernel_size=layer.kernel_size,
                        stride=layer.stride
                    )
                )
            elif layer.layer_type == "activation":
                if layer.function.lower() == "relu":
                    self.layers.append(nn.ReLU())
                elif layer.function.lower() == "sigmoid":
                    self.layers.append(nn.Sigmoid())
                elif layer.function.lower() == "tanh":
                    self.layers.append(nn.Tanh())
                elif layer.function.lower() == "leaky_relu":
                    self.layers.append(nn.LeakyReLU())
            elif layer.layer_type == "linear":
                self.layers.append(
                    nn.Linear(
                        in_features=layer.in_features,
                        out_features=layer.out_features
                    )
                )

    def forward(self, x):
        for layer in self.layers:
            x = layer(x)
        return x

class ModelTrainer:
    def __init__(self, config, train_loader, val_loader):
        logger.info("Initializing ModelTrainer")
        logger.debug(f"Config: {config}")
        try:
            self.config = config
            self.train_loader = train_loader
            self.val_loader = val_loader
            logger.info(f"Setting device to: {config.device}")
            self.device = torch.device(config.device if torch.cuda.is_available() else "cpu")
            
            logger.info("Creating model")
            self.model = DynamicNet(config.layers).to(self.device)
            logger.debug(f"Model architecture: {self.model}")
            
            logger.info("Initializing optimizer")
            self.optimizer = self._get_optimizer()
            logger.debug(f"Optimizer: {self.optimizer}")
            
            logger.info("Setting up loss function")
            self.criterion = self._get_loss_function()
            logger.debug(f"Loss function: {self.criterion}")
            
            self.should_stop = False
            self.current_epoch = 0
            logger.info("ModelTrainer initialization complete")
        except Exception as e:
            logger.error(f"Error in ModelTrainer initialization: {str(e)}", exc_info=True)
            raise

    def _get_optimizer(self):
        if self.config.optimizer_type.lower() == "adam":
            return optim.Adam(self.model.parameters(), lr=self.config.learning_rate)
        elif self.config.optimizer_type.lower() == "sgd":
            return optim.SGD(self.model.parameters(), lr=self.config.learning_rate)
        elif self.config.optimizer_type.lower() == "rmsprop":
            return optim.RMSprop(self.model.parameters(), lr=self.config.learning_rate)
        else:
            return optim.Adam(self.model.parameters(), lr=self.config.learning_rate)

    def _get_loss_function(self):
        if self.config.loss_function.lower() == "cross_entropy":
            return nn.CrossEntropyLoss()
        elif self.config.loss_function.lower() == "mse":
            return nn.MSELoss()
        else:
            return nn.CrossEntropyLoss()

    async def train_epoch(self) -> Dict[str, float]:
        self.model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        for batch_idx, (inputs, targets) in enumerate(self.train_loader):
            if self.should_stop:
                break

            inputs, targets = inputs.to(self.device), targets.to(self.device)
            
            self.optimizer.zero_grad()
            outputs = self.model(inputs)
            loss = self.criterion(outputs, targets)
            loss.backward()
            self.optimizer.step()

            running_loss += loss.item()
            _, predicted = outputs.max(1)
            total += targets.size(0)
            correct += predicted.eq(targets).sum().item()

            # Allow other tasks to run
            if batch_idx % 10 == 0:
                await asyncio.sleep(0)

        self.current_epoch += 1
        
        return {
            "epoch": self.current_epoch,
            "loss": running_loss / len(self.train_loader),
            "accuracy": 100. * correct / total
        }

    def stop_training(self):
        self.should_stop = True

    def get_model_weights(self) -> Dict[str, Any]:
        return {
            "state_dict": self.model.state_dict(),
            "config": self.config.dict()
        }

# Explicitly export the ModelTrainer class
__all__ = ['ModelTrainer']