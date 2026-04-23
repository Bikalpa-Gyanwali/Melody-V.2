import React, { useEffect, useState } from 'react';
import { loadCustomSongs, saveCustomSongs } from './data';

const emptySong = { title: '', artist: '', genre: '', moods: '', filename: '' };

export default function AdminPanel({ onBack }) {
  const [songs, setSongs] = useState(loadCustomSongs());
  const [form, setForm] = useState(emptySong);
  const [idCounter, setIdCounter] = useState(() => {
    const stored = localStorage.getItem('melody-custom-id-counter');
    const parsed = stored ? parseInt(stored, 10) : NaN;
    return Number.isNaN(parsed) ? songs.length : parsed;
  });

  useEffect(() => {
    saveCustomSongs(songs);
    window.dispatchEvent(new Event('storage'));
  }, [songs]);

  useEffect(() => {
    localStorage.setItem('melody-custom-id-counter', idCounter.toString());
  }, [idCounter]);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const addSong = (event) => {
    event.preventDefault();
    if (!form.title || !form.filename) {
      return;
    }

    const { filename, ...rest } = form;
    const newSong = {
      ...rest,
      url: `/songs/${filename.replace(/^\/+/, '')}`,
      id: `C${String(idCounter).padStart(3, '0')}`,
      moods: form.moods.split(',').map((mood) => mood.trim()).filter(Boolean),
      cover: `https://placehold.co/300x300/101828/e2e8f0?text=${encodeURIComponent(form.title)}`
    };

    setSongs((current) => [...current, newSong]);
    setIdCounter((current) => current + 1);
    setForm(emptySong);
  };

  const removeSong = (index) => {
    setSongs((current) => current.filter((_, songIndex) => songIndex !== index));
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07111f] px-4 py-8 md:px-8">
      <div className="absolute left-[-8rem] top-0 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute bottom-0 right-[-8rem] h-80 w-80 rounded-full bg-amber-300/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="glass-panel mb-8 flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="capsule-chip mb-4">Admin studio</p>
            <h1 className="font-display text-4xl text-white">Song management</h1>
            <p className="mt-3 text-slate-300">
              Add custom songs, shape your catalog, and keep the app feeling curated.
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="rounded-2xl border border-white/10 bg-white/8 px-5 py-3 text-sm text-slate-100 transition hover:bg-white/12"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <section className="glass-panel p-6">
            <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Catalog form</p>
            <h2 className="mt-2 font-display text-3xl text-white">Add a new track</h2>

            <form onSubmit={addSong} className="mt-6 space-y-4">
              {['title', 'artist', 'genre', 'moods', 'filename'].map((field) => (
                <label key={field} className="block">
                  <span className="mb-2 block text-sm text-slate-300">
                    {field === 'filename' ? 'Audio filename' : field.charAt(0).toUpperCase() + field.slice(1)}
                  </span>
                  <input
                    name={field}
                    value={form[field]}
                    onChange={handleChange}
                    placeholder={
                      field === 'filename'
                        ? 'Filename inside public/songs, for example song.mp3'
                        : field === 'moods'
                        ? 'Comma-separated moods, for example happy, focus'
                        : `Enter ${field}`
                    }
                    className="auth-input"
                  />
                </label>
              ))}

              <button
                type="submit"
                className="w-full rounded-2xl bg-[linear-gradient(135deg,#f7d06b_0%,#7ce3d7_100%)] px-5 py-4 font-semibold text-slate-950 transition hover:scale-[1.01]"
              >
                Add Song to Catalog
              </button>
            </form>
          </section>

          <section className="glass-panel p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Custom library</p>
                <h2 className="mt-2 font-display text-3xl text-white">Your added songs</h2>
              </div>
              <div className="rounded-[20px] border border-white/10 bg-white/6 px-4 py-3 text-sm text-slate-200">
                {songs.length} custom tracks
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              {songs.length === 0 && (
                <div className="rounded-[24px] border border-dashed border-white/12 bg-white/4 p-6 text-slate-400">
                  No custom songs yet. Add one from the form and it will appear here instantly.
                </div>
              )}

              {songs.map((song, index) => (
                <div key={song.id} className="rounded-[26px] border border-white/10 bg-white/4 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-semibold text-white">{song.title}</h3>
                        <span className="rounded-full bg-cyan-400/12 px-3 py-1 text-xs uppercase tracking-[0.25em] text-cyan-200">
                          {song.genre || 'Unknown genre'}
                        </span>
                      </div>
                      <p className="mt-2 text-slate-300">{song.artist || 'Unknown artist'}</p>
                      <p className="mt-2 text-sm text-slate-500">{song.url}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {song.moods?.map((mood) => (
                          <span key={`${song.id}-${mood}`} className="rounded-full bg-white/8 px-3 py-1 text-xs text-slate-300">
                            {mood}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeSong(index)}
                      className="rounded-2xl bg-rose-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-rose-400"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
