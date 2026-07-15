-- AkwabaLX — Secret Garden LX FOOD MENU (current live seed)
UPDATE public.kitchens
SET
  name = 'AkwabaLX',
  tagline = 'Secret Garden LX — veggie & chicken burger combos with plantain',
  cover_url = '/Assets/kitchens/akwabalx/dish-table-combo.webp?v=2',
  menu_board_url = '/Assets/kitchens/akwabalx/menu-board.webp?v=2',
  logo_url = '/Assets/kitchens/akwabalx/logo.webp?v=2',
  is_live = true
WHERE slug = 'akwabalx';

DELETE FROM public.kitchen_menu_items
WHERE kitchen_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

INSERT INTO public.kitchen_menu_items (kitchen_id, name, description, category, price_eur, image_url, sort_order, is_available) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Veggie Burger Combo', 'Fresh veggie burger with homemade sauce. Served with fried ripe plantain.', 'main', 9.50, '/Assets/kitchens/akwabalx/dish-veggie-burger.webp?v=2', 1, true),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Chicken Burger Combo', 'Juicy chicken burger with special sauce. Served with fried ripe plantain.', 'main', 11.50, '/Assets/kitchens/akwabalx/dish-table-combo.webp?v=2', 2, true),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Plantain Seul', 'Fried ripe plantain.', 'side', 4.00, '/Assets/kitchens/akwabalx/dish-wings-plantain.webp?v=2', 3, true),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Sauce', 'Homemade sauce.', 'extra', 0.50, '/Assets/kitchens/akwabalx/menu-board.webp?v=2', 4, true),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Extra Veggie', 'Extra veggie portion.', 'extra', 2.00, '/Assets/kitchens/akwabalx/dish-veggie-burger.webp?v=2', 5, true),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Chicken', 'Extra chicken portion.', 'extra', 3.00, '/Assets/kitchens/akwabalx/dish-wings-plantain.webp?v=2', 6, true),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Special Mayo', 'Our homemade special mayo.', 'extra', 0.50, '/Assets/kitchens/akwabalx/menu-board.webp?v=2', 7, true);

SELECT name, price_eur FROM public.kitchen_menu_items
WHERE kitchen_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
ORDER BY sort_order;
