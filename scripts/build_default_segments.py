import miniaudio
import numpy as np
import sys
import json
import os

sys.stdout.reconfigure(encoding='utf-8')

thresholds = {
    1: 0.90,
    2: 1.60,
    3: 1.60,
    4: 1.50,
    5: 0.95,
    6: 1.00
}

def get_silences(mono, sr, min_dur):
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

all_exam_segments = {}

for eid in range(1, 7):
    audio_file = f"public/audio/file nghe {eid}.mp3"
    decoded = miniaudio.decode_file(audio_file)
    sr = decoded.sample_rate
    samples = np.frombuffer(decoded.samples, dtype=np.int16)
    mono = samples.reshape(-1, 2).mean(axis=1) / 32768.0 if decoded.nchannels == 2 else samples / 32768.0
    
    silences, duration = get_silences(mono, sr, thresholds[eid])
    assert len(silences) == 40, f"Expected 40 silences for Exam {eid}, got {len(silences)}"
    
    exam_segs = {}
    print(f"\n=================== EXAM {eid:02d} (Duration {duration:.2f}s) ===================")
    for q in range(1, 21):
        if q == 1:
            q_start = 0.0
        else:
            # Starts right after previous inter-question break: silences[2*q - 3]
            q_start = round(max(0.0, silences[2 * q - 3][1] - 0.05), 2)
            
        if q == 20:
            # Ends at the start of trailing silence: silences[39]
            q_end = round(min(duration, silences[39][0] + 0.15), 2)
        else:
            # Ends at the start of inter-question break: silences[2*q - 1]
            q_end = round(min(duration, silences[2 * q - 1][0] + 0.15), 2)
            
        dur = round(q_end - q_start, 2)
        assert q_start < q_end, f"Invalid segment for Exam {eid} Q{q}: start {q_start} >= end {q_end}"
        if q > 1:
            prev_end = exam_segs[str(q-1)]['end']
            assert q_start >= prev_end - 0.1, f"Overlap between Q{q-1} ({prev_end}) and Q{q} ({q_start})"
            
        exam_segs[str(q)] = {
            "examId": eid,
            "questionNumber": q,
            "start": q_start,
            "end": q_end,
            "status": "confirmed",
            "confirmed": True
        }
        print(f"  Q{q:02d}: {q_start:6.2f}s -> {q_end:6.2f}s (dur: {dur:5.2f}s)")
        
    all_exam_segments[str(eid)] = exam_segs

# Save to src/data/default_audio_segments.json
output_path = "src/data/default_audio_segments.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(all_exam_segments, f, ensure_ascii=False, indent=2)

print(f"\nSuccessfully wrote 120 confirmed segments to {output_path}!")
