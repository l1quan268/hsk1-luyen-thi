import sys
import os
import io
import wave
import json
import re
import miniaudio
import numpy as np
import speech_recognition as sr

sys.stdout.reconfigure(encoding='utf-8')

# Chinese number words map
NUM_WORDS = {
    1: '一', 2: '二', 3: '三', 4: '四', 5: '五',
    6: '六', 7: '七', 8: '八', 9: '九', 10: '十',
    11: '十一', 12: '十二', 13: '十三', 14: '十四', 15: '十五',
    16: '十六', 17: '十七', 18: '十八', 19: '十九', 20: '二十'
}

def analyze_exam_audio(exam_id):
    audio_path = f"public/audio/file nghe {exam_id}.mp3"
    print(f"\n==========================================")
    print(f"ANALYZING EXAM {exam_id:02d}: {audio_path}")
    print(f"==========================================")
    
    decoded = miniaudio.decode_file(audio_path)
    sr_rate = decoded.sample_rate
    channels = decoded.nchannels
    samples = np.frombuffer(decoded.samples, dtype=np.int16)
    
    if channels == 2:
        mono = samples.reshape(-1, 2).mean(axis=1) / 32768.0
        mono_int16 = samples.reshape(-1, 2).mean(axis=1).astype(np.int16)
    else:
        mono = samples / 32768.0
        mono_int16 = samples
        
    duration = len(mono) / sr_rate
    print(f"Duration: {duration:.2f}s, SR: {sr_rate}")

    # Compute RMS energy in 50ms frames, step 25ms
    frame_len = int(sr_rate * 0.05)
    step = int(sr_rate * 0.025)
    num_frames = (len(mono) - frame_len) // step

    rms = np.array([np.sqrt(np.mean(mono[i * step : i * step + frame_len] ** 2)) for i in range(num_frames)])
    times = np.array([(i * step + frame_len / 2) / sr_rate for i in range(num_frames)])

    max_rms = np.max(rms)
    silence_thresh = max_rms * 0.045
    is_silent = rms < silence_thresh

    # Detect silence regions >= 0.7s
    silence_regions = []
    st_sil = None
    for i, s in enumerate(is_silent):
        t = times[i]
        if s and st_sil is None:
            st_sil = t
        elif not s and st_sil is not None:
            dur = t - st_sil
            if dur >= 0.65:
                silence_regions.append((st_sil, t, dur))
            st_sil = None
    if st_sil is not None:
        silence_regions.append((st_sil, duration, duration - st_sil))

    print(f"Total silence regions detected: {len(silence_regions)}")
    return mono_int16, sr_rate, duration, silence_regions

for eid in range(1, 7):
    analyze_exam_audio(eid)
