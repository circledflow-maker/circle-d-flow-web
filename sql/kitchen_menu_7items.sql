-- WARNING: Do NOT run if workspace menu is already configured via Kitchen Ops.
-- This only resets cloud seed — workspace localStorage edits are preserved on device.
-- AkwabaLX — 7 menu items + title image (run in Supabase SQL Editor ONLY for fresh seed)

UPDATE public.kitchens
SET
  cover_url = '/Assets/kitchens/akwabalx/dish-table-combo.webp',
  menu_board_url = '/Assets/kitchens/akwabalx/menu-board.webp',
  is_live = true
WHERE slug = 'akwabalx';

DELETE FROM public.kitchen_menu_items
WHERE kitchen_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

INSERT INTO public.kitchen_menu_items (kitchen_id, name, description, category, price_eur, image_url, sort_order) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Veggie Burger Combo', 'Fresh veggie burger with homemade sauce. Served with fried ripe plantain.', 'main', 9.50, '/Assets/kitchens/akwabalx/dish-veggie-burger.webp', 1),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Chicken Burger Combo', 'Juicy chicken burger with special sauce. Served with fried ripe plantain.', 'main', 11.50, '/Assets/kitchens/akwabalx/dish-table-combo.webp', 2),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Plantain Seul', 'Fried ripe plantain.', 'side', 4.00, '/Assets/kitchens/akwabalx/dish-wings-plantain.webp', 3),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Sauce', 'Extra sauce portion.', 'extra', 0.50, '/Assets/kitchens/akwabalx/menu-board.webp', 4),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Extra Veggie', 'Extra veggie portion.', 'extra', 2.00, '/Assets/kitchens/akwabalx/dish-veggie-burger.webp', 5),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Chicken', 'Extra chicken portion.', 'extra', 3.00, '/Assets/kitchens/akwabalx/dish-wings-plantain.webp', 6),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Special Mayo', 'House special mayo.', 'extra', 0.50, '/Assets/kitchens/akwabalx/menu-board.webp', 7);

SELECT count(*) AS menu_items FROM public.kitchen_menu_items
WHERE kitchen_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
