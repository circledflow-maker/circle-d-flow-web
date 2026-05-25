import os
import json
import urllib.parse
import urllib.request
import webbrowser

# --- CONFIGURATION ---
CLIENT_ID = "1bcdcc8dcd38454591e74bec5b652311"
# We will prompt the user for the Client Secret on first run if not in environment
CLIENT_SECRET = os.environ.get("ADOBE_CLIENT_SECRET", "p8e-cjNESy_Xflak6qZ18WoNaWd_8TJsvRKV")
REDIRECT_URI = "https://localhost:8000/callback"
SCOPES = "AdobeID,openid,offline_access,lr_partner_apis,lr_partner_rendition_apis"

TOKEN_FILE = "adobe_token.json"

AUTH_URL = "https://ims-na1.adobelogin.com/ims/authorize/v2"
TOKEN_URL = "https://ims-na1.adobelogin.com/ims/token/v3"
LR_BASE_URL = "https://lr.adobe.io/v2"

def get_auth_code():
    url = f"{AUTH_URL}?client_id={CLIENT_ID}&redirect_uri={urllib.parse.quote(REDIRECT_URI)}&scope={urllib.parse.quote(SCOPES)}&response_type=code"
    print(f"\n1. Oeffne diesen Link im Browser:\n{url}")
    webbrowser.open(url)
    
    print("\n2. Logge dich bei Adobe ein.")
    print("3. Dein Browser wird versuchen, auf 'https://localhost...' umzuleiten. Das wird fehlschlagen (Website nicht erreichbar).")
    print("4. Das ist normal! Kopiere einfach die komplette URL oben aus der Adresszeile deines Browsers.")
    
    redirected_url = input("\n[Eingabe] Fuege die komplette URL hier ein und druecke Enter:\n> ").strip()
    
    try:
        query = urllib.parse.urlparse(redirected_url).query
        params = urllib.parse.parse_qs(query)
        if 'code' in params:
            return params['code'][0]
        else:
            print("Fehler: Kein 'code' in der URL gefunden.")
            return None
    except Exception as e:
        print("Ungueltige URL.")
        return None

def exchange_code_for_token(code):
    data = urllib.parse.urlencode({
        "grant_type": "authorization_code",
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "code": code,
        "redirect_uri": REDIRECT_URI
    }).encode('utf-8')
    
    req = urllib.request.Request(TOKEN_URL, data=data)
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read())
            with open(TOKEN_FILE, "w") as f:
                json.dump(result, f)
            print("Adobe Token erfolgreich generiert und gespeichert!")
            return result
    except Exception as e:
        print(f"Fehler beim Token-Exchange: {e}")
        if hasattr(e, 'read'):
            print(e.read().decode())
        return None

def parse_adobe_json(response_bytes):
    text = response_bytes.decode('utf-8')
    if text.startswith("while (1) {}"):
        text = text[12:].strip()
    return json.loads(text)

def test_lightroom_connection():
    if not os.path.exists(TOKEN_FILE):
        return False
        
    with open(TOKEN_FILE, "r") as f:
        tokens = json.load(f)
        
    access_token = tokens.get('access_token')
    if not access_token:
        return False
        
    req = urllib.request.Request(f"{LR_BASE_URL}/catalog")
    req.add_header("Authorization", f"Bearer {access_token}")
    req.add_header("X-Api-Key", CLIENT_ID)
    
    try:
        with urllib.request.urlopen(req) as response:
            catalog = parse_adobe_json(response.read())
            print(f"Erfolgreich mit Lightroom Katalog verbunden! ID: {catalog.get('id')}")
            return catalog.get('id')
    except Exception as e:
        print(f"API Verbindungsfehler: {e}")
        return None

def fetch_lightroom_albums(catalog_id):
    print("\nFrage Lightroom Alben ab...")
    with open(TOKEN_FILE, "r") as f:
        tokens = json.load(f)
        
    req = urllib.request.Request(f"{LR_BASE_URL}/catalogs/{catalog_id}/albums")
    req.add_header("Authorization", f"Bearer {tokens['access_token']}")
    req.add_header("X-Api-Key", CLIENT_ID)
    
    try:
        with urllib.request.urlopen(req) as response:
            data = parse_adobe_json(response.read())
            albums = data.get('resources', [])
            print(f"{len(albums)} Alben in Lightroom gefunden!")
            for a in albums:
                print(f" - {a.get('payload', {}).get('name', 'Unbekannt')}")
            return albums
    except Exception as e:
        print(f"Fehler beim Abrufen der Alben: {e}")
        return []

def main():
    global CLIENT_SECRET
    print("\n--- Adobe Lightroom API Bridge ---")
    
    if not CLIENT_SECRET:
        CLIENT_SECRET = input("\n[Eingabe erforderlich] Bitte fuege dein Adobe 'Client Secret' hier ein: ").strip()
        if not CLIENT_SECRET:
            print("Abbruch. Client Secret wird benoetigt.")
            return

    if not os.path.exists(TOKEN_FILE):
        print("Starte Erst-Authentifizierung...")
        code = get_auth_code()
        if code:
            exchange_code_for_token(code)
            
    catalog_id = test_lightroom_connection()
    if catalog_id:
        fetch_lightroom_albums(catalog_id)
        print("\nAPI ist vollstaendig eingerichtet. Der naechste Schritt ist das automatische Herunterladen in deine Website!")

if __name__ == '__main__':
    main()
