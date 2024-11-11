from flask import Flask, render_template, request, jsonify
from utils.preprocessor import preprocess_text, preprocess_image, preprocess_audio, preprocess_3d
from utils.augmentor import augment_text, augment_image, augment_audio, augment_3d
import os
import base64
from PIL import Image
import io
import matplotlib
matplotlib.use('Agg')  # Set the backend to non-interactive 'Agg'
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
import librosa.display
import IPython.display as ipd
import numpy as np
import soundfile as sf
from plyfile import PlyData
from datetime import datetime

app = Flask(__name__)

# Create directories for storing uploaded files
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(os.path.join(UPLOAD_FOLDER, 'images'), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_FOLDER, 'audio'), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_FOLDER, '3d'), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_FOLDER, 'text'), exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/process', methods=['POST'])
def process():
    input_type = request.form.get('input_type')
    action = request.form.get('action')
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
        
    file = request.files['file']
    
    # Generate unique filename
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_FOLDER, input_type + 's', filename)
    
    # Save file if it doesn't exist
    if not os.path.exists(file_path):
        file.save(file_path)
    
    if input_type == 'text':
        return process_text(file_path, action)
    elif input_type == 'image':
        return process_image(file_path, action)
    elif input_type == 'audio':
        return process_audio(file_path, action)
    elif input_type == '3d':
        return process_3d(file_path, action)
    
    return jsonify({'error': 'Invalid input type'}), 400

def process_text(file_path, action):
    with open(file_path, 'r') as f:
        text = f.read()
    
    if action == 'preprocess':
        preprocessed_text = preprocess_text(text)
        return jsonify({
            'preprocessed_text': preprocessed_text
        })
    else:  # augment
        augmented_text, changes = augment_text(text)
        return jsonify({
            'augmented_text': augmented_text,
            'changes': changes
        })

def process_image(file_path, action):
    try:
        # Load image from saved file
        image = Image.open(file_path)
        
        if action == 'preprocess':
            processed_image = preprocess_image(image)
            
            # Save processed image
            buffer = io.BytesIO()
            processed_image.save(buffer, format='PNG')
            buffer.seek(0)
            image_base64 = base64.b64encode(buffer.getvalue()).decode()
            
            return jsonify({
                'preprocessed_image': f'data:image/png;base64,{image_base64}'
            })
            
        else:  # augment
            augmented_image = augment_image(image)
            
            buffer = io.BytesIO()
            augmented_image.save(buffer, format='PNG')
            buffer.seek(0)
            image_base64 = base64.b64encode(buffer.getvalue()).decode()
            
            return jsonify({
                'augmented_image': f'data:image/png;base64,{image_base64}'
            })
            
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        return jsonify({'error': str(e)}), 400

def process_audio(file_path, action):
    try:
        # Load audio from saved file
        audio_data, sr = librosa.load(file_path)
        
        if action == 'preprocess':
            processed_audio = preprocess_audio(audio_data)
            
            # Generate visualizations
            plt.figure(figsize=(10, 6))
            
            plt.subplot(2, 1, 1)
            librosa.display.waveshow(processed_audio, sr=sr)
            plt.title("Preprocessed Audio Waveform")
            
            plt.subplot(2, 1, 2)
            spec = librosa.feature.melspectrogram(y=processed_audio, sr=sr)
            librosa.display.specshow(librosa.power_to_db(spec, ref=np.max),
                                   y_axis='mel', x_axis='time')
            plt.title("Preprocessed Mel Spectrogram")
            plt.tight_layout()
            
            vis_buffer = io.BytesIO()
            plt.savefig(vis_buffer, format='png')
            vis_buffer.seek(0)
            vis_base64 = base64.b64encode(vis_buffer.getvalue()).decode()
            plt.close()
            
            audio_buffer = io.BytesIO()
            sf.write(audio_buffer, processed_audio, sr, format='WAV')
            audio_buffer.seek(0)
            audio_base64 = base64.b64encode(audio_buffer.getvalue()).decode()
            
            return jsonify({
                'visualizations': f'data:image/png;base64,{vis_base64}',
                'preprocessed_audio': f'data:audio/wav;base64,{audio_base64}'
            })
            
        else:  # augment
            augmented_audio = augment_audio(audio_data)
            
            # Generate visualizations
            plt.figure(figsize=(10, 6))
            
            plt.subplot(2, 1, 1)
            librosa.display.waveshow(augmented_audio, sr=sr)
            plt.title("Augmented Audio Waveform")
            
            plt.subplot(2, 1, 2)
            spec = librosa.feature.melspectrogram(y=augmented_audio, sr=sr)
            librosa.display.specshow(librosa.power_to_db(spec, ref=np.max),
                                   y_axis='mel', x_axis='time')
            plt.title("Augmented Mel Spectrogram")
            plt.tight_layout()
            
            vis_buffer = io.BytesIO()
            plt.savefig(vis_buffer, format='png')
            vis_buffer.seek(0)
            vis_base64 = base64.b64encode(vis_buffer.getvalue()).decode()
            plt.close()
            
            audio_buffer = io.BytesIO()
            sf.write(audio_buffer, augmented_audio, sr, format='WAV')
            audio_buffer.seek(0)
            audio_base64 = base64.b64encode(audio_buffer.getvalue()).decode()
            
            return jsonify({
                'visualizations': f'data:image/png;base64,{vis_base64}',
                'augmented_audio': f'data:audio/wav;base64,{audio_base64}'
            })
            
    except Exception as e:
        print(f"Error processing audio: {str(e)}")
        return jsonify({'error': str(e)}), 400

