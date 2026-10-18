from pathlib import Path
import re
p=Path(__file__).resolve().parents[1]
c=(p/'website/assets/js/config.js').read_text()
for name in ['apiUrl','region','userPoolId','userPoolClientId']:
    assert re.search(rf'{name}:\s*\'[^\']+\'',c),f'Missing {name}'
assert 'REPLACE_WITH' not in c
print('Config keys present. Verify the Cognito identifiers manually against CloudFormation Outputs.')
