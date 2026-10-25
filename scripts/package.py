from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json
root = Path(__file__).resolve().parent.parent
manifest = json.loads((root / 'extension/manifest.json').read_text())
out = root / 'artifacts' / ('sorcerii-capture-' + manifest['version'] + '.zip')
out.parent.mkdir(exist_ok=True)
with ZipFile(out, 'w', ZIP_DEFLATED) as archive:
    for file in sorted((root / 'extension').rglob('*')):
        if file.is_file():
            archive.write(file, file.relative_to(root / 'extension'))
    archive.write(root / 'INSTALL.md', 'INSTALL.md')
print(str(out))
