"""仮音声（TTS）の合成。

- エンジン：pyopenjtalk-plus（Open JTalk, MIT / NAIST 辞書 BSD）
- 音声：HTS Voice "Mei"（Nagoya Institute of Technology, CC BY 3.0）
- ネットワーク通信・課金・声の複製は行わない。ローカルで決定的に合成する。

入力：JSON（stdin）
  {"outDir": "...", "gap": 0.55, "speed": 0.92,
   "scenes": [{"id": "c01-s01", "lines": [{"id": "c01-s01-l1", "reading": "..."}]}]}
出力：outDir/<sceneId>.wav（モノラル 16bit）と outDir/<sceneId>.json（行ごとの開始・終了秒）
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np
import pyopenjtalk


def synth(text: str, speed: float):
    x, sr = pyopenjtalk.tts(text, speed=speed)
    return x.astype(np.float64), sr


def trim_silence(x: np.ndarray, sr: int, thresh: float = 120.0, pad: float = 0.04):
    """前後の無音を切り詰め、間（gap）を一定に保つ。"""
    idx = np.where(np.abs(x) > thresh)[0]
    if len(idx) == 0:
        return x
    p = int(pad * sr)
    return x[max(0, idx[0] - p): min(len(x), idx[-1] + p)]


def main():
    job = json.load(sys.stdin)
    out_dir = Path(job["outDir"])
    out_dir.mkdir(parents=True, exist_ok=True)
    gap = float(job.get("gap", 0.55))
    speed = float(job.get("speed", 0.92))
    for scene in job["scenes"]:
        chunks = []
        align = []
        t = 0.0
        sr_out = None
        for i, line in enumerate(scene["lines"]):
            x, sr = synth(line["reading"], speed)
            sr_out = sr
            x = trim_silence(x, sr)
            if i > 0:
                chunks.append(np.zeros(int(gap * sr)))
                t += gap
            start = t
            chunks.append(x)
            t += len(x) / sr
            align.append({"id": line["id"], "start": round(start, 3), "end": round(t, 3)})
        if not chunks:
            continue
        y = np.concatenate(chunks)
        peak = np.max(np.abs(y)) or 1.0
        y = np.clip(y / peak * 0.85 * 32767, -32768, 32767).astype(np.int16)
        wav_path = out_dir / f"{scene['id']}.wav"
        with wave.open(str(wav_path), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(sr_out)
            w.writeframes(y.tobytes())
        (out_dir / f"{scene['id']}.json").write_text(
            json.dumps({"scene": scene["id"], "duration": round(len(y) / sr_out, 3), "lines": align,
                        "engine": "pyopenjtalk-plus / HTS voice Mei (CC BY 3.0)", "speed": speed, "gap": gap},
                       ensure_ascii=False, indent=1),
            encoding="utf-8")
        print(f"{scene['id']}: {len(y) / sr_out:.1f}s", file=sys.stderr)


if __name__ == "__main__":
    main()
