# MNIST DNN Classifier with CI/CD

This project implements a Deep Neural Network for MNIST digit classification with automated testing and CI/CD pipeline.

## Model Architecture
- 3-layer DNN with convolutions and fully connected layers
- Input: 28x28 grayscale images
- Output: 10 classes (digits 0-9)
- Parameters: < 25000

## Local Setup and Testing

### Prerequisites
- Python 3.8 or higher
- Git
- pip (Python package installer)

### Step-by-Step Setup

1. Clone the repository:
2. Create and activate a virtual environment:
On windows:
```

.venv\Scripts\activate
```
On Linux/MacOS:
```
python3 -m venv .venv
source .venv/bin/activate
```
3. Install dependencies:
pip install -r requirements.txt

### Running Tests and Training

1. Run the model tests:
pytest test_model.py -v
    This will verify:
    - Model has less than 25000 parameters
    - Model accepts 28x28 input images
    - Model outputs 10 classes
- Forward pass works correctly
2. Train the model:
python train.py
    This will:
    - Download MNIST dataset (first run only)
    - Train the model for 1 epoch
    - Validate accuracy (should be >95%)
    - Save the model with timestamp and accuracy

### Expected Outputs

1. During training, you'll see progress:
Train Epoch: 0 [0/60000 (0%)] Loss: X.XXXXXX
Train Epoch: 0 [6400/60000 (11%)] Loss: X.XXXXXX

2. After training:
- Accuracy report
- Saved model file: `mnist_model_accXX.XX_YYYYMMDD_HHMMSS.pth`

### Troubleshooting

1. If CUDA/GPU errors occur:
   - The code automatically falls back to CPU
   - No action needed

2. If download fails:
   - Check internet connection
   - Try running train.py again

3. If accuracy is below 95%:
   - Training will raise an error
   - Try running training again (results may vary due to random initialization)

### Before Pushing to GitHub

1. Ensure all tests pass locally:
pytest test_model.py -v
2. Verify training works:
python train.py
3. Check that generated model files are in .gitignore

4. Commit and push your changes: