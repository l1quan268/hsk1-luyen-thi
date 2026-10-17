import miniaudio
import numpy as np
import sys
import json
import os

sys.stdout.reconfigure(encoding='utf-8')

# We know each exam has exactly 20 questions in order.
# Each question has Reading 1 + break + Reading 2 + break.
# Let's write an algorithm that finds the 20 questions by tracking speech onsets and silence breaks.

def extract_exam_20_segments(eid):
    audio_file = f"public/audio/file nghe {eid}.mp3"
    decoded = miniaudio.decode_file(audio_file)
    sr = decoded.sample_rate
    samples = np.frombuffer(decoded.samples, dtype=np.int16)
    mono = samples.reshape(-1, 2).mean(axis=1) / 32768.0 if decoded.nchannels == 2 else samples / 32768.0
    duration = len(mono) / sr

    # RMS frames
    fl = int(sr * 0.025)
    hop = int(sr * 0.010)
    num_frames = (len(mono) - fl) // hop
    rms = np.array([np.sqrt(np.mean(mono[i * hop : i * hop + fl] ** 2)) for i in range(num_frames)])
    times = np.array([(i * hop + fl / 2) / sr for i in range(num_frames)])
    thresh = np.max(rms) * 0.035
    is_silent = rms < thresh

    # Detect silences >= 0.70s
    silences = []
    st_s = None
    for i, s in enumerate(is_silent):
        t = times[i]
        if s and st_s is None:
            st_s = t
        elif not s and st_s is not None:
            dur = t - st_s
            if dur >= 0.70:
                silences.append((st_s, t, dur))
            st_s = None
    if st_s is not None:
        silences.append((st_s, duration, duration - st_s))

    # A question consists of:
    # Reading 1 -> Intra-silence (~1.5s) -> Reading 2 -> Inter-silence (~1.8-2.5s)
    # Notice: there are exactly 20 questions.
    # In each exam, inter-question silences are generally >= 1.2s.
    # Let's inspect silences:
    print(f"\nExam {eid} (Total duration: {duration:.2f}s, Silences >= 0.70s: {len(silences)})")

    # Let's match each of the 20 questions:
    # For exam 1: silences has 40 entries, exactly 2 silences per question!
    # For other exams, if an exam has 41-45 silences, let's identify the extra intra-dialogue pauses
    # (which are shorter than 1.1s or happen inside Q16-20).
    return silences, duration

for eid in range(1, 7):
    extract_exam_20_segments(eid)
