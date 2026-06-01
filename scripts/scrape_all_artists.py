import gdown
import json
import os

folders = [
    { "name": "A Day with Rui", "gdrive": "1crgVRzjOIedbtf1RrgFCRzQaYMIciCv5" },
    { "name": "Alen", "gdrive": "1Pf6Fp6LF63nuBTB0wv3qH9EQzPS4AUWF" },
    { "name": "Alterlife", "gdrive": "18XtQbCY1pyYVANRqf2OX4-ODi4rJXr9k" },
    { "name": "AnnaLubbingeArt", "gdrive": "1pgpFcKB5Jv9fb8R3iFE5IOpV-uyou5gz" },
    { "name": "Bantaba", "gdrive": "1gntd-LvGXMN3jOsiifqPzdfCVGKhsGzs" },
    { "name": "C-Riz", "gdrive": "186A9Wuqq9-DfADfWQtLp4Cih2FEWWGmY" },
    { "name": "Diasmarcall", "gdrive": "1TBAiImBCui1VHSft2JAodvcXoqCAKoYO" },
    { "name": "DJ Qter", "gdrive": "17vW_TYS4wthvPQJkzcfBbC7MmDz7FSF-" },
    { "name": "Enock", "gdrive": "1kGdpPY1uulIgkN9q8gI0VhYHeamjrWZo" },
    { "name": "Equipe Jovem", "gdrive": "1oqp9ZjJ851X8KzWEtsb3md5JM4dIuNqd" },
    { "name": "Ewa", "gdrive": "1tqqsLvCDCqTopZZXCI5Sz_EA_IOucZQ_" },
    { "name": "Ily", "gdrive": "1sqF3XgJsgIeimREnm5eblsKC_tRwsq0S" },
    { "name": "Irene", "gdrive": "1Pj-kH2K0qT6oXqS4h9FIf1jL-E4P-jYq" },
    { "name": "Joao L. T.", "gdrive": "1P9N0T4oV5s2H-zK7N7k1UqjQ-Knj-Rk5" },
    { "name": "Laetitia", "gdrive": "1-UjY0J_gVfQO3G-2w3w88d_F2kS2sM-x" },
    { "name": "Musa", "gdrive": "1jB40RjMofL-60s4o4F5Z-6YfJvBw4mE-" },
    { "name": "Naru the Token", "gdrive": "11Wr8HkAXSHewNxfsoclMCrOQHgANuQ-l" },
    { "name": "Oussama", "gdrive": "1L84m40G_kLqU4s5S-xRAl7N4Y99-PzX2" },
    { "name": "Pascale", "gdrive": "1-0N4PjA2Xv8gG8yWz6T7B056WwP3d3zM" },
    { "name": "Rui", "gdrive": "1jU0c9R4U36Xk6w_wXW_YwAOFDft2J94e" },
    { "name": "Rz Ramy", "gdrive": "1G4j_g4Jm6KDEl_m2L8XN3Zz1n_9X6zY_" },
    { "name": "Stela", "gdrive": "1Uqt5UlJ" },
    { "name": "Tio Rans", "gdrive": "1iLgoxnGgjy3VAkU1DD1gVZcpPwFLGzWB" },
    { "name": "Tony", "gdrive": "1noZs793lQIPZk540TkwY47fGcyrA8-Ly" },
    { "name": "Uma", "gdrive": "1h3rkbrzvz_bMdNknX3rfxo1ElRP870eg" }
]

akademie_data = []

print("Starting to parse Google Drive folders...")

for item in folders:
    print(f"Parsing {item['name']}...")
    try:
        if len(item['gdrive']) < 15:
            pass
            
        res = gdown.download_folder(id=item['gdrive'], skip_download=True, quiet=True)
        files = []
        for f in res:
            if not f.id:
                continue
            lower_path = f.path.lower()
            if lower_path.endswith('.jpg') or lower_path.endswith('.jpeg') or lower_path.endswith('.png'):
                files.append({"id": f.id, "type": "image"})
            elif lower_path.endswith('.mp4') or lower_path.endswith('.mov'):
                files.append({"id": f.id, "type": "video"})
        
        selected_files = files[:11]
        
        akademie_data.append({
            "name": item['name'],
            "id": item['name'].lower().replace(' ', '_').replace('.', ''),
            "gdriveFolder": item['gdrive'],
            "files": selected_files
        })
        print(f"  -> Found {len(selected_files)} valid media files.")
    except Exception as e:
        print(f"  -> Failed: {str(e)}")
        akademie_data.append({
            "name": item['name'],
            "id": item['name'].lower().replace(' ', '_').replace('.', ''),
            "gdriveFolder": item['gdrive'],
            "files": []
        })

js_content = f"const AkademieData = {json.dumps(akademie_data, indent=4)};\n\nif (typeof module !== 'undefined' && module.exports) {{\n    module.exports = AkademieData;\n}}\n"

with open("D:/circle-d-flow-web/js/data/akademie_data.js", "w") as f:
    f.write(js_content)

print("akademie_data.js successfully written!")
