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
  logo: '../Assets/kitchens/akwabalx/logo.webp',
  menu_board: '../Assets/kitchens/akwabalx/menu-board.webp',
  cover: '../Assets/kitchens/akwabalx/dish-table-combo.webp',
  reel: '../Assets/kitchens/akwabalx/reel-hero.mp4',
  qr_url: 'https://circle-d-flow-web.vercel.app/pages/akwaba_kitchen',
  whatsapp_share: 'https://wa.me/?text=' + encodeURIComponent('AkwabaLX at Secret Garden LX — taste the flow! https://circle-d-flow-web.vercel.app/pages/akwaba_kitchen'),
  discount_note: 'Navigator discounts coming soon — collect Akoma rune for early access.',
  menu: [
    { id: 'veggie-burger-combo', name: 'Veggie Burger Combo', description: 'Fresh veggie burger with homemade sauce. Served with fried ripe plantain.', category: 'main', price_eur: 9.5, image: '../Assets/kitchens/akwabalx/dish-veggie-burger.webp' },
    { id: 'chicken-burger-combo', name: 'Chicken Burger Combo', description: 'Juicy chicken burger with special sauce. Served with fried ripe plantain.', category: 'main', price_eur: 11.5, image: '../Assets/kitchens/akwabalx/dish-table-combo.webp' },
    { id: 'plantain-seul', name: 'Plantain Seul', description: 'Fried ripe plantain.', category: 'side', price_eur: 4, image: '../Assets/kitchens/akwabalx/dish-wings-plantain.webp' },
    { id: 'sauce', name: 'Sauce', description: 'Extra sauce portion.', category: 'extra', price_eur: 0.5, image: '../Assets/kitchens/akwabalx/menu-board.webp' },
    { id: 'extra-veggie', name: 'Extra Veggie', description: 'Extra veggie portion.', category: 'extra', price_eur: 2, image: '../Assets/kitchens/akwabalx/dish-veggie-burger.webp' },
    { id: 'chicken-extra', name: 'Chicken', description: 'Extra chicken portion.', category: 'extra', price_eur: 3, image: '../Assets/kitchens/akwabalx/dish-wings-plantain.webp' },
    { id: 'special-mayo', name: 'Special Mayo', description: 'House special mayo.', category: 'extra', price_eur: 0.5, image: '../Assets/kitchens/akwabalx/menu-board.webp' },
  ],
};
