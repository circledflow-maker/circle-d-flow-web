import os

directory = r"D:\circle-d-flow-web"

count = 0
for root, dirs, files in os.walk(directory):
    if "node_modules" in root or ".git" in root:
        continue
    for file in files:
        if file.endswith(".js") or file.endswith(".html"):
            filepath = os.path.join(root, file)
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            if "Logo.png" in content:
                new_content = content.replace("Logo.png", "logo.png")
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(new_content)
                count += 1
                print(f"Fixed {filepath}")

print(f"Total files fixed: {count}")
