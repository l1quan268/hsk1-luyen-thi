import miniaudio
import numpy as np
import sys
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

decoded = miniaudio.decode_file('public/audio/file nghe 1.mp3')
sr_rate = decoded.sample_rate
samples = np.frombuffer(decoded.samples, dtype=np.int16)
mono_int16 = samples.reshape(-1, 2).mean(axis=1).astype(np.int16) if decoded.nchannels == 2 else samples

# Test short slices around the bursts
tests = [
    (0.0, 1.2),
    (7.0, 8.2),
    (14.5, 15.8),
    (22.0, 23.5),
    (27.0, 28.5)
]

for st, en in tests:
    txt = recognize_slice(mono_int16, sr_rate, st, en)
    print(f"Slice [{st:.1f}s - {en:.1f}s]: '{txt}'")
