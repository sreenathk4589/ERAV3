document.addEventListener('DOMContentLoaded', () => {
    const animalSelector = document.querySelector('.animal-selector');
    const animalImage = document.getElementById('animal-image');
    const uploadForm = document.getElementById('upload-form');
    const fileInfo = document.getElementById('file-info');
    const debugInfo = document.getElementById('debug-info');

    animalSelector.addEventListener('change', (event) => {
        if (event.target.type === 'radio') {
            const animal = event.target.value;
            const imagePath = `/static/images/${animal}.jpg`;
            animalImage.innerHTML = `<img src="${imagePath}" alt="${animal}">`;
            debugInfo.innerHTML = `Attempting to load image: ${imagePath}`;

            // Check if the image loads successfully
            const img = new Image();
            img.onload = () => {
                debugInfo.innerHTML += '<br>Image loaded successfully!';
            };
            img.onerror = (e) => {
                debugInfo.innerHTML += `<br>Error loading image. Check the file path and permissions. Error details: ${e.type}`;
                console.error('Image load error:', e);
            };
            img.src = imagePath;
        }
    });

    uploadForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(uploadForm);

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                fileInfo.innerHTML = `
                    <p>File Name: ${data.filename}</p>
                    <p>File Size: ${data.filesize} bytes</p>
                    <p>File Type: ${data.filetype}</p>
                `;
            } else {
                fileInfo.innerHTML = '<p>Error uploading file</p>';
            }
        } catch (error) {
            console.error('Error:', error);
            fileInfo.innerHTML = '<p>Error uploading file</p>';
        }
    });
});
