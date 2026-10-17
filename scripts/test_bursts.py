import miniaudio
import numpy as np
import sys
import speech_recognition as sr
import io, wave

sys.stdout.reconfigure(encoding='utf-8')

decoded = miniaudio.decode_file('public/audio/file nghe 1.mp3')
sr_rate = decoded.sample_rate
samples = np.frombuffer(decoded.samples, dtype=np.int16)
mono = samples.reshape(-1, 2).mean(axis=1) / 32768.0
mono_int16 = samples.reshape(-1, 2).mean(axis=1).astype(np.int16) if decoded.nchannels == 2 else samples
duration = len(mono) / sr_rate

# Compute RMS energy in 20ms frames, step 10ms
frame_len = int(sr_rate * 0.02)
step = int(sr_rate * 0.01)
num_frames = (len(mono) - frame_len) // step

rms = np.array([np.sqrt(np.mean(mono[i * step : i * step + frame_len] ** 2)) for i in range(num_frames)])
times = np.array([(i * step + frame_len / 2) / sr_rate for i in range(num_frames)])

max_rms = np.max(rms)
thresh = max_rms * 0.035
is_speech = rms > thresh

# Cluster speech bursts (merge gaps < 0.3s)
bursts = []
in_burst = False
b_st = 0
for i, sp in enumerate(is_speech):
    t = times[i]
    if sp and not in_burst:
        in_burst = True
        b_st = t
    elif not sp and in_burst:
        in_burst = False
        bursts.append((b_st, t))

# Merge bursts separated by less than 0.4s
merged_bursts = []
for b in bursts:
    if not merged_bursts:
        merged_bursts.append(b)
    else:
        last_st, last_en = merged_bursts[-1]
        if b[0] - last_en < 0.4:
            merged_bursts[-1] = (last_st, b[1])
        else:
            merged_bursts.append(b)

print(f"Total speech bursts found: {len(merged_bursts)}")
for idx, (st, en) in enumerate(merged_bursts[:10]):
    print(f"  Burst {idx:02d}: {st:6.2f}s -> {en:6.2f}s (dur: {en - st:4.2f}s)")
