
const PlayIcon = ({ size = 24 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 5.27487C5 4.57203 5.78947 4.06361 6.44721 4.44299L19.2111 11.8681C19.822 12.218 19.822 13.0547 19.2111 13.4046L6.44721 20.8297C5.78947 21.2091 5 20.7007 5 20.0028V5.27487Z" fill="currentColor" /></svg>;
const PauseIcon = ({ size = 24 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" /><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" /></svg>;
const SkipBackIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 5L4 12L11 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M20 5L13 12L20 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const SkipForwardIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 5L20 12L13 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 5L11 12L4 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const HeartIcon = ({ isLiked }) => <svg width="24" height="24" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} xmlns="http://www.w3.org/2000/svg"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const PlusIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;

export const SongCard = ({ song, onPlay, onLike, onAddToPlaylist, isLiked, isPlaying }) => (
    <div className="bg-gray-800 rounded-lg p-4 flex flex-col group relative">
        <div className="relative">
            <img src={song.cover} alt={song.title} className="w-full h-auto rounded-md mb-4" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/300x300/2d3748/718096?text=Music'; }} />
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={onPlay} className="text-white bg-cyan-500 rounded-full p-4">
                    {isPlaying ? <PauseIcon size={32} /> : <PlayIcon size={32} />}
                </button>
            </div>
        </div>
        <div className="flex-grow">
            <h3 className="font-bold text-lg truncate">{song.title}</h3>
            <p className="text-gray-400 text-sm truncate">{song.artist}</p>
        </div>
        <div className="flex items-center justify-between mt-4">
            <div>   </div>
            <button onClick={onLike} className={`text-gray-400 hover:text-white ${isLiked ? 'text-red-500' : ''}`}><HeartIcon isLiked={isLiked} /></button>
            
        </div>
    </div>
);

export const Player = ({ currentSong, isPlaying, onPlayPause, onNext, onPrev, progress }) => {
    if (!currentSong) return null;
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-md p-4 shadow-2xl z-50">
            <div className="container mx-auto flex items-center justify-between">
                <div className="flex items-center gap-4 w-1/4">
                    <img src={currentSong.cover} alt={currentSong.title} className="w-16 h-16 rounded-md" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/300x300/2d3748/718096?text=Music'; }} />
                    <div>
                        <h3 className="font-bold text-lg">{currentSong.title}</h3>
                        <p className="text-gray-400">{currentSong.artist}</p>
                    </div>
                </div>
                <div className="flex flex-col items-center gap-2 w-1/2">
                    <div className="flex items-center gap-6">
                        <button onClick={onPrev} className="text-gray-400 hover:text-white"><SkipBackIcon /></button>
                        <button onClick={onPlayPause} className="bg-white text-gray-900 rounded-full p-3">
                            {isPlaying ? <PauseIcon size={28} /> : <PlayIcon size={28} />}
                        </button>
                        <button onClick={onNext} className="text-gray-400 hover:text-white"><SkipForwardIcon /></button>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                        <div className="bg-cyan-400 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
                <div className="flex items-center justify-end w-1/4"></div>
            </div>
        </div>
    );
};
