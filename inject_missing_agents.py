import os

def inject_agents():
    root_dir = "c:\\Users\\Utilizador\\circle-d-flow-web"
    
    # Scripts to inject
    pusher_script = '<script defer src="js/agents/pusher.js"></script>'
    helper_script = '<script defer src="js/agents/helper.js"></script>'
    
    # Files identified by audit
    target_files = [
        'beta-initiation.html',
        'Hope-KissYourHeart-Bruce.html',
        'archive.html',
        'booking.html',
        'champion-reveal.html',
        'checkout.html',
        'event-create.html',
        'investor_dashboard.html',
        'kitchen-dashboard.html',
        'live-from-the-underground.html',
        'login.html',
        'master_dashboard.html',
        'membership.html',
        'partners.html',
        'privacy.html',
        'reset_state.html',
        'rules.html',
        'sanctum.html',
        'success.html',
        'thankyou.html',
        'index.html',
        'code.html',
        'booking_safe_copy.html',
        'footer_temp.html',
        'home_original.html',
        'listing_modal_snippet.html',
        'preview.html',
        'site.html'
    ]

    for subdir, dirs, files in os.walk(root_dir):
        for file in files:
            if file in target_files:
                filepath = os.path.join(subdir, file)
                
                # Determine correct path prefix based on file depth or specific knowledge
                # For simplicity in this script, we'll try to detect if it's in root or pages/
                # But the standard requires absolute-like paths or consistent relative paths.
                # Most files are in pages/ (needs ../js) or root (needs js/).
                
                # Let's read the file to see existing script tags and decide on prefix
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        lines = f.readlines()
                    
                    content = "".join(lines)
                    lower_content = content.lower()
                    
                    # Determine prefix
                    prefix = ""
                    if "src=\"../js/" in lower_content or "src='../js/" in lower_content:
                        prefix = "../"
                    elif "src=\"js/" in lower_content or "src='js/" in lower_content:
                        prefix = ""
                    else:
                        # Fallback: if in pages/, usage ../, else ./
                        if 'pages' in subdir:
                            prefix = "../"
                        else:
                            prefix = ""

                    final_pusher = f'<script defer src="{prefix}js/agents/pusher.js"></script>'
                    final_helper = f'<script defer src="{prefix}js/agents/helper.js"></script>'

                    new_lines = []
                    injected_pusher = False
                    injected_helper = False
                    
                    # Check if already present
                    has_pusher = 'agents/pusher.js' in lower_content
                    has_helper = 'agents/helper.js' in lower_content
                    
                    if has_pusher and has_helper:
                        continue

                    # Injection Strategy: Before </body>
                    body_found = False
                    for line in lines:
                        if '</body>' in line.lower():
                            if not has_pusher and not injected_pusher:
                                new_lines.append(f"    {final_pusher}\n")
                                injected_pusher = True
                                print(f"Injecting pusher into {file}")
                            if not has_helper and not injected_helper:
                                new_lines.append(f"    {final_helper}\n")
                                injected_helper = True
                                print(f"Injecting helper into {file}")
                            new_lines.append(line)
                            body_found = True
                        else:
                            new_lines.append(line)
                    
                    if not body_found:
                        # Append to end if no body tag (weird but possible in snippets)
                        if not has_pusher:
                            new_lines.append(f"\n{final_pusher}")
                        if not has_helper:
                            new_lines.append(f"\n{final_helper}")

                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.writelines(new_lines)

                except Exception as e:
                    print(f"Failed to process {file}: {e}")

if __name__ == "__main__":
    inject_agents()
