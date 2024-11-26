import torch
import torch.nn as nn
import torch.nn.functional as F
from datetime import datetime

class MNISTNet(nn.Module):
    def __init__(self):
        super(MNISTNet, self).__init__()
        # Encoder path (increasing channels)
        self.conv1 = nn.Conv2d(1, 8, kernel_size=3, padding=1)
        self.conv2 = nn.Conv2d(8, 16, kernel_size=3, padding=1)
        self.conv3 = nn.Conv2d(16, 32, kernel_size=3, padding=1)
        
        # Decoder path (decreasing channels)
        self.conv4 = nn.Conv2d(32, 16, kernel_size=3, padding=1)
        self.conv5 = nn.Conv2d(16, 8, kernel_size=3, padding=1)
        
        # Pooling layer
        self.pool = nn.MaxPool2d(2, 2)
        
        # Fully connected layers
        self.fc1 = nn.Linear(8 * 3 * 3, 32)    # Adjusted for 8 channels
        self.fc2 = nn.Linear(32, 32)           # Middle layer
        self.fc3 = nn.Linear(32, 10)           # Output layer
        
        # Dropout for regularization
        self.dropout = nn.Dropout(0.25)

    def forward(self, x):
        # Encoder path with pooling
        x = self.pool(F.relu(self.conv1(x)))  # 28x28 -> 14x14
        x = self.pool(F.relu(self.conv2(x)))  # 14x14 -> 7x7
        x = self.pool(F.relu(self.conv3(x)))  # 7x7 -> 3x3
        
        # Decoder path without pooling (reducing channels)
        x = F.relu(self.conv4(x))  # Stays at 3x3, reduces to 16 channels
        x = F.relu(self.conv5(x))  # Stays at 3x3, reduces to 8 channels
        
        # Flatten and fully connected layers
        x = x.view(-1, 8 * 3 * 3)  # Now using 8 channels
        x = self.dropout(F.relu(self.fc1(x)))
        x = self.dropout(F.relu(self.fc2(x)))
        x = self.fc3(x)
        return x

def count_parameters(model):
    return sum(p.numel() for p in model.parameters() if p.requires_grad)

def save_model(model, accuracy):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"mnist_model_acc{accuracy:.2f}_{timestamp}.pth"
    torch.save(model.state_dict(), filename)
    return filename 