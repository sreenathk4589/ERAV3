from flask import Flask, render_template, request, jsonify, send_from_directory
import os
import logging

app = Flask(__name__)
app.static_folder = 'static'

# Set up logging
logging.basicConfig(level=logging.DEBUG)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file:
        filename = file.filename
        filesize = len(file.read())
        file.seek(0)  # Reset file pointer to the beginning
        filetype = file.content_type

        return jsonify({
            'filename': filename,
            'filesize': filesize,
            'filetype': filetype
        })

@app.route('/static/images/<path:filename>')
def serve_image(filename):
    image_path = os.path.join(app.static_folder, 'images', filename)
    app.logger.debug(f"Attempting to serve image: {image_path}")
    if os.path.exists(image_path):
        app.logger.debug(f"Image file found: {image_path}")
        app.logger.debug(f"File permissions: {oct(os.stat(image_path).st_mode)[-3:]}")
    else:
        app.logger.error(f"Image file not found: {image_path}")
        app.logger.debug(f"Directory contents: {os.listdir(os.path.dirname(image_path))}")
    return send_from_directory(os.path.join(app.static_folder, 'images'), filename)

if __name__ == '__main__':
    app.run(debug=True)
