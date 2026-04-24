import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getAllSongs } from './data';
import { Player, SongCard } from './helpers';
import MoodDetector from './MoodDetector';

const LogoutIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const moodMeta = {
  happy: {
    accent: 'from-amber-300/35 via-orange-300/18 to-transparent'
  },
  sad: {
    accent: 'from-sky-300/28 via-blue-400/16 to-transparent'
  },
  energetic: {
    accent: 'from-rose-300/28 via-orange-300/20 to-transparent'
  },
  calm: {
    accent: 'from-emerald-300/28 via-cyan-300/14 to-transparent'
  },
  focus: {
    accent: 'from-violet-300/28 via-indigo-300/16 to-transparent'
  }
};

const sectionTitle = {
  happy: 'Happy picks',
  sad: 'Sad picks',
  energetic: 'Energy picks',
  calm: 'Calm picks',
  focus: 'Focus picks'
};

const formatMood = (mood) => mood.charAt(0).toUpperCase() + mood.slice(1);
const fallbackPlaylistName = 'First Light Mix';

const Section = React.memo(function Section({
  eyebrow,
  title,
  songs,
  likedSongs,
  currentSongId,
  isPlaying,
  onPlay,
  onLike,
  onAddToPlaylist
}) {
  if (!songs.length) {
    return null;
  }

  return (
    <section className="section-shell space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-slate-400">{eyebrow}</p>
          <h2 className="mt-2 font-display text-3xl text-white">{title}</h2>
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {songs.map((song) => (
          <SongCard
            key={song.id}
            song={song}
            onPlay={onPlay}
            onLike={onLike}
            onAddToPlaylist={onAddToPlaylist}
            isLiked={likedSongs.has(song.id)}
            isPlaying={isPlaying && currentSongId === song.id}
          />
        ))}
      </div>
    </section>
  );
});

