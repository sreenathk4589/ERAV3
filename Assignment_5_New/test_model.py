import torch
import pytest
from model import MNISTNet, count_parameters
import matplotlib.pyplot as plt
from torchvision import datasets, transforms
from train import AugmentedMNIST, aug_transform
import os

def test_model_parameters():
    model = MNISTNet()
    n_params = count_parameters(model)
    print(f"\nModel has {n_params:,} parameters")
    assert n_params < 25000, f"Model has {n_params} parameters, should be less than 25000"

def test_model_input_output():
    model = MNISTNet()
    # Test input shape
    test_input = torch.randn(1, 1, 28, 28)
    output = model(test_input)
    assert output.shape == (1, 10), f"Expected output shape (1, 10), got {output.shape}"

def test_model_forward():
    model = MNISTNet()
    test_input = torch.randn(1, 1, 28, 28)
    try:
        output = model(test_input)
    except Exception as e:
        pytest.fail(f"Forward pass failed: {str(e)}")

def test_augmentations():
    # Create output directory if it doesn't exist
    os.makedirs('test_outputs', exist_ok=True)
    
    # Load a few MNIST samples
    transform = transforms.Compose([transforms.ToTensor()])
    base_dataset = datasets.MNIST('./data', train=True, download=True, transform=transform)
    
    # Create augmented dataset
    aug_dataset = AugmentedMNIST(base_dataset, transform=aug_transform)
    
    # Plot original and augmented samples
    fig, axes = plt.subplots(3, 4, figsize=(12, 8))
    fig.suptitle('Original vs Augmented Samples')
    
    for i in range(3):
        # Get a sample
        orig_img, label = base_dataset[i]
        aug_img, _ = aug_dataset[i]
        
        # Plot original
        axes[i, 0].imshow(orig_img.squeeze(), cmap='gray')
        axes[i, 0].set_title(f'Original {label}')
        axes[i, 0].axis('off')
        
        # Plot 3 different augmentations of the same image
        for j in range(1, 4):
            aug_img, _ = aug_dataset[i]  # Get new augmentation
            axes[i, j].imshow(aug_img.squeeze(), cmap='gray')
            axes[i, j].set_title(f'Aug {j}')
            axes[i, j].axis('off')
    
    plt.tight_layout()
    plt.savefig('test_outputs/augmentation_samples.png')
    plt.close()
    
    assert os.path.exists('test_outputs/augmentation_samples.png'), "Augmentation visualization was not saved"
    print("\n✅ Augmentation samples saved to test_outputs/augmentation_samples.png")