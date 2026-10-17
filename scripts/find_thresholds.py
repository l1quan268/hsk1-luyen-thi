import miniaudio
import numpy as np
import sys
import json
import speech_recognition as sr
import io, wave

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

def get_silences(mono, sr, min_dur=0.75):
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
            if dur >= min_dur:
                silences.append((st_s, t, dur))
            st_s = None
    dur = len(mono) / sr
    if st_s is not None:
        silences.append((st_s, dur, dur - st_s))
    return silences, dur

# Let's test Exam 2, 3, 4, 5, 6
for eid in range(1, 7):
    audio_file = f"public/audio/file nghe {eid}.mp3"
    decoded = miniaudio.decode_file(audio_file)
    sr = decoded.sample_rate
    samples = np.frombuffer(decoded.samples, dtype=np.int16)
    mono = samples.reshape(-1, 2).mean(axis=1) / 32768.0 if decoded.nchannels == 2 else samples / 32768.0
    
    # In exams 1-4, min_dur=1.4 gives exactly 40 silences (2 per question)
    # Let's see what min_dur gives 40 silences for each exam:
    found_threshold = None
    for test_thresh in np.arange(1.6, 0.7, -0.05):
        sils, dur = get_silences(mono, sr, min_dur=test_thresh)
        if len(sils) == 40:
            found_threshold = test_thresh
            print(f"Exam {eid}: exactly 40 silences found with min_dur={test_thresh:.2f}s!")
            break
    if not found_threshold:
        print(f"Exam {eid}: did not get 40 silences directly with single threshold, checking counts...")
        for t in [1.5, 1.4, 1.3, 1.2, 1.1, 1.0, 0.9, 0.8]:
            sils, dur = get_silences(mono, sr, min_dur=t)
            print(f"  thresh={t:.1f}s -> {len(sils)} silences")
