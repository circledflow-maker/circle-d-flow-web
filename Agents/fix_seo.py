
import os
import sys

# Force UTF-8 for Windows consoles
sys.stdout.reconfigure(encoding='utf-8')

SEO_DATA = {
    "Index.html": "Circle D Flow: Professional photography & creative services in Lisbon. Capturing the essence of Art, Brands, and Individuals with authentic energy.",
    "gallery.html": "Explore the Circle D Flow portfolio. A visual journey through artistic portraits, event energy, and street photography across Lisbon and beyond.",
    "kiss-your-heart.html": "Kiss Your Heart: A photography service dedicated to capturing your authentic self. Emotional, raw, and beautiful portraiture.",
    "marketplace.html": "The Circle Marketplace: Discover unique services, art, and collaborations from the Circle D Flow community partners.",
    "marketplace-upload.html": "Upload your offering to the Circle Marketplace. Share your talent with our growing community.",
    "partners.html": "Meet our Nakam Partners: A network of trusted creatives and businesses collaborating with Circle D Flow.",
    "dashboard.html": "Your Circle D Flow Dashboard. Manage your bookings, view your gallery, and track your gamification progress.",
    "pages/blog.html": "Circle D Flow Blog: Insights on photography, creativity, and the stories behind the lens.",
    "pages/booking.html": "Book your session with Circle D Flow. Choose from Artist, Brand, or Individual photography packages.",
    "pages/contact.html": "Contact Circle D Flow. Let's discuss your vision and creative needs in Lisbon.",
    "pages/events.html": "Upcoming Events: Workshops, photo walks, and community gatherings hosted by Circle D Flow.",
    "pages/login.html": "Login to your Circle D Flow account to access your private gallery and rewards.",
    "pages/membership.html": "Join the Circle: Exclusive membership tiers offering discounts, priority booking, and community access.",
    "pages/mindfulness.html": "Mindfulness & Flow: Integrating presence and awareness into the creative process.",
    "pages/outbreak_tunes.html": "Outbreak Tunes: The sonic heartbeat of Circle D Flow. Music and playlists to inspire your flow.",
    "pages/privacy.html": "Privacy Policy for Circle D Flow. How we respect and protect your data.",
    "pages/rules.html": "Community Rules: Keeping the Circle D Flow space safe, respectful, and creative for everyone.",
    "pages/services-artist.html": "Artist Photography Services: High-impact visuals for musicians, painters, and performers. Elevate your portfolio.",
    "pages/services-brand.html": "Brand Identity Photography: Visual storytelling for businesses. Authentic imagery that connects with your audience.",
    "pages/services-individual.html": "Individual Portraits: Personal photography sessions designed to capture your unique story and vibe.",
    "pages/services-wedding.html": "Wedding & Love Stories: Cinematic and emotional wedding photography. Capturing real moments, not just poses.",
    "pages/services-citytrip.html": "City Trip Photography: Capture your Lisbon adventure with a professional photographer. Memories that last.",
    "pages/services-community.html": "Community Projects: Collaborative photography for NGOs, social projects, and community groups.",
    "pages/success.html": "Success! Your action has been completed. Welcome to the next step of your journey.",
    "pages/thankyou.html": "Thank You. We appreciate your connection with Circle D Flow.",
    "pages/champion-reveal.html": "Champion Reveal: Celebrating the top contributors and creative spirits of our community.",
    "pages/codex.html": "The Codex: The philosophy and guidelines behind the Circle D Flow movement.",
    "pages/partner-scanner.html": "Partner Scanner: Internal tool for verifying partner interactions and rewards."
}

DEFAULT_DESC = "Circle D Flow: Professional photography and creative services in Lisbon. Capture your moment."

def fix_file(filepath):
    filename = filepath.replace("\\", "/") # Normalize path
    if filename.startswith("./"): filename = filename[2:]
    
    # Determined Description
    desc = SEO_DATA.get(filename, SEO_DATA.get(os.path.basename(filename), DEFAULT_DESC))
    
    # Determine Title (Simple logic)
    title_text = os.path.basename(filename).replace(".html", "").replace("-", " ").title()
    if title_text == "Index": title_text = "Home"
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if '<meta name="description"' in content and '<meta property="og:title"' in content:
        return False # Already done

    # Prepare tags
    tags = []
    if '<meta name="description"' not in content:
        tags.append(f'    <meta name="description" content="{desc}">')
    if '<meta property="og:title"' not in content:
        tags.append(f'    <meta property="og:title" content="Circle D Flow | {title_text}">')
        tags.append(f'    <meta property="og:description" content="{desc}">')
        tags.append(f'    <meta property="og:type" content="website">')
        
    if not tags:
        return False

    # Inject
    if '<head>' in content:
        # Insert after <meta charset> or just after <head>
        if '<meta charset="UTF-8">' in content:
            new_content = content.replace('<meta charset="UTF-8">', '<meta charset="UTF-8">\n' + '\n'.join(tags))
        else:
            new_content = content.replace('<head>', '<head>\n' + '\n'.join(tags))
            
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"  [FIXED] {filename}")
        return True
    
    return False

def main():
    print("[SEO AGENT] Starting Meta Tag Injection...")
    print("-" * 40)
    
    html_files = [f for f in os.listdir('.') if f.endswith('.html')]
    if os.path.exists('pages'):
        html_files += [os.path.join('pages', f) for f in os.listdir('pages') if f.endswith('.html')]
        
    count = 0
    for file in html_files:
        if fix_file(file):
            count += 1
            
    print("-" * 40)
    print(f"[COMPLETE] Injected tags into {count} pages.")

if __name__ == "__main__":
    main()
