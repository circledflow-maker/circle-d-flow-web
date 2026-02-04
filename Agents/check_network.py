import os
import re

def check_file_links(filepath, base_dir):
    """
    Scans a file for href/src links and checks if they exist locally.
    """
    issues = []
    
    if not os.path.exists(filepath):
        return [f"CRITICAL: File not found {filepath}"]

    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    # Find matches for href="..." and src="..."
    # Simple regex, might miss some JS dynamic imports but covers HTML standard
    links = re.findall(r'(?:href|src)=["\']([^"\']+)["\']', content)

    for link in links:
        # Ignore external links, anchors, and scripts/voids
        if link.startswith(('http', '//', '#', 'mailto:', 'tel:', 'javascript:')):
            continue
        
        # Calculate absolute path
        # If starts with /, it's relative to root (base_dir)
        # If relative, it's relative to the file's directory
        
        if link.startswith('/'):
            target_path = os.path.join(base_dir, link.lstrip('/'))
        else:
            current_dir = os.path.dirname(filepath)
            target_path = os.path.join(current_dir, link)

        # Normalize path
        target_path = os.path.normpath(target_path)
        
        # Remove query params ?v=...
        if '?' in target_path:
            target_path = target_path.split('?')[0]
            
        # Remove anchors #...
        if '#' in target_path:
            target_path = target_path.split('#')[0]
            
        if not os.path.exists(target_path):
            issues.append(f"  [404] {link} (in {os.path.basename(filepath)})")

    return issues

if __name__ == "__main__":
    base_dir = os.getcwd()
    print(f"--- Starting Network Check Agent ---")
    print(f"Root: {base_dir}")

    all_issues = []

    # 1. Check Index.html
    index_path = os.path.join(base_dir, "Index.html")
    print(f"Scanning Index.html...")
    all_issues.extend(check_file_links(index_path, base_dir))

    # 2. Check Pages directory
    pages_dir = os.path.join(base_dir, "pages")
    if os.path.exists(pages_dir):
        for filename in os.listdir(pages_dir):
            if filename.endswith(".html"):
                print(f"Scanning pages/{filename}...")
                file_path = os.path.join(pages_dir, filename)
                all_issues.extend(check_file_links(file_path, base_dir))
    
    # Report
    print("\n--- Network Report ---")
    if all_issues:
        print(f"Found {len(all_issues)} broken links:")
        for issue in all_issues:
            print(issue)
    else:
        print("✅ Network Integrity Verified: No broken links found.")
    print("----------------------")
