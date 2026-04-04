import { getAllSongs } from "./data";
import { Player } from "./helpers";
import  MoodDetector  from "./MoodDetector";
import React, { useState, useEffect, useRef } from "react";
import { SongCard } from "./helpers";

// --- Helper Components (Icons) ---
const LogoutIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;

export const HomePage = ({ user, onLogout, onManageSongs }) => {
    const [allSongs, setAllSongs] = useState(getAllSongs());
    const [activeMood, setActiveMood] = useState(null);
    const [currentSong, setCurrentSong] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [likedSongs, setLikedSongs] = useState(new Set());
    const [playlists, setPlaylists] = useState([]);

    // State for all three recommendation types
    const [similarityData, setSimilarityData] = useState(null);
    const [collaborativeRecs, setCollaborativeRecs] = useState([]); // User-Based: "Listeners Also Liked"
    const [itemBasedRecs, setItemBasedRecs] = useState([]);         // Item-Based: "Similar to what you're hearing"
    const [userBasedRecs, setUserBasedRecs] = useState([]);         // Content-Based: "Based on your likes"

    const audioRef = useRef(null);

    const getFilenameFromUrl = (url) => url.split('/').pop().replace(/%20/g, ' ');

    useEffect(() => {
        const refreshSongs = () => setAllSongs(getAllSongs());
        window.addEventListener('storage', refreshSongs);
        return () => window.removeEventListener('storage', refreshSongs);
    }, []);
 
    // Effect to load the cosine similarity data
    useEffect(() => {
        const fetchSimilarities = async () => {
            try {
                const response = await fetch('/songs_similarity.json');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                setSimilarityData(data);
            } catch (error) {
                console.error("Failed to load or parse songs_similarity.json:", error);
            }
        };
        fetchSimilarities();
    }, []);

    // Effect to load user data from localStorage
    useEffect(() => {
        try {
            const savedLikes = localStorage.getItem(`melody-likedSongs-${user.username}`);
            if (savedLikes) setLikedSongs(new Set(JSON.parse(savedLikes)));
            const savedPlaylists = localStorage.getItem(`melody-playlists-${user.username}`);
            if (savedPlaylists) setPlaylists(JSON.parse(savedPlaylists));
        } catch (error) { console.error("Failed to load data from localStorage", error); }
    }, [user.username]);

    // Effect to control audio play/pause
    useEffect(() => {
        if (isPlaying && currentSong) {
            audioRef.current.play().catch(e => e.name !== 'AbortError' && console.error("Audio play error:", e));
        } else if (audioRef.current) {
            audioRef.current.pause();
        }
    }, [isPlaying, currentSong]);

    // Enhanced progress tracking effect
    useEffect(() => {
        const interval = setInterval(() => {
            if (audioRef.current && currentSong && isPlaying) {
                const { currentTime, duration } = audioRef.current;
                const progressPercent = (currentTime / duration) * 100;
                setProgress(progressPercent || 0);
            }
        }, 500);
        return () => clearInterval(interval);
    }, [isPlaying, currentSong]);

    // 1. User-Based Collaborative Filtering ("Listeners Also Liked")
    useEffect(() => {
        if (!currentSong) {
            setCollaborativeRecs([]);
            return;
        }
        const findSimilarUsersSongs = () => {
            const similarSongs = new Set();
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('melody-likedSongs-') && key !== `melody-likedSongs-${user.username}`) {
                    const otherUserLikes = new Set(JSON.parse(localStorage.getItem(key)));
                    if (otherUserLikes.has(currentSong.id)) {
                        otherUserLikes.forEach(songId => {
                            if (songId !== currentSong.id && !likedSongs.has(songId)) {
                                similarSongs.add(songId);
                            }
                        });
                    }
                }
            }
            const recommendedSongs = allSongs.filter(song => similarSongs.has(song.id));
            setCollaborativeRecs(recommendedSongs.slice(0, 6));
        };
        findSimilarUsersSongs();
    }, [currentSong, user.username, likedSongs]);

    // 2. Item-Based Recommendations (using cosine similarity)
    useEffect(() => {
        if (!currentSong || !similarityData) {
            setItemBasedRecs([]);
            return;
        }
        const currentFilename = getFilenameFromUrl(currentSong.url);
        const songSimilarities = similarityData.find(s => getFilenameFromUrl(s.filename) === currentFilename);
        if (songSimilarities) {
            const similarFilenames = songSimilarities.similar_songs.map(s => getFilenameFromUrl(s.filename));
            const recommendedSongs = allSongs.filter(song =>
                similarFilenames.includes(getFilenameFromUrl(song.url)) && !likedSongs.has(song.id) && song.id !== currentSong.id
            ).sort((a, b) =>
                similarFilenames.indexOf(getFilenameFromUrl(a.url)) - similarFilenames.indexOf(getFilenameFromUrl(b.url))
            );
            setItemBasedRecs(recommendedSongs.slice(0, 6));
        } else {
            setItemBasedRecs([]);
        }
    }, [currentSong, similarityData, likedSongs]);

    // 3. Content-Based Recommendations (based on all liked songs)
    useEffect(() => {
        if (likedSongs.size === 0 || !similarityData) {
            setUserBasedRecs([]);
            return;
        }
        const recommendationsMap = new Map();
        const likedSongDetails = allSongs.filter(s => likedSongs.has(s.id));
        likedSongDetails.forEach(likedSong => {
            const likedFilename = getFilenameFromUrl(likedSong.url);
            const songSimilarities = similarityData.find(s => getFilenameFromUrl(s.filename) === likedFilename);
            if (songSimilarities) {
                songSimilarities.similar_songs.forEach(similar => {
                    const similarSongObject = allSongs.find(s => getFilenameFromUrl(s.url) === getFilenameFromUrl(similar.filename));
                    if (similarSongObject && !likedSongs.has(similarSongObject.id)) {
                        if (!recommendationsMap.has(similar.filename) || recommendationsMap.get(similar.filename) < similar.similarity) {
                            recommendationsMap.set(similar.filename, similar.similarity);
                        }
                    }
                });
            }
        });
        const sortedRecs = Array.from(recommendationsMap.entries()).sort(([, aSim], [, bSim]) => bSim - aSim).map(([filename]) => getFilenameFromUrl(filename));
        const finalRecommendations = allSongs.filter(song => sortedRecs.includes(getFilenameFromUrl(song.url))).sort((a, b) => sortedRecs.indexOf(getFilenameFromUrl(a.url)) - sortedRecs.indexOf(getFilenameFromUrl(b.url)));
        setUserBasedRecs(finalRecommendations.slice(0, 6));
    }, [likedSongs, similarityData]);

    // --- Handler Functions ---
    const handlePlay = (song) => {
        if (currentSong?.id === song.id && isPlaying) setIsPlaying(false);
        else {
            setCurrentSong(song);
            setIsPlaying(true);
        }
    };
    const handlePlayPause = () => setIsPlaying(!isPlaying);
    const handleNext = () => {
        const currentIndex = allSongs.findIndex(s => s.id === currentSong.id);
        const nextIndex = (currentIndex + 1) % allSongs.length;
        setCurrentSong(allSongs[nextIndex]);
    };
    const handlePrev = () => {
        const currentIndex = allSongs.findIndex(s => s.id === currentSong.id);
        const prevIndex = (currentIndex - 1 + allSongs.length) % allSongs.length;
        setCurrentSong(allSongs[prevIndex]);
    };
    const handleTimeUpdate = () => { if (audioRef.current) { const { currentTime, duration } = audioRef.current; if (duration) setProgress((currentTime / duration) * 100); } };
    const toggleLikeSong = (songId) => {
        const newLikes = new Set(likedSongs);
        if (newLikes.has(songId)) newLikes.delete(songId);
        else newLikes.add(songId);
        setLikedSongs(newLikes);
        localStorage.setItem(`melody-likedSongs-${user.username}`, JSON.stringify([...newLikes]));
    };
    const addSongToPlaylist = (songId) => {
        if (playlists.length === 0) { alert("Create a playlist first!"); return; }
        const playlistIndex = parseInt(prompt(`Add to which playlist? (0-${playlists.length - 1})\n\n` + playlists.map((p, i) => `${i}: ${p.name}`).join('\n')));
        if (!isNaN(playlistIndex) && playlists[playlistIndex]) {
            const newPlaylists = [...playlists];
            if (!newPlaylists[playlistIndex].songs.includes(songId)) {
                newPlaylists[playlistIndex].songs.push(songId);
                setPlaylists(newPlaylists);
                localStorage.setItem(`melody-playlists-${user.username}`, JSON.stringify(newPlaylists));
            } else alert("Song already in playlist.");
        }
    };

    // --- Variables for Rendering ---
    const moods = ['happy', 'sad', 'energetic', 'calm', 'focus'];
    const moodEmojis = {
        happy: '😊',
        sad: '😢',
        energetic: '⚡',
        calm: '🧘‍♂️',
        focus: '🎯'
    };
    const filteredSongs = activeMood ? allSongs.filter(s => s.moods.includes(activeMood)) : allSongs;

    return (
        <div className="pb-32">
            {/* Enhanced Professional Header */}
            <header className="flex justify-between items-center mb-8 p-4 md:p-8 bg-gray-900/80 backdrop-blur-md">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text">
                    Melody Music
                </h1>
                <div className="bg-gray-800 rounded-lg p-4 flex items-center gap-4">
                    <img
                        src="https://placehold.co/40x40/2d3748/718096?text=USER"
                        alt="Profile"
                        className="w-10 h-10 rounded-full"
                    />
                    <div>
                        <span className="text-gray-400">Welcome, {user.username}!😁</span>
                        <p className="text-sm text-cyan-400">Your vibe decides your tribe 🤞😉</p>
                    </div>
                    {onManageSongs && user.username === 'admin' && (
                        <button
                            onClick={onManageSongs}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded transition-all duration-300"
                        >
                            Admin Panel
                        </button>
                    )}
                    <button
                        onClick={onLogout}
                        className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded transition-all duration-300 tooltip"
                        data-tooltip="Logout"
                    >
                        <LogoutIcon /> Logout
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-4 md:px-8">
                {/* Enhanced Mood Selection with Emojis */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    <div className="md:col-span-2">
                        <h2 className="text-2xl font-bold mb-4">What's your mood today?</h2>
                        <div className="flex flex-wrap gap-3">
                            {moods.map(mood => (
                                <button
                                    key={mood}
                                    onClick={() => setActiveMood(mood)}
                                    className={`px-4 py-2 rounded-full font-semibold transition-all duration-300 mood-button ${
                                        activeMood === mood ? 'bg-cyan-500 text-gray-900' : 'bg-gray-700 hover:bg-gray-600'
                                    }`}
                                >
                                    {moodEmojis[mood]} {mood.charAt(0).toUpperCase() + mood.slice(1)}
                                </button>
                            ))}
                            {activeMood && (
                                <button
                                    onClick={() => setActiveMood(null)}
                                    className="px-4 py-2 rounded-full font-semibold bg-gray-600 hover:bg-gray-500 transition-all duration-300"
                                >
                                    Show All
                                </button>
                            )}
                        </div>
                    </div>
                    <MoodDetector onMoodSelect={setActiveMood} />
                </div>

                {/* Mood-based Songs with Enhanced Styling */}
                {activeMood && (
                    <div className="mb-12">
                        <h2 className="text-3xl font-bold mb-6">
                            Songs for {activeMood.charAt(0).toUpperCase() + activeMood.slice(1)}
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                            {filteredSongs.map(song => (
                                <SongCard
                                    key={song.id}
                                    song={song}
                                    onPlay={() => handlePlay(song)}
                                    onLike={() => toggleLikeSong(song.id)}
                                    onAddToPlaylist={() => addSongToPlaylist(song.id)}
                                    isLiked={likedSongs.has(song.id)}
                                    isPlaying={isPlaying && currentSong?.id === song.id}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Advanced Recommendation Sections with Professional Styling */}
                {collaborativeRecs.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-3xl font-bold mb-6 glow-text">Listeners Also Liked</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                            {collaborativeRecs.map(song => (
                                <SongCard
                                    key={`collab-${song.id}`}
                                    song={song}
                                    onPlay={() => handlePlay(song)}
                                    onLike={() => toggleLikeSong(song.id)}
                                    onAddToPlaylist={() => addSongToPlaylist(song.id)}
                                    isLiked={likedSongs.has(song.id)}
                                    isPlaying={isPlaying && currentSong?.id === song.id}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {itemBasedRecs.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-3xl font-bold mb-6 glow-text">
                            Because You're Listening to <span className="text-cyan-400">{currentSong.title}</span>
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                            {itemBasedRecs.map(song => (
                                <SongCard
                                    key={`item-${song.id}`}
                                    song={song}
                                    onPlay={() => handlePlay(song)}
                                    onLike={() => toggleLikeSong(song.id)}
                                    onAddToPlaylist={() => addSongToPlaylist(song.id)}
                                    isLiked={likedSongs.has(song.id)}
                                    isPlaying={isPlaying && currentSong?.id === song.id}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {userBasedRecs.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-3xl font-bold mb-6 glow-text">Recommended For You</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                            {userBasedRecs.map(song => (
                                <SongCard
                                    key={`user-${song.id}`}
                                    song={song}
                                    onPlay={() => handlePlay(song)}
                                    onLike={() => toggleLikeSong(song.id)}
                                    onAddToPlaylist={() => addSongToPlaylist(song.id)}
                                    isLiked={likedSongs.has(song.id)}
                                    isPlaying={isPlaying && currentSong?.id === song.id}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Enhanced Featured Songs Section */}
                <h2 className="text-3xl font-bold mb-6 glow-text">Featured Songs</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {allSongs.slice(0, 39).map(song => (
                        <SongCard
                            key={song.id}
                            song={song}
                            onPlay={() => handlePlay(song)}
                            onLike={() => toggleLikeSong(song.id)}
                            onAddToPlaylist={() => addSongToPlaylist(song.id)}
                            isLiked={likedSongs.has(song.id)}
                            isPlaying={isPlaying && currentSong?.id === song.id}
                        />
                    ))}
                </div>
            </main>

            <Player
                currentSong={currentSong}
                isPlaying={isPlaying}
                onPlayPause={handlePlayPause}
                onNext={handleNext}
                onPrev={handlePrev}
                progress={progress}
            />
            {currentSong && (
                <audio
                    ref={audioRef}
                    src={currentSong.url}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleNext}
                />
            )}
        </div>
    );
};