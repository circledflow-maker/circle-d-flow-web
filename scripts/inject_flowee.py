
import os

PAGES_DIR = r"c:\Users\Utilizador\circle-d-flow-web\pages"
ROOT_DIR = r"c:\Users\Utilizador\circle-d-flow-web"

FLOWEE_SCRIPT = '<script src="../js/agents/flowee.js" defer></script>'
FLOWEE_DIV = '<div id="flowee-agent" class="fixed bottom-8 left-8 z-50 flex flex-col items-center group cursor-pointer"></div>'

# For Index.html (root)
FLOWEE_SCRIPT_ROOT = '<script src="js/agents/flowee.js" defer></script>'

def inject_in_file(filepath, is_root=False):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        updated = False
        
        # Check Script (Flowee)
        script_tag = FLOWEE_SCRIPT_ROOT if is_root else FLOWEE_SCRIPT
        if "agents/flowee.js" not in content:
            if "visual_eye.js" in content:
                content = content.replace('src="../js/agents/visual_eye.js" defer></script>', 'src="../js/agents/visual_eye.js" defer></script>\n    ' + script_tag)
                updated = True
            elif "</body>" in content:
                content = content.replace('</body>', '    ' + script_tag + '\n</body>')
                updated = True
        
        # Check Script (Bridge Pusher)
        pusher_tag = '<script src="js/agents/bridge_pusher.js" defer></script>' if is_root else '<script src="../js/agents/bridge_pusher.js" defer></script>'
        if "agents/bridge_pusher.js" not in content:
            if "agents/flowee.js" in content: # Inject after Flowee
                 content = content.replace('agents/flowee.js" defer></script>', 'agents/flowee.js" defer></script>\n    ' + pusher_tag)
                 updated = True
            elif "</body>" in content:
                content = content.replace('</body>', '    ' + pusher_tag + '\n</body>')
                updated = True

        # Check Script (Helper)
        helper_tag = '<script src="js/agents/helper.js" defer></script>' if is_root else '<script src="../js/agents/helper.js" defer></script>'
        if "agents/helper.js" not in content:
             if "agents/visual_eye.js" in content: # Inject after Visual Eye (Helper often pairs with Eye)
                 content = content.replace('agents/visual_eye.js" defer></script>', 'agents/visual_eye.js" defer></script>\n    ' + helper_tag)
                 updated = True
             elif "</body>" in content:
                content = content.replace('</body>', '    ' + helper_tag + '\n</body>')
                updated = True
                
        # Check Div
        if 'id="flowee-agent"' not in content:
            if "</body>" in content:
                content = content.replace('</body>', '    ' + FLOWEE_DIV + '\n</body>')
                updated = True

        if updated:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Injected Flowee into: {os.path.basename(filepath)}")
        else:
            print(f"Skipped (Already Present): {os.path.basename(filepath)}")

    except Exception as e:
        print(f"Error processing {filepath}: {e}")

def main():
    # 1. Process Root Index.html
    index_path = os.path.join(ROOT_DIR, "Index.html")
    if os.path.exists(index_path):
        inject_in_file(index_path, is_root=True)

    # 2. Process Pages
    for filename in os.listdir(PAGES_DIR):
        if filename.endswith(".html"):
            inject_in_file(os.path.join(PAGES_DIR, filename))

if __name__ == "__main__":
    main()