export const HomePage = ({ user, onLogout, onManageSongs }) => {
  const [allSongs, setAllSongs] = useState(getAllSongs());
  const [activeMood, setActiveMood] = useState('happy');
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.72);
  const [likedSongs, setLikedSongs] = useState(new Set());
  const [playlists, setPlaylists] = useState([]);
  const [similarityData, setSimilarityData] = useState(null);
  const [collaborativeRecs, setCollaborativeRecs] = useState([]);
  const [itemBasedRecs, setItemBasedRecs] = useState([]);
  const [userBasedRecs, setUserBasedRecs] = useState([]);
  const [playlistName, setPlaylistName] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('');
  const [queueMessage, setQueueMessage] = useState('');

  const audioRef = useRef(null);

  const getFilenameFromUrl = useCallback((url) => url.split('/').pop().replace(/%20/g, ' '), []);

  useEffect(() => {
    const refreshSongs = () => setAllSongs(getAllSongs());
    window.addEventListener('storage', refreshSongs);
    return () => window.removeEventListener('storage', refreshSongs);
  }, []);

  useEffect(() => {
    const fetchSimilarities = async () => {
      try {
        const response = await fetch('/songs_similarity.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setSimilarityData(data);
      } catch (error) {
        console.error('Failed to load or parse songs_similarity.json:', error);
      }
    };

    fetchSimilarities();
  }, []);

  useEffect(() => {
    try {
      const savedLikes = localStorage.getItem(`melody-likedSongs-${user.username}`);
      if (savedLikes) {
        setLikedSongs(new Set(JSON.parse(savedLikes)));
      }

      const savedPlaylists = localStorage.getItem(`melody-playlists-${user.username}`);
      if (savedPlaylists) {
        const parsedPlaylists = JSON.parse(savedPlaylists);
        setPlaylists(parsedPlaylists);
        if (parsedPlaylists[0]) {
          setSelectedPlaylistId(parsedPlaylists[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load data from localStorage', error);
    }
  }, [user.username]);

  useEffect(() => {
    if (!audioRef.current) {
      return;
    }
    audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (currentSong) {
      setCurrentTime(0);
      setDuration(0);
    }
  }, [currentSong]);

  useEffect(() => {
    if (isPlaying && currentSong && audioRef.current) {
      audioRef.current.play().catch((error) => {
        if (error.name !== 'AbortError') {
          console.error('Audio play error:', error);
        }
      });
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [currentSong, isPlaying]);

  useEffect(() => {
    if (!currentSong) {
      setCollaborativeRecs([]);
      return;
    }

    const similarSongs = new Set();
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key.startsWith('melody-likedSongs-') && key !== `melody-likedSongs-${user.username}`) {
        const otherUserLikes = new Set(JSON.parse(localStorage.getItem(key)));
        if (otherUserLikes.has(currentSong.id)) {
          otherUserLikes.forEach((songId) => {
            if (songId !== currentSong.id && !likedSongs.has(songId)) {
              similarSongs.add(songId);
            }
          });
        }
      }
    }

    setCollaborativeRecs(allSongs.filter((song) => similarSongs.has(song.id)).slice(0, 6));
  }, [allSongs, currentSong, likedSongs, user.username]);

  useEffect(() => {
    if (!currentSong || !similarityData) {
      setItemBasedRecs([]);
      return;
    }

    const currentFilename = getFilenameFromUrl(currentSong.url);
    const songSimilarities = similarityData.find((song) => getFilenameFromUrl(song.filename) === currentFilename);

    if (!songSimilarities) {
      setItemBasedRecs([]);
      return;
    }

    const similarFilenames = songSimilarities.similar_songs.map((song) => getFilenameFromUrl(song.filename));
    const recommendedSongs = allSongs
      .filter(
        (song) =>
          similarFilenames.includes(getFilenameFromUrl(song.url)) &&
          !likedSongs.has(song.id) &&
          song.id !== currentSong.id
      )
      .sort(
        (a, b) =>
          similarFilenames.indexOf(getFilenameFromUrl(a.url)) -
          similarFilenames.indexOf(getFilenameFromUrl(b.url))
      );

    setItemBasedRecs(recommendedSongs.slice(0, 6));
  }, [allSongs, currentSong, getFilenameFromUrl, likedSongs, similarityData]);

  useEffect(() => {
    if (likedSongs.size === 0 || !similarityData) {
      setUserBasedRecs([]);
      return;
    }

    const recommendationsMap = new Map();
    const likedSongDetails = allSongs.filter((song) => likedSongs.has(song.id));

    likedSongDetails.forEach((likedSong) => {
      const likedFilename = getFilenameFromUrl(likedSong.url);
      const songSimilarities = similarityData.find((song) => getFilenameFromUrl(song.filename) === likedFilename);

      if (songSimilarities) {
        songSimilarities.similar_songs.forEach((similar) => {
          const similarSongObject = allSongs.find(
            (song) => getFilenameFromUrl(song.url) === getFilenameFromUrl(similar.filename)
          );

          if (similarSongObject && !likedSongs.has(similarSongObject.id)) {
            if (
              !recommendationsMap.has(similar.filename) ||
              recommendationsMap.get(similar.filename) < similar.similarity
            ) {
              recommendationsMap.set(similar.filename, similar.similarity);
            }
          }
        });
      }
    });

    const sortedRecs = Array.from(recommendationsMap.entries())
      .sort(([, aSimilarity], [, bSimilarity]) => bSimilarity - aSimilarity)
      .map(([filename]) => getFilenameFromUrl(filename));

    const finalRecommendations = allSongs
      .filter((song) => sortedRecs.includes(getFilenameFromUrl(song.url)))
      .sort(
        (a, b) =>
          sortedRecs.indexOf(getFilenameFromUrl(a.url)) -
          sortedRecs.indexOf(getFilenameFromUrl(b.url))
      );

    setUserBasedRecs(finalRecommendations.slice(0, 6));
  }, [allSongs, getFilenameFromUrl, likedSongs, similarityData]);

  useEffect(() => {
    if (queueMessage) {
      const timeout = setTimeout(() => setQueueMessage(''), 2400);
      return () => clearTimeout(timeout);
    }

    return undefined;
  }, [queueMessage]);

  const filteredSongs = useMemo(
    () => (activeMood ? allSongs.filter((song) => song.moods.includes(activeMood)) : allSongs),
    [activeMood, allSongs]
  );

  const selectedPlaylist = playlists.find((playlist) => playlist.id === selectedPlaylistId) || playlists[0] || null;
  const moodInfo = moodMeta[activeMood] || moodMeta.happy;
  const heroSong = currentSong || filteredSongs[0] || allSongs[0];
  const quickPicks = useMemo(() => filteredSongs.slice(0, 8), [filteredSongs]);
  const trendingSongs = useMemo(() => allSongs.slice(0, 8), [allSongs]);
  const playlistSongs = useMemo(() => {
    if (!selectedPlaylist) {
      return [];
    }
    return allSongs.filter((song) => selectedPlaylist.songs.includes(song.id));
  }, [allSongs, selectedPlaylist]);

  const createPlaylist = (event) => {
    event.preventDefault();
    const trimmedName = playlistName.trim();
    if (!trimmedName) {
      setQueueMessage('Give your playlist a name first.');
      return;
    }

    const newPlaylist = {
      id: `P${Date.now()}`,
      name: trimmedName,
      songs: []
    };

    const updatedPlaylists = [...playlists, newPlaylist];
    setPlaylists(updatedPlaylists);
    setSelectedPlaylistId(newPlaylist.id);
    setPlaylistName('');
    localStorage.setItem(`melody-playlists-${user.username}`, JSON.stringify(updatedPlaylists));
    setQueueMessage(`Playlist "${trimmedName}" created.`);
  };

  const ensurePlaylist = useCallback(() => {
    if (playlists.length > 0) {
      return selectedPlaylist || playlists[0];
    }

    const starterPlaylist = {
      id: `P${Date.now()}`,
      name: fallbackPlaylistName,
      songs: []
    };
    const updatedPlaylists = [starterPlaylist];
    setPlaylists(updatedPlaylists);
    setSelectedPlaylistId(starterPlaylist.id);
    localStorage.setItem(`melody-playlists-${user.username}`, JSON.stringify(updatedPlaylists));
    return starterPlaylist;
  }, [playlists, selectedPlaylist, user.username]);

  const toggleLikeSong = useCallback((songId) => {
    setLikedSongs((currentLikes) => {
      const updatedLikes = new Set(currentLikes);
      if (updatedLikes.has(songId)) {
        updatedLikes.delete(songId);
      } else {
        updatedLikes.add(songId);
      }

      localStorage.setItem(`melody-likedSongs-${user.username}`, JSON.stringify([...updatedLikes]));
      return updatedLikes;
    });
  }, [user.username]);

  const addSongToPlaylist = useCallback((songId) => {
    const targetPlaylist = ensurePlaylist();
    const song = allSongs.find((entry) => entry.id === songId);

    if (!targetPlaylist || !song) {
      return;
    }

    const updatedPlaylists = (playlists.length > 0 ? [...playlists] : [{ ...targetPlaylist }]).map((playlist) => ({ ...playlist }));
    const playlistIndex = updatedPlaylists.findIndex((playlist) => playlist.id === targetPlaylist.id);

    if (playlistIndex === -1) {
      return;
    }

    if (updatedPlaylists[playlistIndex].songs.includes(songId)) {
      setQueueMessage(`"${song.title}" is already in ${updatedPlaylists[playlistIndex].name}.`);
      return;
    }

    updatedPlaylists[playlistIndex].songs = [...updatedPlaylists[playlistIndex].songs, songId];
    setPlaylists(updatedPlaylists);
    setSelectedPlaylistId(updatedPlaylists[playlistIndex].id);
    localStorage.setItem(`melody-playlists-${user.username}`, JSON.stringify(updatedPlaylists));
    setQueueMessage(`Added "${song.title}" to ${updatedPlaylists[playlistIndex].name}.`);
  }, [allSongs, ensurePlaylist, playlists, user.username]);

  const handlePlay = useCallback((song) => {
    if (currentSong?.id === song.id && isPlaying) {
      setIsPlaying(false);
      return;
    }

    setCurrentSong(song);
    setIsPlaying(true);
  }, [currentSong, isPlaying]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying((current) => !current);
  }, []);

  const handleNext = useCallback(() => {
    if (!currentSong) {
      return;
    }
    const currentIndex = allSongs.findIndex((song) => song.id === currentSong.id);
    const nextIndex = (currentIndex + 1) % allSongs.length;
    setCurrentSong(allSongs[nextIndex]);
  }, [allSongs, currentSong]);

  const handlePrev = useCallback(() => {
    if (!currentSong) {
      return;
    }
    const currentIndex = allSongs.findIndex((song) => song.id === currentSong.id);
    const prevIndex = (currentIndex - 1 + allSongs.length) % allSongs.length;
    setCurrentSong(allSongs[prevIndex]);
  }, [allSongs, currentSong]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
      setCurrentTime(audioRef.current.currentTime || 0);
    }
  }, []);

  const handleSeek = useCallback((value) => {
    if (!audioRef.current) {
      return;
    }
    audioRef.current.currentTime = value;
    setCurrentTime(value);
  }, []);

  const handleVolumeChange = useCallback((value) => {
    setVolume(value);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050d17] pb-40">
      <div className={`absolute inset-x-0 top-0 h-[18rem] bg-gradient-to-br ${moodInfo.accent}`} />
      <div className="absolute left-[-6rem] top-6 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute right-[-9rem] top-20 h-[24rem] w-[24rem] rounded-full bg-amber-300/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-[1500px] px-4 py-6 md:px-8 md:py-8">
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="capsule-chip mb-3">Melody Music</p>
            <h1 className="font-display text-4xl text-white md:text-5xl">Welcome back, {user.username}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {Object.keys(moodMeta).map((mood) => (
              <button
                key={mood}
                type="button"
                onClick={() => setActiveMood(mood)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeMood === mood
                    ? 'bg-white text-slate-950 shadow-lg'
                    : 'border border-white/10 bg-white/6 text-slate-200 hover:bg-white/10'
                }`}
              >
                {formatMood(mood)}
              </button>
            ))}
            {onManageSongs && user.username === 'admin' && (
              <button
                type="button"
                onClick={onManageSongs}
                className="rounded-2xl border border-white/10 bg-white/8 px-5 py-3 text-sm text-slate-100 transition hover:bg-white/12"
              >
                Admin
              </button>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-2xl bg-rose-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-rose-400"
            >
              <LogoutIcon /> Logout
            </button>
          </div>
        </header>

        <section className="section-shell mb-8">
          <div className="mb-6 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Music first</p>
              <h2 className="mt-2 font-display text-3xl text-white">{sectionTitle[activeMood]}</h2>
            </div>
            {heroSong && (
              <button
                type="button"
                onClick={() => handlePlay(heroSong)}
                className="rounded-2xl bg-[linear-gradient(135deg,#f7d06b_0%,#7ce3d7_100%)] px-5 py-3 text-sm font-medium text-slate-950 transition hover:scale-[1.01]"
              >
                {isPlaying && currentSong?.id === heroSong.id ? 'Pause current pick' : `Play ${heroSong.title}`}
              </button>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {quickPicks.map((song) => (
              <SongCard
                key={`quick-${song.id}`}
                song={song}
                onPlay={handlePlay}
                onLike={toggleLikeSong}
                onAddToPlaylist={addSongToPlaylist}
                isLiked={likedSongs.has(song.id)}
                isPlaying={isPlaying && currentSong?.id === song.id}
              />
            ))}
          </div>
        </section>

        <section className="mb-8 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="section-shell">
            <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Utilities</p>
            <div className="mt-5 space-y-5">
              <MoodDetector onMoodSelect={setActiveMood} />

              <div className="rounded-[28px] border border-white/10 bg-white/4 p-5">
                <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Playlists</p>
                <form onSubmit={createPlaylist} className="mt-4 flex flex-col gap-3">
                  <input
                    type="text"
                    value={playlistName}
                    onChange={(event) => setPlaylistName(event.target.value)}
                    placeholder="Create a playlist name"
                    className="auth-input"
                  />
                  <button
                    type="submit"
                    className="rounded-2xl bg-white px-5 py-3 font-medium text-slate-950 transition hover:bg-slate-100"
                  >
                    Create playlist
                  </button>
                </form>

                {queueMessage && (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-slate-200">
                    {queueMessage}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="section-shell">
            <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Current playlist</p>
            <h2 className="mt-2 font-display text-3xl text-white">
              {selectedPlaylist ? selectedPlaylist.name : 'No playlist selected'}
            </h2>
            <div className="mt-6 grid gap-3">
              {playlistSongs.length === 0 && (
                <div className="rounded-[24px] border border-dashed border-white/12 bg-white/4 p-5 text-sm text-slate-400">
                  Add a few songs to your active playlist from the music cards above.
                </div>
              )}

              {playlistSongs.map((song) => (
                <div key={`${selectedPlaylist?.id}-${song.id}`} className="flex items-center gap-4 rounded-[24px] border border-white/10 bg-white/4 p-4">
                  <img
                    src={song.cover}
                    alt={song.title}
                    className="h-14 w-14 rounded-2xl object-cover"
                    onError={(event) => {
                      event.target.onerror = null;
                      event.target.src = 'https://placehold.co/300x300/122033/e2e8f0?text=Music';
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white">{song.title}</p>
                    <p className="truncate text-sm text-slate-400">{song.artist}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePlay(song)}
                    className="rounded-2xl border border-white/10 bg-white/8 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/12"
                  >
                    Play
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="space-y-10">
          <Section
            eyebrow="For you"
            title="Recommended from your likes"
            songs={userBasedRecs}
            likedSongs={likedSongs}
            currentSongId={currentSong?.id}
            isPlaying={isPlaying}
            onPlay={handlePlay}
            onLike={toggleLikeSong}
            onAddToPlaylist={addSongToPlaylist}
          />

          <Section
            eyebrow="Because you played"
            title={currentSong ? `More like ${currentSong.title}` : 'Play a song to unlock lookalikes'}
            songs={itemBasedRecs}
            likedSongs={likedSongs}
            currentSongId={currentSong?.id}
            isPlaying={isPlaying}
            onPlay={handlePlay}
            onLike={toggleLikeSong}
            onAddToPlaylist={addSongToPlaylist}
          />

          <Section
            eyebrow="Listeners also liked"
            title="Community picks"
            songs={collaborativeRecs}
            likedSongs={likedSongs}
            currentSongId={currentSong?.id}
            isPlaying={isPlaying}
            onPlay={handlePlay}
            onLike={toggleLikeSong}
            onAddToPlaylist={addSongToPlaylist}
          />

          <Section
            eyebrow="Featured"
            title="More songs"
            songs={trendingSongs}
            likedSongs={likedSongs}
            currentSongId={currentSong?.id}
            isPlaying={isPlaying}
            onPlay={handlePlay}
            onLike={toggleLikeSong}
            onAddToPlaylist={addSongToPlaylist}
          />
        </div>
      </div>

      <Player
        currentSong={currentSong}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onPrev={handlePrev}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
      />
      {currentSong && (
        <audio
          ref={audioRef}
          src={currentSong.url}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleNext}
        />
      )}
    </div>
  );
};
