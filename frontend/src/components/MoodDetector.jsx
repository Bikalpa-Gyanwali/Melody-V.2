import React, { useState, useRef, useEffect } from 'react';
const CameraIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;


const MoodDetector = ({ onMoodSelect }) => {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [detectedEmotion, setDetectedEmotion] = useState(null);
  const videoRef = useRef();
  const canvasRef = useRef();
  const visualizerCanvasRef = useRef();
  const intervalRef = useRef();

  // Simple audio visualizer effect
  useEffect(() => {
    if (isCameraOn && visualizerCanvasRef.current) {
     
    }
  }, [isCameraOn]);

  const loadModels = async () => {
    if (isLoading || modelsLoaded) return;

    if (typeof window.faceapi === 'undefined') {
      alert("Face detection library not available. Please check your internet connection and ensure the script tag is in index.html.");
      return;
    }

    setIsLoading(true);
    try {
      const MODEL_URL = '/models';
      console.log("Loading face detection models...");
      await window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await window.faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
      setModelsLoaded(true);
      console.log("Face-api models loaded successfully.");
    } catch (error) {
      console.error("Error loading face-api models:", error);
      alert("Failed to load AI models. Make sure the 'models' folder is in your 'public' directory.");
    }
    setIsLoading(false);
  };

  const startVideo = () => {
    setIsCameraOn(true);
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => {
        console.error("Error accessing webcam:", err);
        setIsCameraOn(false);
      });
  };

  const stopVideo = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setIsCameraOn(false);
    setDetectedEmotion(null);
  };

  const handleVideoPlay = () => {
    intervalRef.current = setInterval(async () => {
      if (videoRef.current && canvasRef.current && window.faceapi) {
        canvasRef.current.innerHTML = window.faceapi.createCanvasFromMedia(videoRef.current);
        const displaySize = { width: videoRef.current.width, height: videoRef.current.height };
        window.faceapi.matchDimensions(canvasRef.current, displaySize);

        const detections = await window.faceapi.detectAllFaces(videoRef.current, new window.faceapi.TinyFaceDetectorOptions()).withFaceExpressions();

        if (detections && detections.length > 0) {
          const expressions = detections[0].expressions;
          const primaryEmotion = Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b);
          setDetectedEmotion(primaryEmotion);

          const moodMap = { happy: 'happy', sad: 'sad', angry: 'energetic', surprised: 'upbeat', neutral: 'calm' };
          if (moodMap[primaryEmotion]) onMoodSelect(moodMap[primaryEmotion]);
        }
      }
    }, 500);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 glow-text">
        <CameraIcon /> Mood Detector
      </h3>
      {!modelsLoaded ? (
        <button
          onClick={loadModels}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded disabled:bg-gray-600 transition-all duration-300"
        >
          {isLoading ? 'Loading Models...' : 'Load AI Models'}
        </button>
      ) : (
        <>
          {!isCameraOn ? (
            <button
              onClick={startVideo}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-gray-900 font-bold py-2 px-4 rounded transition-all duration-300"
            >
              Start Camera
            </button>
          ) : (
            <button
              onClick={stopVideo}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded transition-all duration-300"
            >
              Stop Camera
            </button>
          )}
        </>
      )}
      {isCameraOn && (
        <div className="relative mt-4">
          <video
            ref={videoRef}
            autoPlay
            muted
            width="300"
            height="225"
            onPlay={handleVideoPlay}
            className="rounded-md w-full transform scale-x-[-1]"
          ></video>
          <canvas ref={canvasRef} className="absolute top-0 left-0"></canvas>
          <canvas ref={visualizerCanvasRef} width="300" height="50" className="mt-2 rounded-md"></canvas>
          {detectedEmotion && (
            <p className="text-center text-lg font-bold text-cyan-400 mt-2 capitalize animate-pulse">
              {detectedEmotion}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
export default MoodDetector;