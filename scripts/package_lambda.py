from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
root = Path(__file__).resolve().parents[1]
out = root / 'dist' / 'civicpulse-lambda.zip'
out.parent.mkdir(exist_ok=True)
with ZipFile(out, 'w', ZIP_DEFLATED) as z:
    z.write(root / 'backend' / 'index.py', 'index.py')
print(f'Created {out}')