def process_3d(file_path, action):
    try:
        # Read 3D data from saved file
        plydata = PlyData.read(file_path)
        vertex = plydata['vertex']
        points = np.vstack([vertex['x'], vertex['y'], vertex['z']]).T
        
        if action == 'preprocess':
            processed_points = preprocess_3d(points)
            
            # Generate visualization
            fig = plt.figure(figsize=(10, 6))
            ax = fig.add_subplot(111, projection='3d')
            ax.scatter(processed_points[:, 0], 
                      processed_points[:, 1], 
                      processed_points[:, 2], 
                      c='b', marker='.')
            ax.set_xlabel('X')
            ax.set_ylabel('Y')
            ax.set_zlabel('Z')
            plt.title("Preprocessed 3D Data")
            
            # Save visualization
            buffer = io.BytesIO()
            plt.savefig(buffer, format='png')
            buffer.seek(0)
            vis_base64 = base64.b64encode(buffer.getvalue()).decode()
            plt.close()
            
            return jsonify({
                'visualization': f'data:image/png;base64,{vis_base64}'
            })
            
        else:  # augment
            augmented_points = augment_3d(points)
            
            # Generate visualization
            fig = plt.figure(figsize=(10, 6))
            ax = fig.add_subplot(111, projection='3d')
            ax.scatter(augmented_points[:, 0], 
                      augmented_points[:, 1], 
                      augmented_points[:, 2], 
                      c='r', marker='.')
            ax.set_xlabel('X')
            ax.set_ylabel('Y')
            ax.set_zlabel('Z')
            plt.title("Augmented 3D Data")
            
            # Save visualization
            buffer = io.BytesIO()
            plt.savefig(buffer, format='png')
            buffer.seek(0)
            vis_base64 = base64.b64encode(buffer.getvalue()).decode()
            plt.close()
            
            return jsonify({
                'visualization': f'data:image/png;base64,{vis_base64}'
            })
            
    except Exception as e:
        print(f"Error processing 3D data: {str(e)}")
        return jsonify({'error': str(e)}), 400

def visualize_data(data, data_type, title="Original"):
    """
    Visualize different types of data (image, 3D, audio)
    """
    plt.figure(figsize=(10, 6))
    
    if data_type == "image":
        plt.imshow(data)
        plt.title(f"{title} Image")
        plt.axis('off')
        plt.show()
        
    elif data_type == "3d":
        fig = plt.figure(figsize=(10, 6))
        ax = fig.add_subplot(111, projection='3d')
        
        # Assuming data is a point cloud with shape (N, 3)
        x, y, z = data[:, 0], data[:, 1], data[:, 2]
        ax.scatter(x, y, z, c='b', marker='.')
        
        ax.set_xlabel('X')
        ax.set_ylabel('Y')
        ax.set_zlabel('Z')
        plt.title(f"{title} 3D Data")
        plt.show()
        
    elif data_type == "audio":
        # Display waveform
        plt.subplot(2, 1, 1)
        librosa.display.waveshow(data, sr=16000)  # Adjust sample rate as needed
        plt.title(f"{title} Audio Waveform")
        
        # Display spectrogram
        plt.subplot(2, 1, 2)
        spec = librosa.feature.melspectrogram(y=data, sr=16000)
        librosa.display.specshow(librosa.power_to_db(spec, ref=np.max),
                               y_axis='mel', x_axis='time')
        plt.title(f"{title} Mel Spectrogram")
        plt.tight_layout()
        plt.show()
        
        # Play audio
        ipd.display(ipd.Audio(data, rate=16000))

def process_and_visualize(data, data_type):
    # Display original data
    visualize_data(data, data_type, "Original")
    
    # Process/augment the data
    augmented_data = apply_augmentations(data)  # Your augmentation function
    
    # Display augmented data
    visualize_data(augmented_data, data_type, "Augmented")

def main():
    # For images
    image_data = load_image()  # Your image loading function
    process_and_visualize(image_data, "image")
    
    # For 3D data
    point_cloud = load_point_cloud()  # Your point cloud loading function
    process_and_visualize(point_cloud, "3d")
    
    # For audio
    audio_data = load_audio()  # Your audio loading function
    process_and_visualize(audio_data, "audio")

# Add cleanup function
@app.before_request
def cleanup_old_files():
    # Delete files older than 1 hour
    for root, dirs, files in os.walk(UPLOAD_FOLDER):
        for file in files:
            file_path = os.path.join(root, file)
            file_age = datetime.now().timestamp() - os.path.getctime(file_path)
            if file_age > 3600:  # 1 hour in seconds
                os.remove(file_path)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True) 