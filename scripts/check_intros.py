import miniaudio
import speech_recognition as sr
import io, wave, sys
import numpy as np

sys.stdout.reconfigure(encoding='utf-8')
r = sr.Recognizer()

for eid in range(1, 7):
    decoded = miniaudio.decode_file(f'public/audio/file nghe {eid}.mp3')
    samples = np.frombuffer(decoded.samples, dtype=np.int16)
    mono = samples.reshape(-1, 2).mean(axis=1).astype(np.int16) if decoded.nchannels == 2 else samples
    sr_rate = decoded.sample_rate

    # slice first 8 seconds
    slice_s = mono[: int(8.0 * sr_rate)]
    wav_io = io.BytesIO()
    with wave.open(wav_io, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr_rate)
        w.writeframes(slice_s.tobytes())
    wav_io.seek(0)
    with sr.AudioFile(wav_io) as source:
        audio = r.record(source)
    try:
        text = r.recognize_google(audio, language='zh-CN')
        print(f"Exam {eid} first 8s:", text)
    except Exception as e:
        print(f"Exam {eid} first 8s error:", e)
