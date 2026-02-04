import os

def fix_paths(directory):
    count = 0
    for filename in os.listdir(directory):
        if not filename.endswith(".html"):
            continue
            
        filepath = os.path.join(directory, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        original_content = content
        
        # Replacements for files in pages/ to point back to root
        # 1. Links to Index
        content = content.replace('href="Index.html', 'href="../Index.html')
        content = content.replace('href="index.html', 'href="../Index.html')
        
        # 2. Assets (Images/Audio)
        # Fix case sensitivity and path
        content = content.replace('src="assets/', 'src="../Assets/')
        content = content.replace('href="assets/', 'href="../Assets/')
        content = content.replace('src="Assets/', 'src="../Assets/')
        content = content.replace('href="Assets/', 'href="../Assets/')
        
        # 3. CSS
        content = content.replace('href="css/', 'href="../css/')
        content = content.replace('href="styles.css"', 'href="../css/styles.css"')
        
        # 4. JS
        content = content.replace('src="js/', 'src="../js/')
        # Specific files often missing prefix
        js_files = ['script.js', 'gamification.js', 'onboarding.js', 'ai_assistant.js', 'manga.js', 'notifications.js', 'quest-manager.js']
        for js in js_files:
            # Replace src="script.js" with src="../js/script.js"
            # Use regex or careful replacement to avoid replacing "js/script.js" -> "js/../js/script.js"
            if f'src="{js}"' in content:
                content = content.replace(f'src="{js}"', f'src="../js/{js}"')

        # Specific CSS fixes
        if 'href="manga-gallery.css"' in content:
            content = content.replace('href="manga-gallery.css"', 'href="../css/manga-gallery.css"')
            
        # Specific JS fixes
        if 'src="gallery.js"' in content:
             content = content.replace('src="gallery.js"', 'src="../js/gallery.js"')

        # 5. Fix double fixes (if any existed or were created)
        content = content.replace('../../', '../') 
        # Fix triple up if happened
        content = content.replace('../../../', '../') 

        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed paths in: {filename}")
            count += 1
            
    print(f"Fixed {count} files.")

if __name__ == "__main__":
    base_dir = os.getcwd()
    pages_dir = os.path.join(base_dir, "pages")
    if os.path.exists(pages_dir):
        fix_paths(pages_dir)
    else:
        print("Pages directory not found.")
