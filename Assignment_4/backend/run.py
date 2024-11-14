import os
import sys
import socket
from contextlib import closing

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import app, socketio

def find_free_port(start_port=8000, max_port=8100):
    """Find a free port to use by testing ports in a range."""
    for port in range(start_port, max_port):
        with closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as sock:
            try:
                sock.bind(('', port))
                return port
            except OSError:
                continue
    raise OSError("No free ports available in range {}-{}".format(start_port, max_port))

if __name__ == '__main__':
    try:
        port = find_free_port()
        print(f"Starting server on port {port}")
        socketio.run(app, debug=True, port=port)
    except Exception as e:
        print(f"Error starting server: {e}")
        input("Press Enter to exit...") 