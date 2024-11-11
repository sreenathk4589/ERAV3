console.log('main.js starting to load');

function updateDisplayType() {
    console.log('Updating display type');
    const inputType = document.getElementById('input-type').value;
    
    // Hide all containers first
    const containers = {
        text: document.getElementById('textContainer'),
        image: document.getElementById('imageContainer'),
        audio: document.getElementById('audioContainer'),
        '3d': document.getElementById('3dContainer')
    };
    
    console.log('Input type selected:', inputType);
    
    // Hide all containers
    Object.values(containers).forEach(container => {
        if (container) {
            container.style.display = 'none';
        }
    });
    
    // Show the selected container
    if (containers[inputType]) {
        containers[inputType].style.display = 'block';
        console.log(`Showing ${inputType} container`);
    }
    
    // Update file input accept attribute
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        switch(inputType) {
            case 'text':
                fileInput.accept = '.txt';
                break;
            case 'image':
                fileInput.accept = 'image/*';
                break;
            case 'audio':
                fileInput.accept = 'audio/*';
                break;
            case '3d':
                fileInput.accept = '.ply,.pcd,.xyz';
                break;
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded event fired in main.js');
    
    const inputTypeSelect = document.getElementById('input-type');
    if (inputTypeSelect) {
        inputTypeSelect.addEventListener('change', updateDisplayType);
        // Call it once to set initial state
        updateDisplayType();
    }
    
    // File input change handler
    const fileInput = document.getElementById('file-input');
    const uploadButton = document.getElementById('uploadButton');
    
    fileInput.addEventListener('change', function(e) {
        uploadButton.disabled = !e.target.files.length;
    });
    
    // Upload button handler
    uploadButton.addEventListener('click', function() {
        const file = fileInput.files[0];
        if (file) {
            handleFileUpload(file);
        }
    });
    
    // Clear button handler
    const clearButton = document.getElementById('clearButton');
    clearButton.addEventListener('click', clearAll);
    
    // Other button handlers
    const preprocessButton = document.getElementById('preprocessButton');
    const augmentButton = document.getElementById('augmentButton');
    
    if (preprocessButton) {
        preprocessButton.addEventListener('click', () => processData('preprocess'));
    }
    
    if (augmentButton) {
        augmentButton.addEventListener('click', () => processData('augment'));
    }
});

function handleFileUpload(file) {
    const inputType = document.getElementById('input-type').value;
    if (!inputType) {
        showError('Please select an input type first');
        return;
    }
    
    // Show the appropriate container
    updateDisplayType();
    
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
    
    // Enable process buttons after successful upload
    document.getElementById('preprocessButton').disabled = false;
    document.getElementById('augmentButton').disabled = false;
}

function clearAll() {
    // Clear file input
    const fileInput = document.getElementById('file-input');
    fileInput.value = '';
    
    // Disable buttons
    document.getElementById('uploadButton').disabled = true;
    document.getElementById('preprocessButton').disabled = true;
    document.getElementById('augmentButton').disabled = true;
    
    // Clear all displays
    document.getElementById('inputText').value = '';
    document.getElementById('preprocessedText').value = '';
    document.getElementById('augmentedText').value = '';
    
    const images = ['inputImage', 'preprocessedImage', 'augmentedImage'];
    images.forEach(id => {
        const img = document.getElementById(id);
        if (img) img.src = '';
    });
    
    const audios = ['inputAudio', 'preprocessedAudio', 'augmentedAudio'];
    audios.forEach(id => {
        const audio = document.getElementById(id);
        if (audio) audio.src = '';
    });
    
    // Clear info displays
    const infoDisplay = document.getElementById('preprocessingInfo');
    if (infoDisplay) infoDisplay.innerHTML = '';
    
    // Hide all containers except text (default)
    const containers = ['imageContainer', 'audioContainer', '3dContainer'];
    containers.forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            container.style.display = 'none';
        }
    });
    
    // Show text container
    const textContainer = document.getElementById('textContainer');
    if (textContainer) {
        textContainer.style.display = 'block';
    }
    
    // Reset input type selector
    const inputTypeSelect = document.getElementById('input-type');
    if (inputTypeSelect) {
        inputTypeSelect.value = '';
    }
}

// Add these file handling functions
function handleTextFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const inputText = document.getElementById('inputText');
        if (inputText) {
            inputText.value = e.target.result;
            console.log('Text file loaded:', e.target.result.substring(0, 100) + '...');
        }
    };
    reader.onerror = function(e) {
        console.error('Error reading text file:', e);
        showError('Error reading text file');
    };
    reader.readAsText(file);
}

function handleImageFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = document.getElementById('inputImage');
        if (img) {
            img.src = e.target.result;
            console.log('Image file loaded');
        }
    };
    reader.onerror = function(e) {
        console.error('Error reading image file:', e);
        showError('Error reading image file');
    };
    reader.readAsDataURL(file);
}

function handleAudioFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const audio = document.getElementById('inputAudio');
        if (audio) {
            audio.src = e.target.result;
            console.log('Audio file loaded');
        }
    };
    reader.onerror = function(e) {
        console.error('Error reading audio file:', e);
        showError('Error reading audio file');
    };
    reader.readAsDataURL(file);
}

