import miniaudio
import numpy as np
import sys
import json
import os

sys.stdout.reconfigure(encoding='utf-8')

def extract_exam_segments(eid):
    audio_file = f"public/audio/file nghe {eid}.mp3"
    decoded = miniaudio.decode_file(audio_file)
    sr = decoded.sample_rate
    samples = np.frombuffer(decoded.samples, dtype=np.int16)
    mono = samples.reshape(-1, 2).mean(axis=1) / 32768.0 if decoded.nchannels == 2 else samples / 32768.0
    duration = len(mono) / sr

    # Compute RMS energy (20ms window, 10ms hop)
    fl = int(sr * 0.020)
    hop = int(sr * 0.010)
    n_frames = (len(mono) - fl) // hop
    rms = np.array([np.sqrt(np.mean(mono[i * hop : i * hop + fl] ** 2)) for i in range(n_frames)])
    times = np.array([(i * hop + fl / 2) / sr for i in range(n_frames)])

    thresh = np.max(rms) * 0.035
    is_silent = rms < thresh

    # Find silences >= 0.70s
    silences = []
    st_s = None
    for i, s in enumerate(is_silent):
        t = times[i]
        if s and st_s is None:
            st_s = t
        elif not s and st_s is not None:
            dur = t - st_s
            if dur >= 0.68:
                silences.append((st_s, t, dur))
            st_s = None
    if st_s is not None:
        silences.append((st_s, duration, duration - st_s))

    print(f"\nExam {eid}: duration={duration:.2f}s, silences={len(silences)}")
    return silences, duration, rms, times, thresh

all_results = {}
for eid in range(1, 7):
    sils, dur, rms, times, thresh = extract_exam_segments(eid)
    for idx, (st, en, d) in enumerate(sils):
        print(f"  S{idx:02d}: {st:6.2f}s -> {en:6.2f}s (dur {d:4.2f}s)")
