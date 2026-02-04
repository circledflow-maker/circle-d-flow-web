
import os
import re

def scan_viewports():
    print("  [Scanning Viewports...]")
    issues = []
    html_files = [f for f in os.listdir('.') if f.endswith('.html')]
    html_files += [os.path.join('pages', f) for f in os.listdir('pages') if f.endswith('.html')]
    
    for file in html_files:
        if not os.path.exists(file): continue
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if '<meta name="viewport"' not in content:
             issues.append(f"Missing Viewport Meta Tag: {file}")
             
    return issues

def scan_css_targets():
    print("  [Scanning CSS Tap Targets...]")
    issues = []
    css_files = [os.path.join('css', f) for f in os.listdir('css') if f.endswith('.css')]
    
    # Simple heuristic: Look for small heights/paddings in buttons/links
    # This is rough static analysis.
    
    small_target_regex = re.compile(r'(height|padding|width)\s*:\s*([0-9]+)px')
    
    for file in css_files:
        if not os.path.exists(file): continue
        with open(file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        for i, line in enumerate(lines):
            if 'btn' in line or 'button' in line or 'a {' in line:
                # We are in a clickable block (guessing)
                match = small_target_regex.search(line)
                if match:
                    prop, val = match.groups()
                    if int(val) < 10 and prop == 'padding': 
                         pass # might be ok
                    elif int(val) < 24 and (prop == 'height' or prop == 'width'):
                         issues.append(f"Potential Small Tap Target {file}:{i+1} ({prop}: {val}px)")
                         
    return issues

def main():
    print(f"[{'SENTINEL'}] Mobile Code Inspector online.")
    print("-" * 40)
    
    all_issues = []
    all_issues += scan_viewports()
    all_issues += scan_css_targets()
    
    if all_issues:
        print(f"[ALERT] Found {len(all_issues)} mobile usability risks:")
        for issue in all_issues:
            print(f"  - {issue}")
        exit(1)
    else:
        print("[SUCCESS] Mobile readiness confirmed.")
        exit(0)

if __name__ == "__main__":
    main()
