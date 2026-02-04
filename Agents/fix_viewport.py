
import os

def fix_viewport_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Double check if it already exists
    if '<meta name="viewport"' in content:
        return False

    # Inject inside <head>
    if '<head>' in content:
        print(f"  [FIXING] Injecting viewport into {filepath}")
        new_content = content.replace('<head>', '<head>\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">')
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    else:
        print(f"  [WARNING] No <head> tag found in {filepath}. Skipping.")
        return False

def main():
    print(f"[{'MOBILE PROTOCOL'}] Initiating Viewport Injection...")
    print("-" * 40)
    
    html_files = [f for f in os.listdir('.') if f.endswith('.html')]
    html_files += [os.path.join('pages', f) for f in os.listdir('pages') if f.endswith('.html')]
    
    fixed_count = 0
    
    for file in html_files:
        if not os.path.exists(file): continue
        if fix_viewport_in_file(file):
            fixed_count += 1
            
    print("-" * 40)
    print(f"[SUCCESS] Mobile Protocol Complete. Fixed {fixed_count} files.")

if __name__ == "__main__":
    main()
