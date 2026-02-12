import os

ROOT_DIR = r"c:\Users\Utilizador\circle-d-flow-web"

ERRONEOUS_AGENTS = [
    "battle.html",
    "arena.html",
    "quiz.html",
    "quiz_creation.html",
    "library.html"
]

def clean_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    new_lines = []
    modified = False
    
    for line in lines:
        is_erroneous = False
        for bad_agent in ERRONEOUS_AGENTS:
            # Check if line contains src="...bad_agent"
            if f'src="../js/agents/{bad_agent}"' in line or f'src="js/agents/{bad_agent}"' in line:
                is_erroneous = True
                break
        
        if not is_erroneous:
            new_lines.append(line)
        else:
            modified = True
            print(f"Removed bad line from {os.path.basename(filepath)}: {line.strip()}")

    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        print(f"cleaned {filepath}")

def main():
    print("Starting Cleanup...")
    for root, dirs, files in os.walk(ROOT_DIR):
        for file in files:
            if file.endswith(".html"):
                full_path = os.path.join(root, file)
                clean_file(full_path)

if __name__ == "__main__":
    main()
