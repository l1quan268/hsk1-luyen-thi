import miniaudio
import numpy as np
import sys
import speech_recognition as sr
import io, wave, json, re

sys.stdout.reconfigure(encoding='utf-8')
r = sr.Recognizer()

def recognize_quick(mono_int16, sr_rate, t_start, t_end):
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

def get_markers_for_exam(eid):
    audio_file = f"public/audio/file nghe {eid}.mp3"
    print(f"\nDetecting question markers for Exam {eid}...", flush=True)
    decoded = miniaudio.decode_file(audio_file)
    sr = decoded.sample_rate
    samples = np.frombuffer(decoded.samples, dtype=np.int16)
    mono = samples.reshape(-1, 2).mean(axis=1) / 32768.0 if decoded.nchannels == 2 else samples / 32768.0
    mono_int16 = samples.reshape(-1, 2).mean(axis=1).astype(np.int16) if decoded.nchannels == 2 else samples
    duration = len(mono) / sr

    # find silences >= 0.75s
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
            if dur >= 0.75:
                silences.append((st_s, t, dur))
            st_s = None
    if st_s is not None:
        silences.append((st_s, duration, duration - st_s))

    # Test candidate starts after each silence:
    candidate_starts = [0.0] + [s[1] for s in silences[:-1]]
    
    markers = []
    for c_st in candidate_starts:
        # test first 1.3s
        txt = recognize_quick(mono_int16, sr, c_st, c_st + 1.4)
        m = re.search(r'第([一二三四五六七八九十\d]+)', txt)
        if m:
            markers.append((c_st, m.group(1), txt))
            print(f"  Found marker at {c_st:6.2f}s: '{txt}' -> 第{m.group(1)}", flush=True)
            
    print(f"Total markers found in Exam {eid}: {len(markers)}", flush=True)
    return markers, silences, duration

m, s, d = get_markers_for_exam(1)
