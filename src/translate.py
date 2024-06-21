import argparse
import os
import logging
from transformers import MarianMTModel, MarianTokenizer, GenerationConfig

logging.getLogger("transformers").setLevel(logging.ERROR)

def load_model(model_id, models_dir):
    model_dir = os.path.join(models_dir, model_id.replace("/", "-"))
    if os.path.exists(model_dir) and os.listdir(model_dir):
        #print(f"Model '{model_id}' found locally. Loading...")
        model = MarianMTModel.from_pretrained(model_dir)
        tokenizer = MarianTokenizer.from_pretrained(model_dir)
    else:
        try:
            print(f"Model '{model_id}' not found locally or directory is empty. Downloading and saving...")
            model = MarianMTModel.from_pretrained(model_id)
            tokenizer = MarianTokenizer.from_pretrained(model_id)
            model.save_pretrained(model_dir)
            tokenizer.save_pretrained(model_dir)
            print(f"Model '{model_id}' successfully downloaded and saved.")
        except Exception as e:
            raise RuntimeError(f"Model '{model_id}' not found on Hugging Face. Please check the model identifier.") from e

    return model, tokenizer

def translate_text(model, tokenizer, input_text):
    inputs = tokenizer(input_text, return_tensors="pt")
    
    if not hasattr(model.config, 'generation'):
        model.config.generation = GenerationConfig(max_length=50, num_beams=4, early_stopping=True)
    
    translated = model.generate(**inputs)
    translated_text = tokenizer.decode(translated[0], skip_special_tokens=True)
    
    return translated_text

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Translate text using MarianMTModel")
    parser.add_argument('--model', type=str, required=True, help="Model ID from Hugging Face (e.g., Helsinki-NLP/opus-mt-ar-en)")
    parser.add_argument('--text', type=str, required=True, help="Text to translate")
    parser.add_argument('--models-dir', type=str, default='models', help="Path to models directory (default: 'models')")
    args = parser.parse_args()

    model_id = args.model
    input_text = args.text
    models_dir = args.models_dir

    try:
        model, tokenizer = load_model(model_id, models_dir)
        
        # Ensure model is loaded and ready before translation
        translated_text = translate_text(model, tokenizer, input_text)
    
        print(translated_text)

    except Exception as e:
        print(f"Error loading model or translating text: {e}")
