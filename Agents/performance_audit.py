
import os
import re

MAX_IMG_SIZE_KB = 500
MAX_CODE_SIZE_KB = 50

def get_file_size_kb(filepath):
    return os.path.getsize(filepath) / 1024

def scan_assets():
    print("  [Scanning Assets...]")
    issues = []
    assets_dir = os.path.join('Assets', 'images')
    if not os.path.exists(assets_dir):
        return ["Assets directory not found!"]

    for root, dirs, files in os.walk(assets_dir):
        for file in files:
            if file.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                filepath = os.path.join(root, file)
                size = get_file_size_kb(filepath)
                if size > MAX_IMG_SIZE_KB:
                    issues.append(f"Heavy Image: {file} ({size:.1f}KB > {MAX_IMG_SIZE_KB}KB)")
    return issues

def scan_code():
    print("  [Scanning Code...]")
    issues = []
    for root, dirs, files in os.walk('.'):
        if 'node_modules' in root or '.git' in root: continue
        for file in files:
            if file.endswith(('.js', '.css')):
                filepath = os.path.join(root, file)
                size = get_file_size_kb(filepath)
                if size > MAX_CODE_SIZE_KB:
                    issues.append(f"Heavy Code: {file} ({size:.1f}KB > {MAX_CODE_SIZE_KB}KB)")
    return issues

def scan_cls():
    print("  [Scanning for CLS Triggers...]")
    issues = []
    html_files = [f for f in os.listdir('.') if f.endswith('.html')]
    html_files += [os.path.join('pages', f) for f in os.listdir('pages') if f.endswith('.html')]
    
    img_tag_pattern = re.compile(r'<img\s+([^>]+)>')
    
    for file in html_files:
        if not os.path.exists(file): continue
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        tags = img_tag_pattern.findall(content)
        for tag in tags:
            # Check for width and height
            if 'width=' not in tag or 'height=' not in tag:
                # heuristics: ignore lazy loaded or small icons might be ok, but strict rule says NO.
                # simpler heuristic: if it has a class usually it's handled by CSS, but explicit dims are best.
                # We will flag it.
                if 'class="indicator' in tag: continue # Carousel dots
                
                issues.append(f"Possible CLS in {file}: <img> missing width/height")
                # Break after first issue per file to reduce noise
                break
                
    return issues

def main():
    print(f"[{'BIG BROTHER'}] Performance Oversight online.")
    print("-" * 40)
    
    all_issues = []
    all_issues += scan_assets()
    all_issues += scan_code()
    all_issues += scan_cls()
    
    if all_issues:
        print(f"[ALERT] Found {len(all_issues)} performance violations:")
        for issue in all_issues[:10]: # Limit output
            print(f"  - {issue}")
        if len(all_issues) > 10:
            print(f"  ... and {len(all_issues) - 10} more.")
            
        # Exit with error code to signal Phoenix
        exit(1) 
    else:
        print("[SUCCESS] Performance within parameters.")
        exit(0)

if __name__ == "__main__":
    main()
