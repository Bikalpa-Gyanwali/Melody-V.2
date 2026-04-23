import React, { memo } from 'react';

const PlayIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 5.27487C5 4.57203 5.78947 4.06361 6.44721 4.44299L19.2111 11.8681C19.822 12.218 19.822 13.0547 19.2111 13.4046L6.44721 20.8297C5.78947 21.2091 5 20.7007 5 20.0028V5.27487Z" fill="currentColor" />
  </svg>
);

const PauseIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" />
    <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" />
  </svg>
);

const SkipBackIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 5L4 12L11 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 5L13 12L20 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SkipForwardIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 5L20 12L13 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 5L11 12L4 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const HeartIcon = ({ isLiked }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} xmlns="http://www.w3.org/2000/svg">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PlaylistIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M4 12H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M4 18H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="17.5" cy="16.5" r="3.5" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const VolumeIcon = ({ muted }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 5L6 9H3V15H6L11 19V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    {!muted && <path d="M15 9.5C16.3333 10.6667 16.3333 13.3333 15 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}
    {!muted && <path d="M17.5 7C20.1667 9.33333 20.1667 14.6667 17.5 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}
    {muted && <path d="M16 9L21 14M21 9L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}
  </svg>
);

const formatTime = (value) => {
  if (!Number.isFinite(value) || value < 0) {
    return '0:00';
  }

  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const SongCardComponent = ({ song, onPlay, onLike, onAddToPlaylist, isLiked, isPlaying }) => (
  <article className={`song-tile group ${isPlaying ? 'song-tile-active' : ''}`}>
    <div className="relative overflow-hidden rounded-[28px]">
      <img
        src={song.cover}
        alt={song.title}
        className="h-56 w-full object-cover transition duration-500 group-hover:scale-[1.04]"
        onError={(event) => {
          event.target.onerror = null;
          event.target.src = 'https://placehold.co/300x300/122033/e2e8f0?text=Music';
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.1)_10%,rgba(2,6,23,0.88)_100%)]" />
      <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3">
        <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[11px] uppercase tracking-[0.32em] text-slate-200">
          {song.genre}
        </span>
        <button
          type="button"
          onClick={() => onLike(song.id)}
          className={`rounded-full border border-white/10 p-2 transition ${
            isLiked ? 'bg-rose-500 text-white' : 'bg-black/30 text-slate-200 hover:bg-white/10'
          }`}
        >
          <HeartIcon isLiked={isLiked} />
        </button>
      </div>

      <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xl font-semibold text-white">{song.title}</p>
          <p className="truncate text-sm text-slate-300">{song.artist}</p>
        </div>
        <button
          type="button"
          onClick={() => onPlay(song)}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-slate-950 shadow-lg transition hover:scale-105"
        >
          {isPlaying ? <PauseIcon size={30} /> : <PlayIcon size={30} />}
        </button>
      </div>
    </div>

    <div className="mt-4 flex flex-wrap gap-2">
      {song.moods.slice(0, 3).map((mood) => (
        <span key={`${song.id}-${mood}`} className="rounded-full bg-white/6 px-3 py-1 text-xs text-slate-300">
          {mood}
        </span>
      ))}
    </div>

    <button
      type="button"
      onClick={() => onAddToPlaylist(song.id)}
      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10"
    >
      <PlaylistIcon /> Add to playlist
    </button>
  </article>
);

export const SongCard = memo(SongCardComponent);

export const Player = memo(function Player({
  currentSong,
  isPlaying,
  progress,
  currentTime,
  duration,
  volume,
  onPlayPause,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange
}) {
  if (!currentSong) {
    return null;
  }

  const muted = volume <= 0.01;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-6xl -translate-x-1/2 rounded-[36px] border border-white/10 bg-[#07101b]/92 p-4 shadow-[0_30px_80px_rgba(2,6,23,0.55)] backdrop-blur-2xl md:p-5">
      <div className="absolute inset-x-12 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(124,227,215,0.7),transparent)]" />
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4 lg:w-[27%]">
          <img
            src={currentSong.cover}
            alt={currentSong.title}
            className="h-16 w-16 rounded-[20px] object-cover"
            onError={(event) => {
              event.target.onerror = null;
              event.target.src = 'https://placehold.co/300x300/122033/e2e8f0?text=Music';
            }}
          />
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.34em] text-cyan-300/70">Now playing</p>
            <h3 className="truncate text-lg font-semibold text-white">{currentSong.title}</h3>
            <p className="truncate text-sm text-slate-400">{currentSong.artist}</p>
          </div>
        </div>

        <div className="lg:w-[46%]">
          <div className="mb-3 flex items-center justify-center gap-5">
            <button type="button" onClick={onPrev} className="player-control text-slate-200">
              <SkipBackIcon />
            </button>
            <button type="button" onClick={onPlayPause} className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-950 shadow-lg transition hover:scale-105">
              {isPlaying ? <PauseIcon size={28} /> : <PlayIcon size={28} />}
            </button>
            <button type="button" onClick={onNext} className="player-control text-slate-200">
              <SkipForwardIcon />
            </button>
          </div>

          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max={duration || 0}
              step="0.1"
              value={Math.min(currentTime, duration || 0)}
              onChange={(event) => onSeek(Number(event.target.value))}
              className="player-slider w-full"
            />
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{formatTime(currentTime)}</span>
              <span>{Math.round(progress)}% played</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-3 lg:w-[23%]">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Volume</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-slate-300">
                <VolumeIcon muted={muted} />
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(event) => onVolumeChange(Number(event.target.value))}
                className="player-slider w-full"
              />
              <span className="w-10 text-right text-xs text-slate-400">{Math.round(volume * 100)}</span>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
            <p className="font-medium text-white">Playback studio</p>
            <p className="mt-1 text-slate-400">Drag the timeline to jump anywhere in the track and set your own listening level.</p>
          </div>
        </div>
      </div>
    </div>
  );
});
