import miniaudio
import numpy as np
import sys

sys.stdout.reconfigure(encoding='utf-8')

decoded = miniaudio.decode_file('public/audio/file nghe 1.mp3')
sr = decoded.sample_rate
channels = decoded.nchannels
samples = np.frombuffer(decoded.samples, dtype=np.int16)

# Convert to mono float
if channels == 2:
    mono = samples.reshape(-1, 2).mean(axis=1) / 32768.0
else:
    mono = samples / 32768.0

duration = len(mono) / sr
print(f"Sample Rate: {sr}, Channels: {channels}, Duration: {duration:.2f}s")

# Compute RMS in 50ms frames (step 25ms)
frame_len = int(sr * 0.05)
step = int(sr * 0.025)
num_frames = (len(mono) - frame_len) // step

rms = []
times = []
for i in range(num_frames):
    frame = mono[i * step : i * step + frame_len]
    r = np.sqrt(np.mean(frame ** 2))
    rms.append(r)
    times.append((i * step + frame_len / 2) / sr)

rms = np.array(rms)
times = np.array(times)

# Find silence threshold
max_r = np.max(rms)
median_r = np.median(rms[rms > 0.01]) if np.any(rms > 0.01) else max_r * 0.1
silence_thresh = max_r * 0.04
print(f"Max RMS: {max_r:.4f}, Threshold: {silence_thresh:.4f}")

# Find contiguous silence regions (silence duration >= 0.8s)
is_silent = rms < silence_thresh

silence_regions = []
start_sil = None
for i, s in enumerate(is_silent):
    t = times[i]
    if s and start_sil is None:
        start_sil = t
    elif not s and start_sil is not None:
        dur = t - start_sil
        if dur >= 0.7: # at least 0.7s of silence
            silence_regions.append((start_sil, t, dur))
        start_sil = None

if start_sil is not None:
    silence_regions.append((start_sil, duration, duration - start_sil))

print(f"Found {len(silence_regions)} silence regions (>= 0.7s):")
for idx, (st, en, dur) in enumerate(silence_regions):
    print(f"  Silence {idx:02d}: {st:6.2f}s -> {en:6.2f}s (dur: {dur:4.2f}s)")
