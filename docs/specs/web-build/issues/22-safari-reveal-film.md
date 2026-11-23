# Safari reveal film and safe fallback

Type: task

Status: resolved

Safari with no AV1 decoder loaded the 8.6 MB H.264 film, and a film error showed the still at once. The iOS app carried the AV1 films that it cannot use.

The Home reveal now picks AV1 when the browser answers "probably", else HEVC when it answers "probably" for `hvc1.1.6.L120.90`, else H.264. An `error` moves to the next film in that list; the still appears only after H.264 fails. The app uses H.264 and makes no codec check. `tools/ios-sync.sh` deletes the AV1 and HEVC films from `dist` before `npx cap sync ios`, so the app films are 17,871,478 bytes again.

The HEVC films come from the delivered H.264 files: libx265, `-preset slow -crf 30 -g 240`, a q=19 zone on frames 685 to 689 for the last frame, and the bt709 flags of the AV1 films. Wide 4,485,289 bytes, SSIM 0.9850; square 2,847,133, 0.9816; portrait 1,967,925, 0.9837. The last frame against `hero-*.webp` is within 0.0023 of the delivered film.

The new unit tests fail on the old code. WebKit plays the HEVC film when AV1 is off and the H.264 film when AV1 and HEVC are off. Chromium plays H.264 when the AV1 request fails.
