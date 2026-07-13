/**
 * AkwabaLX — static kitchen profile (fallback when Supabase offline)
 */
window.AKWABA_KITCHEN = {
  slug: 'akwabalx',
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  name: 'AkwabaLX',
  tagline: 'Taste the flow — African soul food at Secret Garden',
  location_name: 'Secret Garden LX',
  address: 'Lisbon, Portugal',
  lat: 38.7200,
  lng: -9.1450,
  logo: '../Assets/kitchens/akwabalx/logo.png',
  menu_board: '../Assets/kitchens/akwabalx/menu-board.webp',
  cover: '../Assets/kitchens/akwabalx/hero-1.webp',
  reel: '../Assets/kitchens/akwabalx/reel-hero.mp4',
  gallery: [
    '../Assets/kitchens/akwabalx/hero-1.webp',
    '../Assets/kitchens/akwabalx/hero-2.webp',
    '../Assets/kitchens/akwabalx/hero-3.webp',
    '../Assets/kitchens/akwabalx/hero-4.webp',
    '../Assets/kitchens/akwabalx/menu-board.webp',
    '../Assets/kitchens/akwabalx/dish-table-combo.webp',
  ],
  qr_url: 'https://circle-d-flow-web.vercel.app/pages/akwaba_kitchen',
  whatsapp_share: 'https://wa.me/?text=' + encodeURIComponent('AkwabaLX at Secret Garden LX — taste the flow! https://circle-d-flow-web.vercel.app/pages/akwaba_kitchen'),
  discount_note: 'Navigator discounts coming soon — collect Akoma rune for early access.',
  menu: [
    { id: 'kitkat-special', name: 'KitKat Special', description: 'Chef signature — sweet heat fusion plate', category: 'main', price_eur: 14, image: '../Assets/kitchens/akwabalx/dish-kitkat-special.webp' },
    { id: 'wings-plantain', name: 'Chicken Wings & Plantain', description: 'Crispy wings with sweet plantain combo', category: 'main', price_eur: 13, image: '../Assets/kitchens/akwabalx/dish-wings-plantain.webp' },
    { id: 'table-combo', name: 'Akwaba Table Combo', description: 'Rice, stew & sides — best at the table', category: 'combo', price_eur: 16, image: '../Assets/kitchens/akwabalx/dish-table-combo.webp' },
    { id: 'veggie-burger', name: 'Veggie Burger', description: 'Garden patty with fresh greens — ask at bar', category: 'vegan', price_eur: 12, image: '../Assets/kitchens/akwabalx/dish-veggie-burger.webp' },
    { id: 'fresh-juice', name: 'Fresh Juice', description: 'Daily rotation — ask at the bar', category: 'drink', price_eur: 4, image: '../Assets/kitchens/akwabalx/logo-fallback.png' },
  ],
};
