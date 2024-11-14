import torch
import threading
import os
from datetime import datetime

class TrainingManager:
    def __init__(self, socketio):
        self.models = {}
        self.stop_flags = {}
        self.locks = {}
        self.socketio = socketio

    def train_model(self, model_num, model, train_loader, criterion, optimizer, config):
        model_key = f'model{model_num}'
        self.models[model_key] = model
        self.stop_flags[model_key] = False
        self.locks[model_key] = threading.Lock()

        device = torch.device(config['device'] if torch.cuda.is_available() else 'cpu')
        model.to(device)
        
        for epoch in range(config['num_epochs']):
            if self.stop_flags[model_key]:
                break
                
            running_loss = 0.0
            correct = 0
            total = 0
            
            for i, (inputs, labels) in enumerate(train_loader):
                if self.stop_flags[model_key]:
                    break
                    
                inputs, labels = inputs.to(device), labels.to(device)
                
                optimizer.zero_grad()
                outputs = model(inputs)
                loss = criterion(outputs, labels)
                loss.backward()
                optimizer.step()
                
                running_loss += loss.item()
                _, predicted = outputs.max(1)
                total += labels.size(0)
                correct += predicted.eq(labels).sum().item()
                
            # Calculate epoch metrics
            epoch_loss = running_loss / len(train_loader)
            epoch_accuracy = 100. * correct / total
            
            # Send update through socketio
            self.socketio.emit('training_update', {
                'model': model_key,
                'epoch': epoch + 1,
                'loss': epoch_loss,
                'accuracy': epoch_accuracy
            })

        # Save final weights
        if not os.path.exists('weights'):
            os.makedirs('weights')
        torch.save(
            model.state_dict(),
            f'weights/{model_key}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pth'
        )

    def stop_training(self, model_num):
        model_key = f'model{model_num}'
        if model_key in self.stop_flags:
            with self.locks[model_key]:
                self.stop_flags[model_key] = True

    def get_model_weights(self, model_num):
        model_key = f'model{model_num}'
        if model_key in self.models:
            weights_dir = 'weights'
            weights_files = [f for f in os.listdir(weights_dir) if f.startswith(model_key)]
            if weights_files:
                latest_weights = max(weights_files, key=lambda x: os.path.getctime(os.path.join(weights_dir, x)))
                return os.path.join(weights_dir, latest_weights)
        return None 