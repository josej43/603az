from pathlib import Path

def test_website_assets_present():
    root=Path(__file__).resolve().parents[1]
    html=(root/'website/index.html').read_text()
    for name in ['config.js','auth.js','api.js','app.js','motion.js','auth-ui.js','reports-ui.js']:
        assert name in html
        assert (root/'website/assets/js'/name).exists()

def test_cloudformation_password_flow():
    root=Path(__file__).resolve().parents[1]
    assert 'ALLOW_USER_PASSWORD_AUTH' in (root/'cloudformation/updated-stack.yaml').read_text()
