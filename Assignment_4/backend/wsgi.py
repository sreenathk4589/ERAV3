from app import create_app, socketio

app = create_app()

if __name__ == '__main__':
    socketio.run(
        app,
        debug=True,
        port=8000,
        host='127.0.0.1'
    ) 