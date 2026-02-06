
import os
import sys

# Force UTF-8 for Windows consoles
sys.stdout.reconfigure(encoding='utf-8')

def main():
    print(f"[SHADOW] The Herald (SEO Agent) online.")
    print("-" * 40)
    
    html_files = [f for f in os.listdir('.') if f.endswith('.html')]
    if os.path.exists('pages'):
        html_files += [os.path.join('pages', f) for f in os.listdir('pages') if f.endswith('.html')]
    
    issues_found = 0
    
    for file in html_files:
        if not os.path.exists(file): continue
        
        try:
            with open(file, 'r', encoding='utf-8') as f:
                content = f.read()
        except:
            print(f"  [ERROR] Could not read {file}")
            continue
            
        missing = []
        if '<meta name="description"' not in content:
            missing.append("Meta Description")
        
        # Check for OG title as a proxy for social tags
        if '<meta property="og:title"' not in content:
            missing.append("OG Title")
            
        if missing:
            issues_found += 1
            print(f"  [ALERT] {file} missing: {', '.join(missing)}")
        else:
            print(f"  [OK] {file}")
            
    print("-" * 40)
    if issues_found == 0:
        print("[SUCCESS] All systems SEO optimized.")
    else:
        print(f"[ALERT] {issues_found} SEO vulnerabilities detected.")

if __name__ == "__main__":
    main()
