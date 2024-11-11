import numpy as np
from PIL import Image, ImageEnhance
import nltk
from nltk.corpus import wordnet
import random
import librosa

# Download required NLTK data
nltk.download('wordnet')
nltk.download('averaged_perceptron_tagger')

def augment_image(image):
    """
    Augment image data with basic transformations:
    - Random rotation
    - Random brightness adjustment
    - Random contrast adjustment
    """
    # Convert to RGB if needed
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    # Random rotation
    angle = np.random.randint(-30, 30)
    image = image.rotate(angle)
    
    # Random brightness
    brightness_factor = np.random.uniform(0.8, 1.2)
    enhancer = ImageEnhance.Brightness(image)
    image = enhancer.enhance(brightness_factor)
    
    # Random contrast
    contrast_factor = np.random.uniform(0.8, 1.2)
    enhancer = ImageEnhance.Contrast(image)
    image = enhancer.enhance(contrast_factor)
    
    return image

def augment_text(text):
    """
    Augment text data using:
    - Synonym replacement
    - Random word insertion
    - Random word deletion
    """
    words = text.split()
    augmented_words = words.copy()
    changes = []
    
    # Synonym replacement
    for i, word in enumerate(words):
        if random.random() < 0.2:  # 20% chance to replace word
            synonyms = []
            for syn in wordnet.synsets(word):
                for lemma in syn.lemmas():
                    if lemma.name() != word:
                        synonyms.append(lemma.name())
            if synonyms:
                new_word = random.choice(synonyms)
                changes.append(f"Replaced '{word}' with '{new_word}'")
                augmented_words[i] = new_word
    
    # Random word insertion
    if len(words) > 3:
        insert_pos = random.randint(0, len(augmented_words))
        insert_word = random.choice(words)
        augmented_words.insert(insert_pos, insert_word)
        changes.append(f"Inserted '{insert_word}' at position {insert_pos}")
    
    # Random word deletion
    if len(augmented_words) > 4:
        delete_pos = random.randint(0, len(augmented_words)-1)
        deleted_word = augmented_words.pop(delete_pos)
        changes.append(f"Deleted '{deleted_word}' from position {delete_pos}")
    
    return ' '.join(augmented_words), changes

def augment_audio(audio_data):
    """
    Augment audio data using:
    - Time stretching
    - Pitch shifting
    - Adding noise
    """
    # Time stretching
    stretch_factor = np.random.uniform(0.8, 1.2)
    audio_stretched = librosa.effects.time_stretch(audio_data, rate=stretch_factor)
    
    # Pitch shifting
    n_steps = np.random.randint(-2, 3)
    audio_pitched = librosa.effects.pitch_shift(audio_stretched, sr=22050, n_steps=n_steps)
    
    # Add random noise
    noise_factor = 0.005
    noise = np.random.normal(0, noise_factor, len(audio_pitched))
    augmented_audio = audio_pitched + noise
    
    # Normalize
    augmented_audio = augmented_audio / np.max(np.abs(augmented_audio))
    
    return augmented_audio

def augment_3d(points):
    """
    Augment 3D point cloud using:
    - Random rotation
    - Random scaling
    - Random translation
    - Random jittering
    """
    augmented_points = points.copy()
    
    # Random rotation around z-axis
    theta = np.random.uniform(0, 2*np.pi)
    rotation_matrix = np.array([
        [np.cos(theta), -np.sin(theta), 0],
        [np.sin(theta), np.cos(theta), 0],
        [0, 0, 1]
    ])
    augmented_points = np.dot(augmented_points, rotation_matrix)
    
    # Random scaling
    scale_factor = np.random.uniform(0.8, 1.2)
    augmented_points *= scale_factor
    
    # Random translation
    translation = np.random.uniform(-0.1, 0.1, size=3)
    augmented_points += translation
    
    # Random jittering
    jitter = np.random.normal(0, 0.02, size=augmented_points.shape)
    augmented_points += jitter
    
    return augmented_points