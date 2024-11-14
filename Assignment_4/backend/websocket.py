from flask_socketio import SocketIO, emit

socketio = SocketIO(cors_allowed_origins="*")

def init_websocket(app):
    socketio.init_app(app)
    return socketio

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected') 