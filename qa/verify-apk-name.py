"""Read the built binary Android manifest and verify the installed app identity."""
import pathlib, struct, sys, zipfile

with zipfile.ZipFile(sys.argv[1]) as apk:
    data = apk.read('AndroidManifest.xml')
    assert struct.unpack_from('<HHI', data) == (3, 8, len(data))
    strings, elements, offset = [], {}, 8
    while offset < len(data):
        kind, header, size = struct.unpack_from('<HHI', data, offset)
        assert size >= header and offset + size <= len(data)
        if kind == 1:
            count, styles, flags, start, _ = struct.unpack_from('<IIIII', data, offset + 8)
            assert flags & 0x100 == 0 and styles == 0
            for index in range(count):
                pos = offset + start + struct.unpack_from('<I', data, offset + header + 4 * index)[0]
                length = struct.unpack_from('<H', data, pos)[0]
                assert length < 0x8000
                assert data[pos + 2 + length * 2:pos + 4 + length * 2] == b'\0\0'
                strings.append(data[pos + 2:pos + 2 + length * 2].decode('utf-16le'))
        elif kind == 0x102:
            name = strings[struct.unpack_from('<I', data, offset + 20)[0]]
            start, width, count = struct.unpack_from('<HHH', data, offset + 24)
            attrs = {}
            for index in range(count):
                pos = offset + 16 + start + width * index
                key = strings[struct.unpack_from('<I', data, pos + 4)[0]]
                typ, value = data[pos + 15], struct.unpack_from('<I', data, pos + 16)[0]
                attrs[key] = strings[value] if typ == 3 else value
            elements[name] = attrs
        offset += size
    assert offset == len(data)
    assert elements['manifest']['package'] == 'com.terha.conquest'
    assert elements['manifest']['versionName'] == '1.11.84'
    assert elements['manifest']['versionCode'] == 229
    assert elements['application']['label'] == '테르하 : 낙원의 기억'
    assert 'label' not in elements['activity'] or elements['activity']['label'] == '테르하 : 낙원의 기억'
    for name in ['index.html', 'app-shell.js', 'game.js']:
        text = apk.read('assets/' + name).decode()
        assert '테르하 : 낙원의 기억' in text
        assert '전장의 국권' not in text
    assert '<title>테르하 : 낙원의 기억</title>' in apk.read('assets/index.html').decode()
print('PASS: APK launcher name, title, versionCode 229, version 1.11.84 and original package identity')
