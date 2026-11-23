# Safari reveal film and safe fallback

Type: task

Status: resolved

Safari with no AV1 decoder loaded the 8.6 MB H.264 film, and a film error showed the still at once. The iOS app carried the AV1 films that it cannot use.

The Home reveal picks AV1 when the browser answers "probably", then HEVC when it answers "probably" for `hvc1.1.6.L120.90", then H.264. A film error shows the still and title until the next film plays. The still stays when reduced motion is on, the browser refuses playback, or the last film fails. The app uses H.264 and makes no codec check. `tools/ios-sync.sh` deletes the AV1 and HEVC films from `dist` before `npx cap sync ios`, so the app films are 17,871,478 bytes again.

The HEVC films come from the delivered H.264 files: libx265, `-preset slow -crf 30 -g 240`, a q=19 zone on frames 685 to 689 for the last frame, and the bt709 flags of the AV1 films. Wide 4,485,289 bytes, SSIM 0.9850; square 2,847,133, 0.9816; portrait 1,967,925, 0.9837. The last frame against `hero-*.webp` is within 0.0023 of the delivered film.

The new unit tests fail on the old code. WebKit plays the HEVC film when AV1 is off and the H.264 film when AV1 and HEVC are off. Chromium plays H.264 when the AV1 request fails.

## Review repair

The independent review of `0be0e353ad053ea3eb4e782606aeb35f2aa27de7` finds three faults. Home goes blank when a film fails during playback. Home loads another film when reduced motion is on or the browser refuses playback. Each fault has a unit test that fails before the repair and passes after it.
