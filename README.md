# Flash Anzan Memory Game

A browser-based flash memory and mental math challenge with adjustable speed settings, adaptive difficulty, streaks, lives, and local score tracking.

## Features

- Multiple modes: Recall, Reverse Recall, Sum Sprint, Equation Solve
- Adjustable flash speed and answer window
- Difficulty scaling across rounds
- Streaks, accuracy tracking, lives, and score progression
- Sound cues and strict mode toggle
- Persistent high score and recent session history using localStorage
- Responsive, full-screen friendly interface

## Run it locally

Because this is a static app, you can run it in any browser directly:

1. Open `index.html` in a browser, or
2. Serve the repo with a tiny local server:

```bash
cd FLZ-JL
python3 -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

## Controls

- Start Session: begins the game
- Pause / Resume: freezes or continues the challenge
- Reset: clears the current run
- Mode: chooses the training pattern
- Difficulty: adjusts challenge complexity
- Flash Speed: controls how quickly numbers appear
- Answer Window: controls how long you have to respond
- Strict Mode: forces a full reset after a wrong answer or time-out

## Notes

This version is intentionally dependency-free so it works instantly and can be expanded into a larger React or Phaser build later if you want.
