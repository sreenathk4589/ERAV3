from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_socketio import SocketIO
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms
import threading
import uuid
import json
from models import build_model
from training import TrainingManager
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {"origins": "*"},
    r"/ws/*": {"origins": "*"}
})

# Initialize SocketIO
socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    logger=True,
    engineio_logger=True
)

# Store active training sessions
training_sessions = {}

@app.route('/')
def index():
    try:
        return jsonify({'status': 'Server is running'})
    except Exception as e:
        logger.error(f"Error in index route: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/test', methods=['GET'])
def test_api():
    try:
        logger.debug("Test API endpoint called")
        return jsonify({'status': 'API is working'})
    except Exception as e:
        logger.error(f"Error in test_api route: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/train', methods=['POST'])
def start_training():
    try:
        logger.debug(f"Received training request: {request.json}")
        data = request.json
        model_num = data['model_num']
        session_id = data.get('session_id')
        config = data['config']

        # Create new session if none exists
        if not session_id:
            session_id = str(uuid.uuid4())

        logger.info(f"Starting training for model {model_num} with session {session_id}")

        # Initialize model based on configuration
        model = build_model(config['layers'])
        
        # Setup optimizer
        optimizer_class = {
            'adam': optim.Adam,
            'sgd': optim.SGD,
            'rmsprop': optim.RMSprop
        }.get(config['optimizer_type'], optim.Adam)
        
        optimizer = optimizer_class(model.parameters(), lr=config['learning_rate'])
        
        # Setup loss function
        criterion = nn.CrossEntropyLoss()
        
        # Setup data loaders
        transform_list = [transforms.ToTensor()]
        if config.get('augmentations'):
            if 'random_horizontal_flip' in config['augmentations']:
                transform_list.append(transforms.RandomHorizontalFlip())
        
        transform = transforms.Compose(transform_list)
        
        train_dataset = datasets.FashionMNIST(
            './data', train=True, download=True, transform=transform
        )
        train_loader = torch.utils.data.DataLoader(
            train_dataset, 
            batch_size=config['batch_size'], 
            shuffle=True,
            num_workers=0
        )
        
        # Initialize training manager if not exists
        if session_id not in training_sessions:
            training_sessions[session_id] = TrainingManager(socketio)
        
        # Start training in background
        def start_training_thread():
            try:
                training_sessions[session_id].train_model(
                    model_num, model, train_loader, criterion, optimizer, config
                )
            except Exception as e:
                logger.error(f"Training error: {str(e)}")
                socketio.emit('training_error', {
                    'model': f'model{model_num}',
                    'error': str(e)
                })

        training_thread = threading.Thread(target=start_training_thread)
        training_thread.daemon = True
        training_thread.start()
        
        return jsonify({
            'success': True,
            'session_id': session_id
        })
        
    except Exception as e:
        logger.error(f"Error starting training: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/stop', methods=['POST'])
def stop_training():
    try:
        data = request.json
        session_id = data['session_id']
        model_num = data['model_num']
        
        if session_id in training_sessions:
            training_sessions[session_id].stop_training(model_num)
            return jsonify({'success': True})
        
        return jsonify({
            'success': False,
            'error': 'Session not found'
        }), 404
        
    except Exception as e:
        logger.error(f"Error stopping training: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/weights/<session_id>/model<int:model_num>', methods=['GET'])
def get_weights(session_id, model_num):
    try:
        if session_id in training_sessions:
            weights_path = training_sessions[session_id].get_model_weights(model_num)
            if weights_path:
                return send_file(
                    weights_path,
                    as_attachment=True,
                    download_name=f'model{model_num}_weights.pth'
                )
            else:
                return jsonify({
                    'success': False,
                    'error': 'Weights not found'
                }), 404
        
        return jsonify({
            'success': False,
            'error': 'Session not found'
        }), 404
        
    except Exception as e:
        logger.error(f"Error getting weights: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@socketio.on('connect')
def handle_connect():
    logger.debug('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    logger.debug('Client disconnected')

# Error handlers
@app.errorhandler(404)
def not_found_error(error):
    logger.error(f"404 error: {error}")
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"500 error: {error}")
    return jsonify({'error': 'Internal server error'}), 500