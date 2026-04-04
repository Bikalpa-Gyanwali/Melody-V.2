import os
import json
import numpy as np
import librosa
import traceback

SONG_FOLDER = "songs"  # <-- Make sure this folder contains your .mp3 files
OUTPUT_FILE = "song_vectors.json"

def extract_vector(path):
    y, sr = librosa.load(path, sr=None)

    # Extract features
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    zcr = np.mean(librosa.feature.zero_crossing_rate(y))
    energy = np.mean(librosa.feature.rms(y=y))
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    mfcc_mean = np.mean(mfcc, axis=1)

    # Combine features and convert all to Python float
    return [float(x) for x in np.concatenate((np.array([tempo, zcr, energy]), mfcc_mean))]

output = []
for fname in os.listdir(SONG_FOLDER):
    if fname.endswith(".mp3"):
        path = os.path.join(SONG_FOLDER, fname)
        try:
            vec = extract_vector(path)
            output.append({
                "filename": fname,
                "vector": vec
            })
            print(f"✅ {fname}")
        except Exception as e:
            print(f"❌ {fname}: {e}")
            traceback.print_exc()

# Save vectors
with open(OUTPUT_FILE, "w") as f:
    json.dump(output, f, indent=4)

print(f"\n🎯 Saved feature vectors to '{OUTPUT_FILE}'")
