#!/usr/bin/env python3
"""Import the verified v1.10.67 source ZIP, then publish through normal Git."""
import argparse
import hashlib
import pathlib
import shutil
import subprocess
import tempfile
import zipfile

EXPECTED = '64dad272f9f02dd7c7c6e677e2528637a9e2050db158ab9808a86c51ddbbee38'
ROOT = pathlib.Path(__file__).resolve().parents[1]

def git(*args):
    return subprocess.run(['git', *args], cwd=ROOT, check=True)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive', nargs='?')
    parser.add_argument('--check', action='store_true', help='Check ZIP only; do not modify or push')
    args = parser.parse_args()
    candidates = list(ROOT.glob('Terha-Conquest-Source-v1.10.67*.zip'))
    if not args.archive and len(candidates) != 1:
        parser.error('Upload exactly one Terha-Conquest-Source-v1.10.67.zip into the repository root, or give its path.')
    archive = pathlib.Path(args.archive).resolve() if args.archive else candidates[0]
    with archive.open('rb') as stream:
        hasher = hashlib.sha256()
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            hasher.update(chunk)
        digest = hasher.hexdigest()
    if digest != EXPECTED:
        raise SystemExit('ZIP does not match the complete v1.10.67 source. Nothing changed.')
    with zipfile.ZipFile(archive) as source:
        files = [i for i in source.infolist() if not i.is_dir()]
        for item in files:
            path = pathlib.PurePosixPath(item.filename)
            if not path.parts or path.parts[0] != 'Terha-Conquest' or '..' in path.parts:
                raise SystemExit('Unexpected ZIP path. Nothing changed.')
        if source.testzip():
            raise SystemExit('Damaged ZIP. Nothing changed.')
        print(f'PASS: complete v1.10.67 archive, {len(files)} files', flush=True)
        if args.check:
            return
        git('diff', '--quiet')
        git('diff', '--cached', '--quiet')
        git('pull', '--ff-only')
        with tempfile.TemporaryDirectory(prefix='terha-import-') as temp:
            source.extractall(temp)
            shutil.copytree(pathlib.Path(temp) / 'Terha-Conquest', ROOT, dirs_exist_ok=True)
    # Stage only project files; the uploaded ZIP remains local and is never committed.
    git('add', '--all', '--', 'game', 'android', 'tools', 'qa', 'build.py', 'README-ko.md')
    changed = subprocess.run(['git', 'diff', '--cached', '--quiet'], cwd=ROOT).returncode
    if changed == 1:
        git('commit', '-m', 'Complete Terha Conquest v1.10.67 source, artwork and audio import')
    elif changed != 0:
        raise SystemExit('Could not inspect staged changes.')
    git('push', 'origin', 'HEAD:main')
    print('DONE: full v1.10.67 source pushed to GitHub.', flush=True)

if __name__ == '__main__':
    main()
