import numpy as np
from PIL import Image
import librosa
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt
import io

def preprocess_text(text):
    """
    Preprocess text data:
    - Convert to lowercase
    - Remove special characters
    - Remove extra whitespace
    """
    # Convert to lowercase
    text = text.lower()
    # Remove special characters
    text = ''.join(c for c in text if c.isalnum() or c.isspace())
    # Remove extra whitespace
    text = ' '.join(text.split())
    return text

def preprocess_image(image):
    """
    Preprocess image data and return both processed image and display data
    """
    # Convert to RGB if needed
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    # Resize to standard size (e.g., 224x224)
    standard_size = (224, 224)
    image = image.resize(standard_size)
    
    # Convert to numpy array and normalize
    img_array = np.array(image)
    img_array = img_array / 255.0  # Normalize to [0,1]
    
    # Convert back to PIL Image
    normalized_image = Image.fromarray((img_array * 255).astype(np.uint8))
    
    # Add display information
    display_info = {
        'original_size': image.size,
        'processed_size': standard_size,
        'normalized_range': [img_array.min(), img_array.max()]
    }
    
    return normalized_image, display_info

def preprocess_audio(audio_data, sample_rate=22050):
    """
    Preprocess audio data and return both processed audio and visualization
    """
    # Normalize amplitude
    audio_data = audio_data / np.max(np.abs(audio_data))
    
    # Remove silence (simple threshold-based approach)
    threshold = 0.02
    mask = np.abs(audio_data) > threshold
    audio_data = audio_data[mask]
    
    # Add basic noise reduction (simple moving average)
    window_size = 5
    audio_data = np.convolve(audio_data, np.ones(window_size)/window_size, mode='valid')
    
    # Add visualization
    plt.figure(figsize=(10, 4))
    plt.plot(audio_data)
    plt.title('Processed Audio Waveform')
    plt.xlabel('Sample')
    plt.ylabel('Amplitude')
    
    # Save plot to bytes buffer
    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    plt.close()
    buf.seek(0)
    
    return audio_data, buf

def preprocess_3d(points):
    """
    Preprocess 3D point cloud data:
    - Center the points
    - Normalize scale
    - Remove outliers
    """
    # Center the points
    centroid = np.mean(points, axis=0)
    points = points - centroid
    
    # Normalize scale
    scale = np.max(np.abs(points))
    points = points / scale
    
    # Remove outliers (simple standard deviation based approach)
    scaler = StandardScaler()
    scaled_points = scaler.fit_transform(points)
    mask = np.all(np.abs(scaled_points) < 3, axis=1)  # Remove points > 3 std devs
    points = points[mask]
    
    return points