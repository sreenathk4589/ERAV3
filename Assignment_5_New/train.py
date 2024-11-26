import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms
from model import MNISTNet, count_parameters, save_model
from torch.utils.data import DataLoader, Dataset
import numpy as np
from PIL import Image
import albumentations as A

class AugmentedMNIST(Dataset):
    def __init__(self, mnist_dataset, transform=None):
        self.dataset = mnist_dataset
        self.transform = transform

    def __len__(self):
        return len(self.dataset)

    def __getitem__(self, idx):
        img, label = self.dataset[idx]
        img_np = np.array(img.squeeze())  # Convert to numpy and remove channel dim
        
        if self.transform:
            augmented = self.transform(image=img_np)
            img_aug = augmented['image']
            # Add channel dimension back and convert to tensor
            img_aug = torch.FloatTensor(img_aug).unsqueeze(0)
            return img_aug, label
        
        return img, label

def train():
    # Set device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    # Basic transforms
    transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize((0.1307,), (0.3081,))
    ])
    
    # Augmentation transforms
    aug_transform = A.Compose([
        A.RandomRotate90(p=0.2),
        A.ShiftScaleRotate(shift_limit=0.0625, scale_limit=0.1, rotate_limit=15, p=0.3),
        A.OneOf([
            A.GaussNoise(p=1),
            A.GaussianBlur(p=1),
        ], p=0.2),
        A.GridDistortion(p=0.2),
    ])

    # Load MNIST dataset
    train_dataset_base = datasets.MNIST('./data', train=True, download=True, transform=transform)
    test_dataset = datasets.MNIST('./data', train=False, transform=transform)
    
    # Wrap training dataset with augmentations
    train_dataset = AugmentedMNIST(train_dataset_base, transform=aug_transform)
    
    train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=1000)
    
    # Initialize model
    model = MNISTNet().to(device)
    
    # Check model parameters
    n_parameters = count_parameters(model)
    print(f"Number of parameters: {n_parameters}")
    if n_parameters > 25000:
        raise ValueError("Model has too many parameters (>25000)")
    
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters())
    
    # Training
    model.train()
    for epoch in range(1):
        for batch_idx, (data, target) in enumerate(train_loader):
            data, target = data.to(device), target.to(device)
            optimizer.zero_grad()
            output = model(data)
            loss = criterion(output, target)
            loss.backward()
            optimizer.step()
            
            if batch_idx % 100 == 0:
                print(f'Train Epoch: {epoch} [{batch_idx * len(data)}/{len(train_loader.dataset)} '
                      f'({100. * batch_idx / len(train_loader):.0f}%)]\tLoss: {loss.item():.6f}')
    
    # Testing
    model.eval()
    correct = 0
    total = 0
    with torch.no_grad():
        for data, target in test_loader:
            data, target = data.to(device), target.to(device)
            output = model(data)
            _, predicted = torch.max(output.data, 1)
            total += target.size(0)
            correct += (predicted == target).sum().item()
    
    accuracy = 100 * correct / total
    print(f'Accuracy: {accuracy:.2f}%')
    
    if accuracy < 95:
        raise ValueError(f"Model accuracy ({accuracy:.2f}%) is below 95%")
    
    # Save model
    model_filename = save_model(model, accuracy)
    return accuracy, model_filename

if __name__ == "__main__":
    train() 