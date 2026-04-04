# Melody Music

Melody Music is a music recommendation web application that helps users discover and play songs based on mood, emotion detection, and listening preferences. It combines a React frontend with a Flask backend to deliver authentication, music playback, personalized suggestions, and simple admin controls for managing songs.

## Features
- User sign up and login with token-based authentication
- Mood-based song filtering
- Webcam emotion detection using face recognition models
- Personalized music recommendations based on listening behavior and similarity data
- Like, playlist, and music player functionality
- Admin panel for adding and managing songs

## Tech Stack
- Frontend: React, Create React App, Tailwind CSS
- Backend: Flask, SQLite, JWT
- AI / Recommendation: face-api.js and song similarity data

## Project Structure
- `frontend/` contains the user interface and music player
- `backend/` contains authentication and backend services

## Running Locally
### Frontend
```bash
cd frontend
npm install
npm start
```

### Backend
```bash
cd backend
python main.py
```
