import qrcode
from PIL import Image
import os

def generate_qr(url, logo_path, output_path):
    qr = qrcode.QRCode(
        version=5,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=20,
        border=2,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white").convert('RGBA')
    
    # Process transparency and color
    datas = img.getdata()
    newData = []
    golden_color = (235, 177, 52, 255) # Beautiful golden color
    
    for item in datas:
        # If pixel is white
        if item[0] > 200 and item[1] > 200 and item[2] > 200:
            newData.append((255, 255, 255, 0)) # Transparent
        else:
            newData.append(golden_color)
            
    img.putdata(newData)

    if os.path.exists(logo_path):
        try:
            logo = Image.open(logo_path).convert("RGBA")
            # Scale logo to max 30% of QR size
            logo_size = int(img.size[0] * 0.3)
            
            w_percent = (logo_size / float(logo.size[0]))
            h_size = int((float(logo.size[1]) * float(w_percent)))
            
            logo = logo.resize((logo_size, h_size), Image.Resampling.LANCZOS)
            
            pos = ((img.size[0] - logo_size) // 2, (img.size[1] - h_size) // 2)
            
            img.paste(logo, pos, mask=logo)
            print(f"Branded transparent QR created at {output_path}")
        except Exception as e:
            print(f"Error loading logo: {e}")
            
    img.save(output_path)

url = "https://circle-d-flow-web.vercel.app/pages/bantaba.html"
logo_path = "D:/circle-d-flow-web/KissYourHeartLogo.png"
output_path = "D:/circle-d-flow-web/Assets/branding/qr_code_branded.png"

os.makedirs(os.path.dirname(output_path), exist_ok=True)
generate_qr(url, logo_path, output_path)
