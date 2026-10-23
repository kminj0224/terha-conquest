"""Embed original MP3 bytes for offline Web Audio; measure only edge silence.

No re-encoding, time stretching, interior cutting or crossfade is applied.
"""
import base64, json, pathlib, re, subprocess

ROOT = pathlib.Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'game/assets'
FILES = ['operation-music-1.mp3', 'operation-last-light.mp3',
         'operation-ghost-trail.mp3', 'operation-music-5.mp3']

def prepare():
    tracks = {}
    for name in FILES:
        path = ASSETS / name
        duration = float(subprocess.check_output([
            'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
            '-of', 'default=nw=1:nk=1', str(path)], text=True).strip())
        result = subprocess.run([
            'ffmpeg', '-nostdin', '-hide_banner', '-i', str(path),
            '-map', '0:a:0', '-af', 'silencedetect=noise=-50dB:d=0.3',
            '-f', 'null', '-'], capture_output=True, text=True, check=True)
        intervals = [(float(a), float(b)) for a, b in re.findall(
            r'silence_start: ([\d.]+).*?silence_end: ([\d.]+)', result.stderr, re.S)]
        start, end = 0.0, duration
        if intervals and intervals[0][0] < .1:
            start = max(0, intervals[0][1] - .02)
        if intervals and intervals[-1][1] >= duration - .1:
            end = intervals[-1][0] + .02
        assert 0 <= start < end <= duration and end - start > 30, name
        tracks[name] = dict(start=start, end=end,
                            data=base64.b64encode(path.read_bytes()).decode('ascii'))
        print(f'{name}: file={duration:.3f}s, playback={start:.3f}..{end:.3f}s')
    (ASSETS / 'operation-music-data.js').write_text(
        "'use strict';\nconst OPERATION_MUSIC_DATA=" + json.dumps(tracks, separators=(',', ':')) + ';\n')

if __name__ == '__main__':
    prepare()