function handle3DFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        console.log('3D file loaded');
        // Implementation for 3D visualization would go here
    };
    reader.onerror = function(e) {
        console.error('Error reading 3D file:', e);
        showError('Error reading 3D file');
    };
    reader.readAsArrayBuffer(file);
}

// Add error handling function
function showError(message) {
    console.error('Error:', message);
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
}

// Add the processData function that was missing
function processData(action) {
    console.log('Processing data:', action);
    
    const inputType = document.getElementById('input-type').value;
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];
    
    if (!file) {
        showError('Please select a file first');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('input_type', inputType);
    formData.append('action', action);
    
    // Show loading state
    const preprocessButton = document.getElementById('preprocessButton');
    const augmentButton = document.getElementById('augmentButton');
    if (preprocessButton) preprocessButton.disabled = true;
    if (augmentButton) augmentButton.disabled = true;
    
    fetch('/process', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Received response:', data);
        if (data.error) {
            throw new Error(data.error);
        }
        updateOutputDisplay(data, inputType, action);
    })
    .catch(error => {
        console.error('Error:', error);
        showError(error.message);
    })
    .finally(() => {
        // Reset button states
        if (preprocessButton) preprocessButton.disabled = false;
        if (augmentButton) augmentButton.disabled = false;
    });
}

// Add the updateOutputDisplay function
function updateOutputDisplay(data, inputType, action) {
    console.log('Updating display:', { data, inputType, action });
    
    if (action === 'preprocess') {
        switch(inputType) {
            case 'text':
                const textElement = document.getElementById('preprocessedText');
                if (textElement && data.preprocessed_text) {
                    textElement.value = data.preprocessed_text;
                }
                break;
            case 'image':
                const imgElement = document.getElementById('preprocessedImage');
                if (imgElement && data.preprocessed_image) {
                    imgElement.src = data.preprocessed_image;
                }
                const infoElement = document.getElementById('preprocessingInfo');
                if (infoElement && data.display_info) {
                    infoElement.innerHTML = `
                        Original Size: ${data.display_info.original_size.join('x')}<br>
                        Processed Size: ${data.display_info.processed_size.join('x')}<br>
                        Normalized Range: [${data.display_info.normalized_range.join(', ')}]
                    `;
                }
                break;
            case 'audio':
                const audioElement = document.getElementById('preprocessedAudio');
                const visElement = document.getElementById('audioVisualizations');
                if (audioElement && data.preprocessed_audio) {
                    audioElement.src = data.preprocessed_audio;
                }
                if (visElement && data.visualizations) {
                    visElement.src = data.visualizations;
                }
                break;
            case '3d':
                const visCanvas = document.getElementById('pointCloudVisualization');
                if (visCanvas && data.visualization) {
                    visCanvas.src = data.visualization;
                }
                break;
        }
    } else if (action === 'augment') {
        console.log('Handling augmentation for:', inputType);
        console.log('Received data:', data);
        
        switch(inputType) {
            case 'text':
                const textElement = document.getElementById('augmentedText');
                if (textElement && data.augmented_text) {
                    textElement.value = data.augmented_text;
                    console.log('Updated augmented text');
                } else {
                    console.error('Missing text element or augmented_text data');
                }
                break;
            case 'image':
                const imgElement = document.getElementById('augmentedImage');
                console.log('Image element found:', !!imgElement);
                console.log('Augmented image data:', data.augmented_image?.substring(0, 50) + '...');
                
                if (imgElement && data.augmented_image) {
                    imgElement.src = data.augmented_image;
                    console.log('Set augmented image src');
                    
                    // Add onload handler to verify image loading
                    imgElement.onload = () => {
                        console.log('Augmented image loaded successfully');
                    };
                    imgElement.onerror = (e) => {
                        console.error('Error loading augmented image:', e);
                    };
                } else {
                    console.error('Missing image element or augmented_image data');
                }
                break;
            case 'audio':
                const audioElement = document.getElementById('augmentedAudio');
                const visElement = document.getElementById('audioVisualizations');
                
                console.log('Audio elements found:', {
                    audio: !!audioElement,
                    visualization: !!visElement
                });
                console.log('Audio data received:', {
                    hasAudio: !!data.augmented_audio,
                    hasVis: !!data.visualizations
                });
                
                if (audioElement && data.augmented_audio) {
                    audioElement.src = data.augmented_audio;
                    console.log('Set augmented audio src');
                    
                    // Add event listeners for audio
                    audioElement.onloadeddata = () => {
                        console.log('Augmented audio loaded successfully');
                    };
                    audioElement.onerror = (e) => {
                        console.error('Error loading augmented audio:', e);
                    };
                }
                
                if (visElement && data.visualizations) {
                    visElement.src = data.visualizations;
                    console.log('Set audio visualization src');
                    
                    // Add onload handler for visualization
                    visElement.onload = () => {
                        console.log('Audio visualization loaded successfully');
                    };
                    visElement.onerror = (e) => {
                        console.error('Error loading audio visualization:', e);
                    };
                }
                break;
            case '3d':
                const visCanvas = document.getElementById('pointCloudVisualization');
                if (visCanvas && data.visualization) {
                    visCanvas.src = data.visualization;
                    console.log('Updated 3D visualization');
                }
                break;
        }
    }
    
    // Log final state
    console.log(`Finished updating display for ${inputType} ${action}`);
}