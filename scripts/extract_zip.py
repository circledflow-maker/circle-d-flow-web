import zipfile
import os
import re

zip_path = 'Docs/stitch_circle_the_flow_main_hub.zip'
extract_to = 'stitch_circle'

def sanitize_filename(name):
    # Replace invalid characters for Windows paths
    return re.sub(r'[<>:"/\\|?*]', '_', name)

def extract_zip(zip_path, extract_to):
    with zipfile.ZipFile(zip_path, 'r') as zf:
        for member in zf.infolist():
            # Original path in zip
            orig_path = member.filename
            
            # Split path into parts to sanitize each component
            parts = orig_path.split('/')
            sanitized_parts = [sanitize_filename(p) for p in parts]
            sanitized_path = os.path.join(*sanitized_parts)
            
            # Full destination path
            dest_path = os.path.join(extract_to, sanitized_path)
            
            if member.is_dir():
                os.makedirs(dest_path, exist_ok=True)
            else:
                parent_dir = os.path.dirname(dest_path)
                os.makedirs(parent_dir, exist_ok=True)
                
                with zf.open(member, 'r') as source, open(dest_path, 'wb') as target:
                    target.write(source.read())
                    
    print(f"Extracted to {extract_to}")

if __name__ == "__main__":
    extract_zip(zip_path, extract_to)
