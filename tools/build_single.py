# Bina satu fail HTML (untuk demo/artifact): python3 tools/build_single.py <keluar.html> [--demo]
import re, sys, os
root = os.path.join(os.path.dirname(__file__), '..')
out, demo = sys.argv[1], '--demo' in sys.argv
s = open(os.path.join(root, 'index.html'), encoding='utf-8').read()
def js(m):
    src = m.group(1)
    if src == 'vendor/three.min.js':
        return '<script src="https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js"></script>'
    code = open(os.path.join(root, src), encoding='utf-8').read()
    if demo and src == 'js/config.js':
        code = code.replace("const IS_DEV = location.protocol", "const IS_DEV = true || location.protocol")
    return '<script>\n' + code.replace('</script', '<\\/script') + '\n</script>'
s = re.sub(r'<script src="([^"]+)"></script>', js, s)
css = open(os.path.join(root, 'style.css'), encoding='utf-8').read()
s = s.replace('<link rel="stylesheet" href="style.css">', '<style>\n' + css + '\n</style>')
s = re.sub(r'<link rel="(manifest|icon)"[^>]*>\n', '', s)
if demo:
    # artifact: kerangka HTML disediakan oleh hos
    s = re.sub(r'<!DOCTYPE html>\s*<html[^>]*>\s*<head>\s*', '', s)
    s = re.sub(r'<meta (charset|name="viewport")[^>]*>\n', '', s)
    s = s.replace('</head>\n<body>\n', '').replace('</body>\n</html>', '')
open(out, 'w', encoding='utf-8').write(s)
print(out, len(s) // 1024, 'KB')
