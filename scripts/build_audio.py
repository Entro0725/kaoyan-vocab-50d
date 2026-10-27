#!/usr/bin/env python3
"""Prebuild two English pronunciation atlases, shipped INSIDE the Android APK.
No system speech engine, voice pack, network service, or cloud voice API is needed.
Uses eSpeak NG to render sound and FFmpeg to encode compact MP3 packs.
"""
import argparse
import io
import json
import math
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import wave

ROOT = Path(__file__).resolve().parent.parent
PACK_SIZE = 80
SAMPLE_RATE = 22050
BEFORE_MS = 120
AFTER_MS = 330

def vocab_list():
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    match = re.search(r'window\.__vocab=(\[[^\n]*\]);', html)
    if not match:
        raise RuntimeError("Cannot find embedded word list")
    words = json.loads(match.group(1))
    if len(words) != 4924 or any(w['id'] != i + 1 for i, w in enumerate(words)):
        raise RuntimeError("Unexpected vocabulary order or size")
    return words

def normalized(word):
    return re.sub(r'\s*/\s*', ', ', word).replace('_', ' ')

def make_audio(words, limit=None):
    command = shutil.which('espeak-ng') or shutil.which('espeak')
    ffmpeg = shutil.which('ffmpeg')
    if not command or not ffmpeg:
        raise RuntimeError('Both espeak-ng (or espeak) and ffmpeg are required')
    if limit:
        words = words[:limit]
    dest = ROOT / 'dist' / 'audio'
    dest.mkdir(parents=True, exist_ok=True)
    manifest = {'version': 1, 'packSize': PACK_SIZE, 'wordCount': len(words), 'voices': {}}
    before = b'\0\0' * round(BEFORE_MS * SAMPLE_RATE / 1000)
    after = b'\0\0' * round(AFTER_MS * SAMPLE_RATE / 1000)
    for accent, voice in [('en-US', 'en-us'), ('en-GB', 'en-gb')]:
        folder = dest / accent
        folder.mkdir(exist_ok=True)
        entries = []
        for pack in range(math.ceil(len(words) / PACK_SIZE)):
            block = words[pack * PACK_SIZE:(pack + 1) * PACK_SIZE]
            wavpath = Path(tempfile.gettempdir()) / f'kaoyan-audio-{accent}-{os.getpid()}.wav'
            frames = 0
            with wave.open(str(wavpath), 'wb') as out:
                out.setnchannels(1)
                out.setsampwidth(2)
                out.setframerate(SAMPLE_RATE)
                for word in block:
                    sentence = normalized(word['word'])
                    generated = subprocess.run(
                        [command, '-v', voice, '-s', '157', '-a', '140', '--stdout', sentence],
                        check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE
                    )
                    with wave.open(io.BytesIO(generated.stdout), 'rb') as source:
                        if (source.getnchannels(), source.getsampwidth(), source.getframerate()) != (1, 2, SAMPLE_RATE):
                            raise RuntimeError(f'Unsupported audio layout: {word["word"]}')
                        pcm = source.readframes(source.getnframes())
                    start = round(1000 * frames / SAMPLE_RATE)
                    out.writeframes(before)
                    out.writeframes(pcm)
                    frames += (len(before) + len(pcm)) // 2
                    end = round(1000 * frames / SAMPLE_RATE) + 60
                    entries.append([pack, start, end])
                    out.writeframes(after)
                    frames += len(after) // 2
            target = folder / f'{pack:03d}.mp3'
            subprocess.run(
                [ffmpeg, '-hide_banner', '-loglevel', 'error', '-nostdin', '-y',
                 '-i', str(wavpath), '-ar', str(SAMPLE_RATE), '-ac', '1',
                 '-codec:a', 'libmp3lame', '-b:a', '32k', '-write_xing', '0', str(target)],
                check=True, stdout=subprocess.DEVNULL
            )
            wavpath.unlink(missing_ok=True)
            if (pack + 1) % 10 == 0:
                print(f'{accent}: generated {pack + 1} audio packs', flush=True)
        if len(entries) != len(words):
            raise AssertionError('Voice pack incomplete')
        manifest['voices'][accent] = entries
    (dest / 'voice-map.json').write_text(
        json.dumps(manifest, ensure_ascii=False, separators=(',', ':')), encoding='utf-8'
    )
    size = sum(p.stat().st_size for p in dest.rglob('*.mp3'))
    print(f'Offline audio ready: {len(words)} words x 2 accents, {size / 1048576:.1f} MiB', flush=True)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--limit', type=int, help='Build the first N words for smoke testing')
    args = parser.parse_args()
    make_audio(vocab_list(), args.limit)
