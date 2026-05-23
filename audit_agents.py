import os
import re

# Directory to scan
ROOT_DIR = r"d:\circle-d-flow-web"
# Agents to ensure are present
AGENTS = {
    'global_ticker.js': '<script src="js/agents/global_ticker.js" defer></script>',
    'imperial_hud.js': '<script src="js/agents/imperial_hud.js" defer></script>'
}

# Page specific agents (Manual logic or separate dict if needed)
PAGE_AGENTS = {
    "battle.html": ["pusher.js", "helper.js", "referee.js"],
    "arena.html": ["pusher.js", "helper.js", "referee.js"],
    "quiz.html": ["pusher.js", "helper.js", "brain.js"],
    "quiz_creation.html": ["pusher.js", "helper.js", "brain.js"],
    "library.html": ["pusher.js", "helper.js", "brain.js"]
}

# Pages to skip or treat specially if needed
SKIP_FILES = []

def audit_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    modified = False

    # Check for <head> and <body>
    if '</body>' not in content:
        print(f"Skipping {filepath}: No body tag found.")
        return

    # Check/Inject each agent
    # We want to insert them before the closing </body> tag
    # But checking if they already exist randomly in the file
    
    scripts_to_add = []
    
    for agent_file, agent_tag in AGENTS.items():
        # Regex to find script src="...agent_file"
        pattern = re.compile(f'src=["\'].*{re.escape(agent_file)}["\']', re.IGNORECASE)
        
        if not pattern.search(content):
            print(f"[{os.path.basename(filepath)}] INJECTING {agent_file}")
            # Fix path based on depth
            # If file is in subfolder 'pages/', path should be '../js/agents/'
            # If file is in root, path should be 'js/agents/'
            
            is_in_pages = 'pages' in filepath
            
            if is_in_pages:
                 src_path = f"../js/agents/{agent_file}"
            else:
                 src_path = f"js/agents/{agent_file}"
                 
            tag = f'<script src="{src_path}" defer></script>'
            scripts_to_add.append(tag)

    if scripts_to_add:
        # Find </body>
        split_point = content.rfind('</body>')
        if split_point != -1:
            new_scripts = "\n    <!-- AUTOMATED AGENT INJECTION -->\n    " + "\n    ".join(scripts_to_add) + "\n"
            content = content[:split_point] + new_scripts + content[split_point:]
            modified = True

    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"SUCCESS: Updated {filepath}")
    else:
        print(f"OK: {os.path.basename(filepath)} is up to date.")

def main():
    print("Starting Agent Audit...")
    for root, dirs, files in os.walk(ROOT_DIR):
        for file in files:
            if file.endswith(".html"):
                full_path = os.path.join(root, file)
                audit_file(full_path)

if __name__ == "__main__":
    main()
