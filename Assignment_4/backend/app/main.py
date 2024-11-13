from flask import Blueprint, request, jsonify, make_response
import torch
import uuid
import logging
from logging.handlers import RotatingFileHandler
import os
from .utils.training import ModelTrainer
from .utils.data_loader import get_fashion_mnist_loaders
from . import socketio
from .schemas.model_config import ModelConfig
from concurrent.futures import ThreadPoolExecutor
import functools
import threading
import queue

# Create logs directory if it doesn't exist
log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Add file handler with more detailed formatting
file_handler = RotatingFileHandler(
    os.path.join(log_dir, 'debug.log'),
    maxBytes=1024*1024,  # 1MB
    backupCount=5
)
file_handler.setLevel(logging.DEBUG)
formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s'
)
file_handler.setFormatter(formatter)

# Remove any existing handlers and add our file handler
logger.handlers = []
logger.addHandler(file_handler)
logger.propagate = False  # Prevent duplicate logs

# Add some test logs to verify logging is working
logger.debug("Debug logging test")
logger.info("Info logging test")
logger.warning("Warning logging test")

main_bp = Blueprint('main', __name__)
active_trainers = {}

executor = ThreadPoolExecutor(max_workers=2)  # Limit concurrent operations

# Create a thread pool for handling initialization
init_pool = ThreadPoolExecutor(max_workers=4)
# Queue for storing initialization results
init_queue = queue.Queue()

def async_handler(f):
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        try:
            return executor.submit(f, *args, **kwargs).result(timeout=25)  # 25 second timeout
        except Exception as e:
            logger.error(f"Async operation failed: {str(e)}", exc_info=True)
            raise
    return wrapper

@main_bp.route('/')
def read_root():
    logger.info("Root endpoint accessed")
    return jsonify({"message": "Fashion MNIST Neural Network Comparison API"})

@main_bp.route('/health')
def health_check():
    logger.info("Health check endpoint accessed")
    return jsonify({"status": "healthy"})

@main_bp.route('/api/start-training', methods=['POST'])
def start_training():
    try:
        logger.info("=== Start Training Request Received ===")
        if not request.is_json:
            logger.error("Request is not JSON")
            return jsonify({"error": "Request must be JSON"}), 400
            
        data = request.get_json()
        logger.debug(f"Received data: {data}")
        
        if not data:
            logger.error("No data received")
            return jsonify({"error": "No data received"}), 400

        # Generate session ID first
        session_id = str(uuid.uuid4())
        logger.info(f"Generated session ID: {session_id}")
        
        # Initialize the session in active_trainers
        active_trainers[session_id] = {
            "status": "initializing",
            "error": None
        }
        
        # Submit initialization to thread pool
        init_pool.submit(initialize_training, data, session_id)
        
        logger.info(f"=== Returning session ID: {session_id} ===")
        return jsonify({
            "status": "initializing",
            "session_id": session_id
        })

    except Exception as e:
        logger.error(f"Error in start_training: {str(e)}", exc_info=True)
        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500

def initialize_training(data, session_id):
    try:
        logger.info(f"=== Starting initialization for session {session_id} ===")
        
        config1 = ModelConfig(**data['config1'])
        config2 = ModelConfig(**data['config2'])
        
        train_loader, val_loader = get_fashion_mnist_loaders(
            batch_size=config1.batch_size,
            augmentations=config1.augmentations
        )
        
        trainer1 = ModelTrainer(config1, train_loader, val_loader)
        trainer2 = ModelTrainer(config2, train_loader, val_loader)
        
        active_trainers[session_id] = {
            "model1": trainer1,
            "model2": trainer2,
            "status": "ready"
        }
        
        logger.info(f"=== Initialization complete for session {session_id} ===")
        
    except Exception as e:
        logger.exception(f"Initialization failed for session {session_id}")
        active_trainers[session_id] = {
            "status": "error",
            "error": str(e)
        }

@main_bp.route('/api/training-status/<session_id>', methods=['GET'])
def get_training_status(session_id):
    logger.info(f"Checking status for session {session_id}")
    logger.debug(f"Active trainers: {active_trainers.keys()}")
    
    if session_id not in active_trainers:
        logger.error(f"Session {session_id} not found")
        return jsonify({
            "status": "not_found",
            "error": "Session not found"
        }), 404
        
    session_data = active_trainers[session_id]
    status = session_data.get("status", "unknown")
    
    if status == "error":
        error = session_data.get("error", "Unknown error")
        logger.error(f"Error status for session {session_id}: {error}")
        return jsonify({
            "status": status,
            "error": error
        }), 500
    
    logger.info(f"Returning status for session {session_id}: {status}")
    return jsonify({"status": status})

@socketio.on('connect')
def handle_connect():
    # Handles WebSocket connections from frontend
    logger.info('Client connected to WebSocket')

@socketio.on('start_training')
def handle_training(session_id):
    logger.info(f'Starting training for session {session_id}')
    trainers = active_trainers.get(session_id)
    if not trainers:
        logger.error(f'No trainers found for session {session_id}')
        return
    
    try:
        while True:
            # Train one epoch for each model and send metrics
            metrics1 = trainers["model1"].train_epoch()
            metrics2 = trainers["model2"].train_epoch()
            
            emit('training_update', {
                "model1": metrics1,
                "model2": metrics2
            })
            
    except Exception as e:
        logger.error(f"Error during training: {str(e)}", exc_info=True)

@main_bp.route('/api/stop-training/<session_id>/<int:model_num>', methods=['POST'])
def stop_training(session_id, model_num):
    if session_id in active_trainers:
        model_key = f"model{model_num}"
        if model_key in active_trainers[session_id]:
            active_trainers[session_id][model_key].stop_training()
    return jsonify({"status": "success"})

@main_bp.route('/api/download-weights/<session_id>/<int:model_num>')
def download_weights(session_id, model_num):
    if session_id in active_trainers:
        model_key = f"model{model_num}"
        if model_key in active_trainers[session_id]:
            weights = active_trainers[session_id][model_key].get_model_weights()
            return jsonify(weights)
    return jsonify({"error": "Model not found"}), 404