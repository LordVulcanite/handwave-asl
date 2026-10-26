# Handwave

Learn ASL fingerspelling with your camera. Handwave watches your hand, tells you which finger to fix, and quizzes you. Everything runs on your own device: no accounts, no uploads, nothing recorded.

**Try it:** https://lordvulcanite.github.io/handwave-asl/

## How it works
1. The camera frame goes to MediaPipe Hands, which finds 21 points on your hand.
2. features.js turns those points into 19 numbers (finger curl, thumb position, finger spread, hand direction). They're measured against the size of your own hand, so distance from the camera doesn't matter.
3. letters.js compares those numbers to each letter and to examples you recorded with "Teach it your hand", then explains the biggest differences in plain words.
4. app.js is the screens: Learn, Quiz, Spell and Me.

## Honest limits
- It checks handshapes, not movement. J and Z check only the starting shape.
- Look-alike letters (M, N, S, T, A, E, K, V, U, R) need "Teach it your hand" to be checked well.
- The starting numbers for each letter were written by hand from how the alphabet is signed and tested on simulated hands. They still need tuning on real hands.

## Run it locally
    python3 -m http.server 8000
Then open http://localhost:8000 (the camera needs https or localhost).

The hand tracker (MediaPipe Hands, Apache 2.0) loads from the jsDelivr CDN.
