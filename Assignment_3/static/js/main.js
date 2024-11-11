document.getElementById('inputType').addEventListener('change', function(e) {
    const inputType = e.target.value;
    updateInputUI(inputType);
});

function updateInputUI(inputType) {
    // Hide all input displays and option groups
    document.querySelectorAll('#inputDisplay > *').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.option-group').forEach(el => el.style.display = 'none');
    
    // Update file input accept attribute
    const fileInput = document.getElementById('dataFile');
    switch(inputType) {
        case 'text':
            fileInput.accept = '.txt';
            document.getElementById('inputText').style.display = 'block';
            document.getElementById('textPreprocessing').style.display = 'block';
            document.getElementById('textAugmentation').style.display = 'block';
            break;
        case 'image':
            fileInput.accept = 'image/*';
            document.getElementById('inputImage').style.display = 'block';
            document.getElementById('imagePreprocessing').style.display = 'block';
            document.getElementById('imageAugmentation').style.display = 'block';
            break;
        case 'audio':
            fileInput.accept = 'audio/*';
            document.getElementById('inputAudio').style.display = 'block';
            document.getElementById('audioPreprocessing').style.display = 'block';
            document.getElementById('audioAugmentation').style.display = 'block';
            break;
        case '3d':
            fileInput.accept = '.ply,.pcd,.xyz';
            document.getElementById('pointCloudCanvas').style.display = 'block';
            document.getElementById('pointCloudPreprocessing').style.display = 'block';
            document.getElementById('pointCloudAugmentation').style.display = 'block';
            break;
    }
}

document.getElementById('dataFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const inputType = document.getElementById('inputType').value;
    
    if (!file) return;

    switch(inputType) {
        case 'text':
            handleTextFile(file);
            break;
        case 'image':
            handleImageFile(file);
            break;
        case 'audio':
            handleAudioFile(file);
            break;
        case '3d':
            handle3DFile(file);
            break;
    }
});

function handleTextFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('inputText').value = e.target.result;
        processData();
    };
    reader.readAsText(file);
}

function handleImageFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = document.getElementById('inputImage');
        img.src = e.target.result;
        img.onload = function() {
            processData();
        };
    };
    reader.readAsDataURL(file);
}

function handleAudioFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const audio = document.getElementById('inputAudio');
        audio.src = e.target.result;
        processData();
    };
    reader.readAsDataURL(file);
}

function handle3DFile(file) {
    // Implementation for 3D point cloud files
    // This would require a specific 3D visualization library
    console.log('3D file handling not implemented yet');
}

document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', processData);
});

function processData() {
    const inputType = document.getElementById('inputType').value;
    const preprocessingSteps = Array.from(document.querySelectorAll('input[name="preprocessing"]:checked'))
        .map(cb => cb.value);
    const augmentationSteps = Array.from(document.querySelectorAll('input[name="augmentation"]:checked'))
        .map(cb => cb.value);

    let formData = new FormData();
    const file = document.getElementById('dataFile').files[0];
    if (!file) return;

    formData.append('file', file);
    formData.append('input_type', inputType);
    formData.append('preprocessing_steps', JSON.stringify(preprocessingSteps));
    formData.append('augmentation_steps', JSON.stringify(augmentationSteps));

    fetch('/process', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        updateOutputDisplay(data, inputType);
    });
}

function updateOutputDisplay(data, inputType) {
    switch(inputType) {
        case 'text':
            document.getElementById('preprocessedText').value = data.preprocessed_text;
            document.getElementById('augmentedText').value = data.augmented_text;
            highlightChanges(data.changes);
            break;
        case 'image':
            document.getElementById('preprocessedImage').src = data.preprocessed_image;
            document.getElementById('augmentedImage').src = data.augmented_image;
            break;
        case 'audio':
            document.getElementById('preprocessedAudio').src = data.preprocessed_audio;
            document.getElementById('augmentedAudio').src = data.augmented_audio;
            break;
        case '3d':
            // Implementation for 3D visualization
            break;
    }
}

function highlightChanges(changes) {
    const augmentedText = document.getElementById('augmentedText');
    const text = augmentedText.value;
    
    const tempDiv = document.createElement('div');
    let lastIndex = 0;
    
    changes.forEach(change => {
        const before = text.substring(lastIndex, change.start);
        const highlighted = text.substring(change.start, change.end);
        
        tempDiv.appendChild(document.createTextNode(before));
        const span = document.createElement('span');
        span.className = 'highlight';
        span.textContent = highlighted;
        tempDiv.appendChild(span);
        
        lastIndex = change.end;
    });
    
    tempDiv.appendChild(document.createTextNode(text.substring(lastIndex)));
    augmentedText.innerHTML = tempDiv.innerHTML;
}

// Initialize UI for default input type
updateInputUI(document.getElementById('inputType').value);