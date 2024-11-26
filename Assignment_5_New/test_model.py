import torch
import pytest
from model import MNISTNet, count_parameters

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