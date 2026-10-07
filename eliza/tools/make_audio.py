#!/usr/bin/env python3
"""Procedural audio bed for the show-off template: a breathing drone (4 s in / 6 s out),
kick-like hits on the beats and soft chimes on the text lines. Needs numpy.

    python3 eliza/tools/make_audio.py --out drone_hits_20s.wav
"""
import argparse, wave
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("--out", default="drone_hits_20s.wav")
ap.add_argument("--seconds", type=float, default=20.0)
ap.add_argument("--in-sec", type=float, default=4.0)
ap.add_argument("--out-sec", type=float, default=6.0)
ap.add_argument("--hits", default="6.4:0.7,8.0:1.0,9.2:0.6,11.4:0.5,13.0:1.0,14.6:0.9,17.0:0.6", help="time:amp,...")
ap.add_argument("--chimes", default="1.0,2.4,3.8,5.2", help="times of soft chimes")
ap.add_argument("--seed", type=int, default=7)
a = ap.parse_args()

sr = 48000; T = a.seconds; n = int(sr * T); t = np.arange(n) / sr
c = a.in_sec + a.out_sec; ph = t % c
br = np.where(ph < a.in_sec, (1 - np.cos(np.pi * ph / a.in_sec)) / 2, (1 + np.cos(np.pi * (ph - a.in_sec) / a.out_sec)) / 2)
drone = (0.22 * np.sin(2 * np.pi * 55 * t) + 0.14 * np.sin(2 * np.pi * 82.41 * t + 0.3) + 0.07 * np.sin(2 * np.pi * 110.3 * t)
         + 0.05 * np.sin(2 * np.pi * 164.8 * t + np.sin(2 * np.pi * 0.13 * t)))
drone *= (0.55 + 0.45 * br)
drone *= np.clip(t / 2.5, 0, 1) * np.clip((T - t) / 1.5, 0, 1)
out = drone.copy()
rng = np.random.default_rng(a.seed)

def hit(t0, amp=1.0, f=58, dec=0.5, noise=0.25):
    i0 = int(t0 * sr); m = int(sr * 1.6); tt = np.arange(m) / sr
    pitch = f * (1 + 1.5 * np.exp(-tt * 25))
    s = np.sin(2 * np.pi * np.cumsum(pitch) / sr) * np.exp(-tt / dec)
    nz = rng.standard_normal(m); nz = np.convolve(nz, np.ones(40) / 40, 'same') * np.exp(-tt / 0.08) * noise * 4
    e = min(n, i0 + m); out[i0:e] += ((s + nz) * amp)[:e - i0]

for h in filter(None, a.hits.split(",")):
    tm, _, amp = h.partition(":"); hit(float(tm), float(amp or 1))
for b in filter(None, a.chimes.split(",")):
    i0 = int(float(b) * sr); m = min(int(sr * 1.2), n - i0); tt = np.arange(m) / sr
    out[i0:i0 + m] += 0.06 * np.sin(2 * np.pi * 440 * tt) * np.exp(-tt / 0.5) * np.clip(tt / 0.02, 0, 1)
out = out / np.max(np.abs(out)) * 0.8
d = (np.stack([out, out], 1) * 32767).astype(np.int16)
w = wave.open(a.out, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr); w.writeframes(d.tobytes()); w.close()
print(a.out)
