import torch
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
from typing import List

def get_fashion_mnist_loaders(batch_size: int, augmentations: List[str]):
    transform_list = [transforms.ToTensor()]
    
    # Add requested augmentations
    aug_map = {
        "random_horizontal_flip": transforms.RandomHorizontalFlip(),
        "random_rotation": transforms.RandomRotation(10),
        "random_affine": transforms.RandomAffine(degrees=0, translate=(0.1, 0.1)),
        "color_jitter": transforms.ColorJitter(brightness=0.2, contrast=0.2),
    }
    
    for aug in augmentations:
        if aug in aug_map:
            transform_list.append(aug_map[aug])
    
    transform = transforms.Compose(transform_list)
    
    # Load datasets
    train_dataset = datasets.FashionMNIST(
        root='./data',
        train=True,
        download=True,
        transform=transform
    )
    
    val_dataset = datasets.FashionMNIST(
        root='./data',
        train=False,
        download=True,
        transform=transforms.ToTensor()
    )
    
    # Create data loaders
    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True
    )
    
    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False
    )
    
    return train_loader, val_loader 