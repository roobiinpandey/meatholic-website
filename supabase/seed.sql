-- Seed Meatholic CMS with current website content
-- Run in Supabase SQL Editor AFTER schema.sql

DELETE FROM public.dishes;
DELETE FROM public.gallery;
DELETE FROM public.specials;

-- DISHES (9 items from website)
INSERT INTO public.dishes (name, description, price, image_url, category, sort_order, is_active) VALUES
('Truffle Burger', 'Wagyu patty with in-house truffle products. Served with unlimited classic fries.', NULL, 'https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/truffle-burger.jpg', 'signature', 1, true),
('Steak & Fries', 'Prime Australian Angus steak with unlimited fries and house salad.', NULL, 'https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/steak-fries-2.jpg', 'signature', 2, true),
('Australian Wagyu Cheeseburger', 'Premium Wagyu beef, melted cheese, classic toppings.', NULL, 'https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/burger-closeup.jpg', 'signature', 3, true),
('Steak Sandwich', 'Sliced steak on fresh bread with house sauce.', NULL, 'https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/steak-sandwich.jpg', 'signature', 4, true),
('Feta Corn', 'Sweet corn with feta and herbs — the perfect side.', NULL, 'https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/feta-corn-2.jpg', 'sides', 5, true),
('Calamari', 'Crispy fried calamari with dipping sauce.', NULL, 'https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/calamari.jpg', 'sides', 6, true),
('Tiramisu', 'Classic Italian dessert to finish the meal.', NULL, 'https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/tiramisu.jpg', 'dessert', 7, true),
('Affogato', 'Espresso poured over vanilla ice cream.', NULL, 'https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/affogato.jpg', 'dessert', 8, true),
('The Sharing Board', 'A selection of cuts perfect for sharing.', NULL, 'https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/sharing-board.jpg', 'signature', 9, true);

-- SPECIALS (3 items)
INSERT INTO public.specials (title, description, price, image_url, sort_order, is_active) VALUES
('Meatholic Feast for 2', NULL, '199 د.إ', 'https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/feast-for-2.jpg', 1, true),
('Meatholic Feast for 4', NULL, '350 د.إ', 'https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/feast-for-4.jpg', 2, true),
('Weekly Specials', 'See in-store for current offers.', 'See in-store', 'https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/weekly-specials.jpg', 3, true);

-- GALLERY (8 images)
INSERT INTO public.gallery (image_url, alt_text, sort_order, is_active) VALUES
('https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/truffle-burger-table.jpg', 'Truffle burger', 1, true),
('https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/table-ready.jpg', 'Table setting', 2, true),
('https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/steak-burger-tasting.jpg', 'Steak tasting', 3, true),
('https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/open-hours.jpg', 'Open hours', 4, true),
('https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/come-try-it.jpg', 'Come try it', 5, true),
('https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/exterior.jpg', 'Restaurant exterior', 6, true),
('https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/philosophy-seasoning.jpg', 'Seasoning philosophy', 7, true),
('https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/philosophy-handling.jpg', 'Handling philosophy', 8, true);
