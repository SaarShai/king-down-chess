# Daylight run 3. Clock, sound and pulses

Status: ready-for-human

The web game starts the shared effect clock and uses one canvas for its effects. A hit hold can pause the scene through the pause hook. The effect API and examples are in [the API guide](../../../../src/interface/play/fx/README.md).

Sound starts off. The sound table uses the approved selection and Knight landing recordings, the existing impact and check cues, and ten made sounds from the reference build. Replace the made sounds when recordings are ready.

The Vibration switch starts on and is available in You and the game Menu. The choice stays on the device. Web vibration uses the browser, and the iOS app can use the native Haptics bridge when it is available.

The turn, scene and setup lanes connect their effects through the shared API. The iOS lane supplies the native Haptics implementation.
