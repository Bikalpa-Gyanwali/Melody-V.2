import os
import json
import torch
import torchaudio
import torchaudio.transforms as T
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import normalize

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
SONG_FOLDER = "songs"
songs = []
features_list = []

# Safe MelSpec config (no warnings)
mel_spec_transform = T.MelSpectrogram(
    sample_rate=22050,
    n_fft=2048,
    win_length=1024,
    hop_length=512,
    n_mels=40
).to(device)

mfcc_transform = T.MFCC(sample_rate=22050, n_mfcc=20).to(device)
resampler = T.Resample(orig_freq=44100, new_freq=22050).to(device)

def extract_features(path):
    waveform, sr = torchaudio.load(path)
    waveform = waveform.to(device)

    if waveform.shape[0] > 1:
        waveform = waveform.mean(dim=0, keepdim=True)

    # Resample if needed
    if sr != 22050:
        waveform = resampler(waveform)

    # ZCR
    zero_crossings = (waveform[:, 1:] * waveform[:, :-1] < 0.0).float()
    zcr = zero_crossings.mean().item()

    # Energy
    energy = torch.mean(waveform ** 2).item()

    # MFCC
    mfcc = mfcc_transform(waveform).squeeze(0)
    mfcc_mean = mfcc.mean(dim=1).cpu().numpy()

    # Mel Spectrogram
    mel_spec = mel_spec_transform(waveform)

    # Chroma approximation (mean energy from first 12 bands)
    chroma = mel_spec[:12].mean(dim=1).cpu().numpy()

    # Spectral contrast approximation (std dev across time for each band)
    spectral_contrast = mel_spec.std(dim=1).cpu().numpy()[:7]

    # Tonnetz approximation (delta of MFCC)
    tonnetz = torchaudio.functional.compute_deltas(mfcc.unsqueeze(0)).mean(dim=2).squeeze().cpu().numpy()[:6]

    # Final vector
    vector = np.concatenate([
    np.array([zcr, energy]).flatten(),
    mfcc_mean.flatten(),
    chroma.flatten(),
    spectral_contrast.flatten(),
    tonnetz.flatten()
]).astype(np.float32)


    return vector.tolist()

# Scan folder and extract
for fname in os.listdir(SONG_FOLDER):
    if fname.endswith(".mp3"):
        path = os.path.join(SONG_FOLDER, fname)
        try:
            vec = extract_features(path)
            features_list.append(vec)
            songs.append({
                "filename": fname,
                "features": vec
            })
            print(f"✅ {fname}")
        except Exception as e:
            print(f"❌ {fname}: {e}")

# Cosine similarity
if len(features_list) > 1:
    feature_matrix = normalize(np.array(features_list))
    similarity_matrix = cosine_similarity(feature_matrix)

    for i, song in enumerate(songs):
        sims = similarity_matrix[i]
        top_indices = sims.argsort()[::-1][1:6]
        song["similar_songs"] = [{
            "filename": songs[j]["filename"],
            "similarity": round(float(sims[j]), 4)
        } for j in top_indices]
else:
    for song in songs:
        song["similar_songs"] = []

# Clean output
for s in songs:
    del s["features"]

with open("songs_similarity.json", "w", encoding="utf-8") as f:
    json.dump(songs, f, indent=4)

print(f"\n🎯 Processed {len(songs)} songs. Saved to 'songs_similarity.json'.")
