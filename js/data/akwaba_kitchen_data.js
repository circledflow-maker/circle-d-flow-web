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
  cover: '../Assets/kitchens/akwabalx/hero-1.jpg',
  reel: '../Assets/kitchens/akwabalx/reel-hero.mp4',
  gallery: [
    '../Assets/kitchens/akwabalx/hero-1.jpg',
    '../Assets/kitchens/akwabalx/hero-2.jpg',
    '../Assets/kitchens/akwabalx/hero-3.jpg',
    '../Assets/kitchens/akwabalx/hero-4.jpg',
    '../Assets/kitchens/akwabalx/menu-board.png',
    '../Assets/kitchens/akwabalx/dish-table.jpg',
  ],
  qr_url: 'https://circle-d-flow-web.vercel.app/pages/akwaba_kitchen.html',
  whatsapp_share: 'https://wa.me/?text=' + encodeURIComponent('AkwabaLX at Secret Garden LX — taste the flow! https://circle-d-flow-web.vercel.app/pages/akwaba_kitchen.html'),
  discount_note: 'Navigator discounts coming soon — collect Akoma rune for early access.',
  menu: [
    { id: 'm1', name: 'Jollof Rice Bowl', description: 'Smoky tomato jollof with plantain & salad', category: 'main', price_eur: 12, image: '../Assets/kitchens/akwabalx/dish-table.jpg' },
    { id: 'm2', name: 'KitKat Special', description: 'Chef signature — sweet heat fusion plate', category: 'main', price_eur: 14, image: '../Assets/kitchens/akwabalx/dish-kitkat.jpg' },
    { id: 'm3', name: 'Garden Vegan Plate', description: 'Seasonal greens from Secret Garden', category: 'vegan', price_eur: 11, image: '../Assets/kitchens/akwabalx/hero-3.jpg' },
    { id: 'm4', name: 'Akwaba Combo', description: 'Rice + stew + drink — best value', category: 'combo', price_eur: 16, image: '../Assets/kitchens/akwabalx/menu-board.png' },
    { id: 'm5', name: 'Fresh Juice', description: 'Daily rotation — ask at the bar', category: 'drink', price_eur: 4, image: '../Assets/kitchens/akwabalx/hero-5.jpg' },
  ],
};
