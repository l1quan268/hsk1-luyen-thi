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

def align_exam(eid):
    audio_file = f"public/audio/file nghe {eid}.mp3"
    print(f"\nAligning Exam {eid}...")
    decoded = miniaudio.decode_file(audio_file)
    sr = decoded.sample_rate
    samples = np.frombuffer(decoded.samples, dtype=np.int16)
    mono = samples.reshape(-1, 2).mean(axis=1) / 32768.0 if decoded.nchannels == 2 else samples / 32768.0
    mono_int16 = samples.reshape(-1, 2).mean(axis=1).astype(np.int16) if decoded.nchannels == 2 else samples
    duration = len(mono) / sr

    # Step 1: Detect silences >= 0.8s
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

    # Look for question markers
    # We test speech segments after silences
    # A candidate start is t=0 or t=silence_end
    candidate_starts = [0.0] + [s[1] for s in silences[:-1]]
    
    # Recognize first 1.8s of candidate starts to find "第X题"
    found_questions = {}
    for c_st in candidate_starts:
        txt = recognize_slice(mono_int16, sr, c_st, c_st + 2.0)
        # Match Chinese question number
        m = re.search(r'第([一二三四五六七八九十\d]+)题?', txt)
        if m:
            num_str = m.group(1)
            # convert Chinese numeral or digit
            num = None
            if num_str.isdigit():
                num = int(num_str)
            else:
                cn_map = {'一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
                          '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15, '十六': 16, '十七': 17, '十八': 18, '十九': 19, '二十': 20}
                num = cn_map.get(num_str)
            if num and 1 <= num <= 20 and num not in found_questions:
                found_questions[num] = (c_st, txt)

    print(f"Exam {eid}: directly identified {len(found_questions)}/20 question markers via ASR.")
    return found_questions, silences, duration

align_exam(1)
align_exam(2)
