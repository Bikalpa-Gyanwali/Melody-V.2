import React, { useEffect, useRef, useState } from 'react';

const CameraIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MoodDetector = ({ onMoodSelect }) => {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [detectedEmotion, setDetectedEmotion] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);

  const loadModels = async () => {
    if (isLoading || modelsLoaded) {
      return;
    }

    if (typeof window.faceapi === 'undefined') {
      alert("Face detection library not available. Please check your internet connection and ensure the script tag is in index.html.");
      return;
    }

    setIsLoading(true);
    try {
      const modelUrl = '/models';
      await window.faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl);
      await window.faceapi.nets.faceExpressionNet.loadFromUri(modelUrl);
      setModelsLoaded(true);
    } catch (error) {
      console.error('Error loading face-api models:', error);
      alert("Failed to load AI models. Make sure the 'models' folder is in your 'public' directory.");
    }
    setIsLoading(false);
  };

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOn(true);
    } catch (error) {
      console.error('Error accessing webcam:', error);
      setIsCameraOn(false);
    }
  };

  const stopVideo = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }

    setIsCameraOn(false);
    setDetectedEmotion(null);
  };

  useEffect(() => stopVideo, []);

  const handleVideoPlay = () => {
    intervalRef.current = setInterval(async () => {
      if (videoRef.current && canvasRef.current && window.faceapi) {
        const displaySize = { width: videoRef.current.width, height: videoRef.current.height };
        window.faceapi.matchDimensions(canvasRef.current, displaySize);

        const detections = await window.faceapi
          .detectAllFaces(videoRef.current, new window.faceapi.TinyFaceDetectorOptions())
          .withFaceExpressions();

        if (detections && detections.length > 0) {
          const expressions = detections[0].expressions;
          const primaryEmotion = Object.keys(expressions).reduce((a, b) =>
            expressions[a] > expressions[b] ? a : b
          );
          setDetectedEmotion(primaryEmotion);

          const moodMap = {
            happy: 'happy',
            sad: 'sad',
            angry: 'energetic',
            surprised: 'energetic',
            neutral: 'calm'
          };

          if (moodMap[primaryEmotion]) {
            onMoodSelect(moodMap[primaryEmotion]);
          }
        }
      }
    }, 700);
  };

  return (
    <div className="detector-panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Mood detector</p>
          <h3 className="mt-2 font-display text-2xl text-white">Scan your room energy</h3>
          <p className="mt-2 text-sm text-slate-400">
            Use your camera to nudge the dashboard toward what your face is signaling.
          </p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/6 p-3 text-cyan-200">
          <CameraIcon />
        </div>
      </div>

      <div className="mt-5">
        {!modelsLoaded ? (
          <button
            type="button"
            onClick={loadModels}
            disabled={isLoading}
            className="w-full rounded-2xl bg-white px-4 py-3 font-medium text-slate-950 transition hover:bg-slate-100 disabled:opacity-60"
          >
            {isLoading ? 'Loading AI models...' : 'Load mood AI'}
          </button>
        ) : (
          <button
            type="button"
            onClick={isCameraOn ? stopVideo : startVideo}
            className={`w-full rounded-2xl px-4 py-3 font-medium transition ${
              isCameraOn
                ? 'bg-rose-500 text-white hover:bg-rose-400'
                : 'bg-[linear-gradient(135deg,#7ce3d7_0%,#f7d06b_100%)] text-slate-950 hover:brightness-105'
            }`}
          >
            {isCameraOn ? 'Stop camera' : 'Start camera scan'}
          </button>
        )}
      </div>

      <div className="relative mt-5 overflow-hidden rounded-[28px] border border-white/10 bg-[#06101b]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,227,215,0.14),transparent_35%)]" />
        {isCameraOn ? (
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              muted
              width="300"
              height="225"
              onPlay={handleVideoPlay}
              className="h-[260px] w-full scale-x-[-1] object-cover"
            />
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
          </div>
        ) : (
          <div className="relative flex h-[260px] items-center justify-center px-6 text-center">
            <div>
              <p className="font-display text-2xl text-white">Ready for a vibe scan</p>
              <p className="mt-2 text-sm text-slate-400">
                Load the model once, then start the camera when you want a mood-based recommendation shift.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Detected emotion</p>
        <p className="mt-2 text-lg font-semibold capitalize text-white">
          {detectedEmotion || 'Waiting for scan'}
        </p>
      </div>
    </div>
  );
};

export default MoodDetector;
