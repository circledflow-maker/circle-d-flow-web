import os
import re

ROOT_DIR = r"d:\circle-d-flow-web"

AGENTS_BASE = [
    'js/agents/pusher.js',
    'js/agents/helper.js',
    'js/agents/global_ticker.js',
    'js/agents/network_hub.js',
    'js/agents/constructor_bot.js',
    'js/agents/kingdom_science.js',
    'js/agents/resonance_bridge.js',
    "js/agents/vault_space.js",
    "js/agents/horizon_bar.js",
    "js/agents/social_matrix.js",
    "js/agents/flowee.js",
    "js/agents/orbital_menu.js",
    "js/agents/tutorial_core.js",
    "js/agents/quest_controller.js",
    "js/agents/visual_integrity.js",
    "js/agents/sound_engineer.js"
]

# DYNAMICALLY FIND ALL HTML FILES
# This ensures new pages like imperial_dashboard.html are automatically included
def find_html_files():
    files = []
    for root, _, filenames in os.walk(ROOT_DIR):
        for filename in filenames:
            if filename.endswith(".html"):
                full_path = os.path.join(root, filename)
                # Make path relative to ROOT_DIR
                relative_path = os.path.relpath(full_path, ROOT_DIR)
                files.append(relative_path)
    return files

TARGET_FILES = find_html_files()
print(f"Found {len(TARGET_FILES)} HTML files to audit.")

def get_script_tag(agent_path, rel_path):
    if rel_path.startswith("pages/") or rel_path.startswith("pages\\"):
        prefix = "../"
    else:
        prefix = ""
    return f'<script src="{prefix}{agent_path}" defer></script>'

def inject_agents():
    for rel_path in TARGET_FILES:
        filepath = os.path.join(ROOT_DIR, rel_path)
        if not os.path.exists(filepath):
            print(f"Skipping {rel_path} (Not Found)")
            continue
            
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        modified = False
        
        for agent in AGENTS_BASE:
            agent_filename = agent.split('/')[-1]
            
            # loose check to see if the agent is already there (ignoring path differences for now to avoid duplicates)
            if agent_filename in content:
                continue

            # Exclude HUD/UI agents from cinematic pages
            if rel_path.lower() in ['index.html', 'beta-initiation.html', 'pages\\dashboard.html', 'pages/dashboard.html', 'pages\\vision_sanctuary.html', 'pages/vision_sanctuary.html', 'pages\\marketplace.html', 'pages/marketplace.html', 'pages\\memory_cave.html', 'pages/memory_cave.html', 'pages\\portfolio_anime_reality.html', 'pages/portfolio_anime_reality.html'] and agent_filename in ['global_ticker.js', 'horizon_bar.js', 'social_matrix.js', 'orbital_menu.js', 'tutorial_core.js', 'flowee.js', 'network_hub.js', 'constructor_bot.js', 'kingdom_science.js', 'resonance_bridge.js', 'vault_space.js']:
                continue

            script_tag = get_script_tag(agent, rel_path)
            print(f"Injecting {agent_filename} into {rel_path}")
            
            if 'flowee.js' in content:
                 # Inject before Flowee
                 content = re.sub(r'(<script.*flowee\.js.*)', f'{script_tag}\n    \\1', content, count=1)
            else:
                 # Fallback: End of body
                 content = content.replace('</body>', f'{script_tag}\n</body>')
            modified = True
        
        if modified:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated {rel_path}")
        else:
            print(f"Checked {rel_path} (OK)")

if __name__ == "__main__":
    inject_agents()
