from django.conf import settings
from glob import glob
import os

def reactjs_assets_paths(request):
    staticfiles_base = settings.STATICFILES_BASE
    build_files = settings.REACT_JS_BUILD_DIR
    jspaths = [os.path.relpath(x, start=staticfiles_base) for x in glob(f"{build_files}/*.js")]
    print(f"JS paths: {jspaths}")  # Debugging line to check paths
    csspaths = [os.path.relpath(x, start=staticfiles_base) for x in glob(f"{build_files}/*.css")]
    print(f"CSS paths: {csspaths}")  # Debugging line to check paths
    return {
        "reactjs_assets_js_paths": jspaths,
        "reactjs_assets_css_paths": csspaths,
    }