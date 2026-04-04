import torchaudio
import torchaudio.transforms as T
import torch
import os
import json
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import normalize

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
SONG_FOLDER = "songs"
songs = []
vectors = []

mfcc_transform = T.MFCC(sample_rate=22050, n_mfcc=20).to(device)

def extract_features(file_path):
    waveform, sr = torchaudio.load(file_path)
    waveform = waveform.mean(dim=0).unsqueeze(0).to(device)  # Mono

    # Resample if needed
    if sr != 22050:
        resampler = T.Resample(orig_freq=sr, new_freq=22050).to(device)
        waveform = resampler(waveform)
        sr = 22050

    mfcc = mfcc_transform(waveform)  # (1, 20, time)
    mfcc_mean = mfcc.mean(dim=2).squeeze().cpu().numpy()  # shape: (20,)

    return mfcc_mean.tolist()  
# Extract
for fname in os.listdir(SONG_FOLDER):
    if fname.endswith(".mp3"):
        path = os.path.join(SONG_FOLDER, fname)
        try:
            vec = extract_features(path)
            vectors.append(vec)
            songs.append({"filename": fname, "features": vec})
            print(f"{fname}")
        except Exception as e:
            print(f" {fname}: {e}")

# Cosine similarity
if len(vectors) > 1:
    mat = normalize(vectors)
    sim = cosine_similarity(mat)
    for i, song in enumerate(songs):
        top = sim[i].argsort()[::-1][1:6]
        song["similar_songs"] = [
            {"filename": songs[j]["filename"], "similarity": round(float(sim[i][j]), 4)}
            for j in top
        ]
else:
    for song in songs:
        song["similar_songs"] = []

# Save
for song in songs:
    del song["features"]
with open("songs_similarity.json", "w") as f:
    json.dump(songs, f, indent=4)

print(f"\n Saved similarities for {len(songs)} songs.")
