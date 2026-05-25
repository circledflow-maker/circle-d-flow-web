import os
import requests
from dotenv import load_dotenv

load_dotenv()

TOKEN = os.getenv("WHATSAPP_TOKEN")

def check_accounts():
    # 1. Get Facebook Pages
    url = f"https://graph.facebook.com/v21.0/me/accounts?access_token={TOKEN}"
    response = requests.get(url).json()
    
    pages = response.get('data', [])
    if not pages:
        print("No Facebook Pages found for this token.")
        return

    print("--- Facebook Pages & Instagram Links ---")
    for page in pages:
        page_id = page['id']
        page_name = page['name']
        
        # 2. Get IG Business Account linked to this page
        ig_url = f"https://graph.facebook.com/v21.0/{page_id}?fields=instagram_business_account&access_token={TOKEN}"
        ig_res = requests.get(ig_url).json()
        
        ig_account = ig_res.get('instagram_business_account')
        if ig_account:
            ig_id = ig_account['id']
            # Get IG handle
            handle_url = f"https://graph.facebook.com/v21.0/{ig_id}?fields=username&access_token={TOKEN}"
            handle = requests.get(handle_url).json().get('username', 'Unknown')
            print(f"- Page: {page_name} ({page_id}) -> IG: @{handle} ({ig_id})")
        else:
            print(f"- Page: {page_name} ({page_id}) -> No linked IG Business Account.")

if __name__ == "__main__":
    check_accounts()
