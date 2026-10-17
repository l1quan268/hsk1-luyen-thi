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

def get_exam_question_segments(eid):
    audio_file = f"public/audio/file nghe {eid}.mp3"
    decoded = miniaudio.decode_file(audio_file)
    sr = decoded.sample_rate
    samples = np.frombuffer(decoded.samples, dtype=np.int16)
    mono = samples.reshape(-1, 2).mean(axis=1) / 32768.0 if decoded.nchannels == 2 else samples / 32768.0
    mono_int16 = samples.reshape(-1, 2).mean(axis=1).astype(np.int16) if decoded.nchannels == 2 else samples
    duration = len(mono) / sr

    # We want to find the 20 question start points.
    # We know each question starts with "第X题" where X in 1..20.
    # Let's inspect the silence gaps >= 0.8s:
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
            if dur >= 0.8:
                silences.append((st_s, t, dur))
            st_s = None
    if st_s is not None:
        silences.append((st_s, duration, duration - st_s))

    return silences, duration, mono_int16, sr

silences, duration, mono_int16, sr = get_exam_question_segments(1)
print(f"Exam 1 silences: {len(silences)}")
# In Exam 1, there are 40 silences:
# S0: break between R1 and R2 of Q1
# S1: break between Q1 and Q2
# S2: break between R1 and R2 of Q2
# S3: break between Q2 and Q3
# ...
# S(2k-2): break between R1 and R2 of Qk
# S(2k-1): break between Qk and Q(k+1)

for q in range(1, 21):
    if q == 1:
        q_start = 0.0
    else:
        # starts after silence S(2*q - 3)
        q_start = silences[2 * q - 3][1] - 0.05
    
    if q == 20:
        # ends at start of last silence or end of speech
        q_end = silences[-1][0] + 0.15
    else:
        # ends at start of silence S(2*q - 1)
        q_end = silences[2 * q - 1][0] + 0.15
        
    print(f"Q{q:02d}: start={q_start:6.2f}s, end={q_end:6.2f}s, dur={q_end-q_start:5.2f}s")
