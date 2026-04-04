import React, { useState, useEffect } from 'react';
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
    window.dispatchEvent(new Event('storage')); // notify other tabs/components
  }, [songs]);

  useEffect(() => {
    localStorage.setItem('melody-custom-id-counter', idCounter.toString());
  }, [idCounter]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addSong = (e) => {
    e.preventDefault();
      if (!form.title || !form.filename) return;
      const { filename, ...rest } = form;
    const newSong = {
        ...rest,
        url: `/songs/${filename.replace(/^\/+/, '')}`,
      id: `C${String(idCounter).padStart(3, '0')}`,
        moods: form.moods.split(',').map(m => m.trim()).filter(Boolean),
        cover: `https://placehold.co/300x300/111111/ffffff?text=${encodeURIComponent(form.title)}`

    };
    setSongs([...songs, newSong]);
    setIdCounter(idCounter + 1);
    setForm(emptySong);
  };

  const removeSong = (index) => {
    const updated = songs.filter((_, i) => i !== index);
    setSongs(updated);
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Admin Panel</h2>
      <button onClick={onBack} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded">
        Back
      </button>

      <form onSubmit={addSong} className="space-y-2 max-w-md mt-4">

        {['title', 'artist', 'genre', 'moods', 'filename'].map(field => (
          <input
            key={field}
            name={field}
            value={form[field]}
            onChange={handleChange}
                placeholder={
                    field === 'filename'
                        ? 'Filename (e.g., song.mp3)'
                        : field.charAt(0).toUpperCase() + field.slice(1)
                }
            className="w-full px-3 py-2 bg-gray-800 rounded"
          />
        ))}
        <button type="submit" className="bg-cyan-500 hover:bg-cyan-400 px-4 py-2 rounded text-gray-900 font-semibold">
          Add Song
        </button>
      </form>

      <div>
        <h3 className="text-xl font-semibold mb-2">Custom Songs</h3>
        <ul className="space-y-2">
          {songs.map((s, idx) => (
            <li key={s.id} className="flex justify-between items-center bg-gray-800 p-2 rounded">
              <span>{s.title} - {s.artist}</span>
              <button onClick={() => removeSong(idx)} className="bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded">
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
