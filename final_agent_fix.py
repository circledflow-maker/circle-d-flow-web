import os

def final_agent_fix():
    root_dir = "c:\\Users\\Utilizador\\circle-d-flow-web"
    
    agents = [
        {'name': 'pusher.js', 'src': 'js/agents/pusher.js'},
        {'name': 'helper.js', 'src': 'js/agents/helper.js'}
    ]
    
    modified_count = 0
    
    for subdir, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith('.html'):
                filepath = os.path.join(subdir, file)
                
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        lines = f.readlines()
                    
                    content = "".join(lines).lower()
                    
                    # Determine prefix based on file location relative to root
                    # Simple heuristic: if in pages/, add ../
                    is_root = subdir == root_dir
                    prefix = "" if is_root else "../"
                    
                    new_lines = []
                    injected = False
                    
                    # check what is missing
                    missing = []
                    for agent in agents:
                        if agent['name'] not in content:
                            missing.append(agent)
                    
                    if not missing:
                        continue
                        
                    print(f"[{file}] Missing: {[m['name'] for m in missing]}")
                    
                    # Inject before </body>
                    body_found = False
                    for line in lines:
                        if '</body>' in line.lower():
                            for agent in missing:
                                script_tag = f'    <script defer src="{prefix}{agent["src"]}"></script>\n'
                                new_lines.append(script_tag)
                            new_lines.append(line)
                            body_found = True
                        else:
                            new_lines.append(line)
                    
                    if not body_found:
                         # Append to end
                        for agent in missing:
                            script_tag = f'\n<script defer src="{prefix}{agent["src"]}"></script>'
                            new_lines.append(script_tag)
                            
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.writelines(new_lines)
                    
                    modified_count += 1
                    
                except Exception as e:
                    print(f"Error processing {file}: {e}")

    print(f"Finished. Modified {modified_count} files.")

if __name__ == "__main__":
    final_agent_fix()
