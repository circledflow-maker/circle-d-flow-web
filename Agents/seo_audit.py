
import os
import re

def scan_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    issues = []
    
    # 1. Check Title
    if '<title>' not in content or '</title>' not in content:
        issues.append("Missing <title> tag")
    
    # 2. Check Meta Description
    if '<meta name="description"' not in content:
        issues.append("Missing <meta name='description'>")
        
    # 3. Check OpenGraph
    if 'property="og:image"' not in content:
        issues.append("Missing OpenGraph Image")
        
    return issues

def main():
    print(f"[{'SHADOW'}] The Herald (SEO Agent) online.")
    print("-" * 40)
    
    files = [f for f in os.listdir('.') if f.endswith('.html')]
    files += [os.path.join('pages', f) for f in os.listdir('pages') if f.endswith('.html')]
    
    total_issues = 0
    
    for file in files:
        if not os.path.exists(file): continue
        
        issues = scan_file(file)
        if issues:
            print(f"❌ {file}:")
            for issue in issues:
                print(f"  - {issue}")
            total_issues += len(issues)
        else:
            print(f"✅ {file}")
            
    print("-" * 40)
    if total_issues == 0:
        print("[SUCCESS] All systems SEO optimized.")
    else:
        print(f"[ALERT] {total_issues} SEO vulnerabilities detected.")

if __name__ == "__main__":
    main()
