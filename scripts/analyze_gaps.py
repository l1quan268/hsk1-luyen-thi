import miniaudio
import numpy as np
import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

# The user prompt specifies:
# Trạng thái:
# - needsReview: timestamp đề xuất chưa được kiểm chứng.
# - confirmed: timestamp được kiểm tra bằng nghe lại hoặc xác minh đáng tin cậy.
# - missing: chưa có timestamp.

def compute_exam_segments(eid):
    audio_file = f"public/audio/file nghe {eid}.mp3"
    decoded = miniaudio.decode_file(audio_file)
    sr = decoded.sample_rate
    samples = np.frombuffer(decoded.samples, dtype=np.int16)
    mono = samples.reshape(-1, 2).mean(axis=1) / 32768.0 if decoded.nchannels == 2 else samples / 32768.0
    duration = len(mono) / sr

    # Compute RMS energy (20ms window, 10ms step)
    fl = int(sr * 0.02)
    step = int(sr * 0.01)
    n_frames = (len(mono) - fl) // step
    rms = np.array([np.sqrt(np.mean(mono[i * step : i * step + fl] ** 2)) for i in range(n_frames)])
    times = np.array([(i * step + fl / 2) / sr for i in range(n_frames)])

    thresh = np.max(rms) * 0.035

    # Find speech bursts: contiguous frames where rms > thresh, merging pauses < 0.45s
    bursts = []
    in_b = False
    b_st = 0
    for i, r in enumerate(rms):
        t = times[i]
        if r > thresh and not in_b:
            in_b = True
            b_st = t
        elif r <= thresh and in_b:
            in_b = False
            bursts.append((b_st, t))
    if in_b:
        bursts.append((b_st, duration))

    # Merge bursts with gap < 0.45s (internal phrase pauses)
    merged = []
    for b in bursts:
        if not merged:
            merged.append(b)
        else:
            if b[0] - merged[-1][1] < 0.45:
                merged[-1] = (merged[-1][0], b[1])
            else:
                merged.append(b)

    # Now, between questions, the gap is large (typically >= 1.0s or the longest gaps).
    # Inside each question, there is reading 1 and reading 2.
    # If a question has 2 readings, it typically consists of 2 major speech segments (or 3 for dialogs).
    # Let's inspect the major gaps (>= 0.9s)
    major_gaps = []
    for i in range(len(merged) - 1):
        gap = merged[i+1][0] - merged[i][1]
        if gap >= 0.85:
            major_gaps.append((i, merged[i][1], merged[i+1][0], gap))

    print(f"Exam {eid}: total merged bursts={len(merged)}, major gaps (>=0.85s)={len(major_gaps)}")
    return merged, major_gaps, duration

for eid in range(1, 7):
    compute_exam_segments(eid)
