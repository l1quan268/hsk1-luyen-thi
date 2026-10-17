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

def process_exam(exam_id):
    path = f"public/audio/file nghe {exam_id}.mp3"
    print(f"\n==========================================")
    print(f"PROCESSING EXAM {exam_id:02d}: {path}")
    print(f"==========================================")
    
    decoded = miniaudio.decode_file(path)
    sr_rate = decoded.sample_rate
    samples = np.frombuffer(decoded.samples, dtype=np.int16)
    mono = samples.reshape(-1, 2).mean(axis=1) / 32768.0
    mono_int16 = samples.reshape(-1, 2).mean(axis=1).astype(np.int16) if decoded.nchannels == 2 else samples
    duration = len(mono) / sr_rate
    
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
            if dur >= 0.55: # silence threshold
                silence_regions.append((st_sil, t, dur))
            st_sil = None

    speech_segments = []
    prev_en = 0.0
    for st, en, dur in silence_regions:
        if st > prev_en + 0.25:
            speech_segments.append((prev_en, st))
        prev_en = en
    if duration > prev_en + 0.25:
        speech_segments.append((prev_en, duration))

    print(f"Found {len(speech_segments)} speech segments.")

    # Now let's identify question markers in speech segments
    # A question marker starts with '第' or contains '题' or number
    question_starts = []
    for idx, (st, en) in enumerate(speech_segments):
        txt = recognize_slice(mono_int16, sr_rate, st, min(en, st + 2.2))
        # check if it looks like a question number header
        is_q = bool(re.search(r'第|\b[1-9]|十|题', txt))
        question_starts.append({
            'seg_idx': idx,
            'st': st,
            'en': en,
            'txt': txt,
            'is_q': is_q
        })

    return speech_segments, question_starts, duration, mono_int16, sr_rate

# Run inspection for exam 1 and 2
for eid in [1, 2]:
    segs, q_starts, dur, mono, sr_val = process_exam(eid)
    for q in q_starts:
        print(f"Seg {q['seg_idx']:02d} [{q['st']:5.2f}s -> {q['en']:5.2f}s]: '{q['txt']}' (is_q={q['is_q']})")
