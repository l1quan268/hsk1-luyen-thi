import miniaudio
import numpy as np
import sys
import speech_recognition as sr
import io, wave, json, re

sys.stdout.reconfigure(encoding='utf-8')
r = sr.Recognizer()

def recognize_slice(mono_int16, sr_rate, t_start, t_end):
    st_idx = int(max(0, t_start) * sr_rate)
    en_idx = int(min(len(mono_int16), t_end * sr_rate))
    slice_data = mono_int16[st_idx:en_idx]
    
    wav_io = io.BytesIO()
    with wave.open(wav_io, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr_rate)
        w.writeframes(slice_data.tobytes())
    wav_io.seek(0)
    with sr.AudioFile(wav_io) as source:
        audio = r.record(source)
    try:
        return r.recognize_google(audio, language='zh-CN')
    except Exception:
        return ""

# Let's inspect bursts and markers for exam 1
decoded = miniaudio.decode_file('public/audio/file nghe 1.mp3')
sr_rate = decoded.sample_rate
samples = np.frombuffer(decoded.samples, dtype=np.int16)
mono = samples.reshape(-1, 2).mean(axis=1) / 32768.0
mono_int16 = samples.reshape(-1, 2).mean(axis=1).astype(np.int16) if decoded.nchannels == 2 else samples
duration = len(mono) / sr_rate

# Find all silence gaps >= 0.6s
frame_len = int(sr_rate * 0.03)
step = int(sr_rate * 0.015)
num_frames = (len(mono) - frame_len) // step

rms = np.array([np.sqrt(np.mean(mono[i * step : i * step + frame_len] ** 2)) for i in range(num_frames)])
times = np.array([(i * step + frame_len / 2) / sr_rate for i in range(num_frames)])

max_rms = np.max(rms)
thresh = max_rms * 0.035
is_silent = rms < thresh

silence_regions = []
st_sil = None
for i, s in enumerate(is_silent):
    t = times[i]
    if s and st_sil is None:
        st_sil = t
    elif not s and st_sil is not None:
        dur = t - st_sil
        if dur >= 0.6:
            silence_regions.append((st_sil, t, dur))
        st_sil = None

print(f"Total silence gaps >= 0.6s in Exam 1: {len(silence_regions)}")
# Print each speech segment between silences
speech_segments = []
prev_en = 0.0
for st, en, dur in silence_regions:
    if st > prev_en + 0.3:
        speech_segments.append((prev_en, st))
    prev_en = en
if duration > prev_en + 0.3:
    speech_segments.append((prev_en, duration))

print(f"Total speech segments in Exam 1: {len(speech_segments)}")
for idx, (st, en) in enumerate(speech_segments[:15]):
    # test recognize first 1.5s of speech segment to see if it has '第X题'
    header_text = recognize_slice(mono_int16, sr_rate, st, min(en, st + 1.8))
    print(f"Segment {idx:02d} [{st:5.2f}s -> {en:5.2f}s] (dur {en-st:4.2f}s): '{header_text}'")
