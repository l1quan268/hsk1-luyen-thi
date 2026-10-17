import miniaudio
import numpy as np
import sys

sys.stdout.reconfigure(encoding='utf-8')

def analyze_exam(eid):
    decoded = miniaudio.decode_file(f'public/audio/file nghe {eid}.mp3')
    sr = decoded.sample_rate
    samples = np.frombuffer(decoded.samples, dtype=np.int16)
    mono = samples.reshape(-1, 2).mean(axis=1) / 32768.0 if decoded.nchannels == 2 else samples / 32768.0
    duration = len(mono) / sr
    
    # 25ms frames, 10ms hop
    fl = int(sr * 0.025)
    hop = int(sr * 0.010)
    num_frames = (len(mono) - fl) // hop
    rms = np.array([np.sqrt(np.mean(mono[i * hop : i * hop + fl] ** 2)) for i in range(num_frames)])
    times = np.array([(i * hop + fl / 2) / sr for i in range(num_frames)])
    
    thresh = np.max(rms) * 0.035
    is_silent = rms < thresh
    
    silences = []
    st_s = None
    for i, s in enumerate(is_silent):
        t = times[i]
        if s and st_s is None:
            st_s = t
        elif not s and st_s is not None:
            dur = t - st_s
            if dur >= 0.7:
                silences.append((st_s, t, dur))
            st_s = None
    if st_s is not None:
        silences.append((st_s, duration, duration - st_s))
        
    print(f"\n--- Exam {eid} (Duration {duration:.2f}s, Silences >= 0.7s: {len(silences)}) ---")
    for idx, (st, en, dur) in enumerate(silences):
        print(f"S{idx:02d}: {st:6.2f}s -> {en:6.2f}s (gap: {dur:4.2f}s)")

for eid in range(1, 7):
    analyze_exam(eid)
