import nlpaug.augmenter.word as naw

def augment_text(text: str) -> str:
    # Initialize augmenter
    aug = naw.SynonymAug(aug_src='wordnet')
    
    # Augment text
    augmented_text = aug.augment(text)[0]
    
    # Print for debugging
    print("Original:", text)
    print("Augmented:", augmented_text)
    
    return augmented_text 