import os
import glob
import numpy as np
import librosa
from sklearn.metrics.pairwise import cosine_similarity
from transformers import pipeline
import torch
import warnings

# Suppress warnings from librosa and other libraries for a cleaner output
warnings.filterwarnings('ignore')

# --- CONFIGURATION ---
SONGS_FOLDER = "songs"
TOP_N_SIMILAR = 5 # Number of similar songs to find for each track

# --- 1. INITIALIZE THE AI MODEL FOR GENRE CLASSIFICATION ---
# We use a pre-trained model from Hugging Face specialized in music genre classification.
# The pipeline handles all the complex steps of converting audio to a format the model understands.
# The model will be downloaded automatically on the first run.
print("Loading music genre classification model...")
# Using a model fine-tuned on the GTZAN music genre dataset
# Alternative model: 'dima-vorobiev/music-genres-finetuned'
genre_classifier = pipeline("audio-classification", model="sanchit-gandhi/distilhubert-finetuned-gtzan")
print("Model loaded successfully.\n")


def extract_features(file_path):
    """
    Extracts aggregated MFCC features from an audio file.
    These features serve as the 'fingerprint' for similarity comparison.
    """
    try:
        # Load the audio file. `sr=None` preserves the original sample rate.
        # `duration=60` limits loading to the first 60 seconds to speed up processing.
        audio, sr = librosa.load(file_path, sr=None, duration=60)

        # Extract MFCCs (Mel-Frequency Cepstral Coefficients)
        mfccs = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=13)

        # To get a single feature vector for the entire song, we aggregate the MFCCs.
        # Taking the mean across the time axis is a common and effective approach.
        aggregated_mfccs = np.mean(mfccs, axis=1)

        return aggregated_mfccs
    except Exception as e:
        print(f"Error processing {os.path.basename(file_path)}: {e}")
        return None

def classify_genre(file_path, classifier):
    """
    Classifies the genre of an audio file using the loaded Hugging Face pipeline.
    """
    try:
        # The pipeline takes the file path directly and returns a list of predictions
        predictions = classifier(file_path)
        # The top prediction is the most likely genre
        top_prediction = predictions[0]
        return top_prediction['label']
    except Exception as e:
        print(f"Error classifying genre for {os.path.basename(file_path)}: {e}")
        return "Unknown"

def main():
    """
    Main function to run the analysis.
    """
    # Find all supported audio files in the folder
    song_files = glob.glob(os.path.join(SONGS_FOLDER, "*.mp3")) + \
                 glob.glob(os.path.join(SONGS_FOLDER, "*.wav")) + \
                 glob.glob(os.path.join(SONGS_FOLDER, "*.flac"))

    if not song_files:
        print(f"No audio files found in the '{SONGS_FOLDER}' directory.")
        print("Please add some .mp3 or .wav files and run again.")
        # Create folder if it doesn't exist
        if not os.path.exists(SONGS_FOLDER):
            os.makedirs(SONGS_FOLDER)
        return

    print(f"Found {len(song_files)} songs to analyze.")

    # --- 2. FEATURE EXTRACTION AND CLASSIFICATION (FIRST PASS) ---
    # We process each song once to get its features and genre.
    song_data = {}
    feature_list = []
    filenames = []

    for file_path in song_files:
        filename = os.path.basename(file_path)
        print(f"\nProcessing: {filename}")

        # Extract features for similarity
        features = extract_features(file_path)
        if features is None:
            continue

        # Classify genre using the AI model
        genre = classify_genre(file_path, genre_classifier)
        print(f"  > Predicted Genre: {genre}")

        # Store the data
        song_data[filename] = {
            "path": file_path,
            "features": features,
            "genre": genre
        }
        feature_list.append(features)
        filenames.append(filename)

    # --- 3. CALCULATE COSINE SIMILARITY ---
    # We now have a list of feature vectors. We can compare them all against each other.
    if not feature_list:
        print("Could not extract features from any songs. Exiting.")
        return

    # Convert the list of feature arrays into a 2D numpy matrix
    feature_matrix = np.array(feature_list)

    # Calculate the cosine similarity between all songs in one go
    # The result is a matrix where similarity_matrix[i][j] is the similarity
    # between song i and song j.
    print("\nCalculating similarities between all songs...")
    similarity_matrix = cosine_similarity(feature_matrix)
    print("Similarity calculation complete.\n")

    # --- 4. FIND AND DISPLAY TOP SIMILAR SONGS ---
    print("--- Analysis Results ---")
    for i, source_filename in enumerate(filenames):
        # Get the similarity scores for the current song against all others
        similarity_scores = similarity_matrix[i]

        # Pair scores with filenames
        similar_songs = list(zip(filenames, similarity_scores))

        # Sort by similarity score in descending order
        similar_songs.sort(key=lambda item: item[1], reverse=True)

        # The most similar song will be the song itself (score=1.0), so we skip it.
        # We take the next TOP_N_SIMILAR items from the sorted list.
        top_similar = similar_songs[1 : TOP_N_SIMILAR + 1]

        # Store the results back into our main data dictionary
        song_data[source_filename]['similar_songs'] = top_similar


    # --- 5. PRINT THE FINAL REPORT ---
    for filename, data in song_data.items():
        print("="*50)
        print(f"Song: {filename}")
        print(f"Predicted Genre: {data['genre']}")
        print(f"\nTop {TOP_N_SIMILAR} similar songs:")
        if 'similar_songs' in data and data['similar_songs']:
            for similar_song, score in data['similar_songs']:
                print(f"  - {similar_song} (Similarity: {score:.4f})")
        else:
            print("  - Not enough other songs to compare.")
        print("="*50 + "\n")


if __name__ == "__main__":
    main()