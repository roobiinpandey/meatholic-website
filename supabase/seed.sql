-- Seed Meatholic CMS — run in Supabase SQL Editor AFTER schema.sql
-- Public site only shows rows with is_active = true

DELETE FROM public.dishes;
DELETE FROM public.gallery;
DELETE FROM public.specials;

INSERT INTO public.dishes (name, description, price, image_url, category, sort_order, is_active) VALUES
('Greek Salad', 'Fresh cherry tomatoes, cucumbers, Kalamata olives, and feta cheese foam, topped with house-made special dressing.', '68', 'https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/feta-corn-1.jpg', 'starters', 10, true),
('Caesar Salad', 'Crisp romaine lettuce and garlic croutons, served with our signature Caesar dressing.', '56', 'https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/sharing-board.jpg', 'starters', 20, true),
('Edamame', 'Steamed young soybeans, lightly salted or spicy, your choice.', '34', 'https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/feta-corn-2.jpg', 'starters', 30, true),
('Cheese Burger', 'Classic Australian Wagyu beef patty with melted cheese, served with classic fries. Australian / Japanese Wagyu.', '78 / 114', 'https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/burger-closeup.jpg', 'burgers', 40, true),
('Truffle Burger', 'Rich and savory Australian Wagyu patty with a hint of truffle, served with classic fries.', '86 / 122', 'https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/truffle-burger.jpg', 'burgers', 50, true),
('Mushroom Burger', 'Earthy mushroom twist on a juicy Australian Wagyu patty, served with classic fries.', '82 / 118', 'https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/truffle-burger-table.jpg', 'burgers', 60, true),
('Arugula Burger', 'Bold and peppery Australian Wagyu patty burger with a gourmet touch, served with classic fries.', '82 / 118', 'https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/steak-burger-tasting.jpg', 'burgers', 70, true),
('Fish & Chips', 'Crispy golden fish with fries and tartar sauce.', '130', 'https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/calamari.jpg', 'main', 80, true),
('Striploin A3 (200g)', 'Elegant Wagyu cut with rich flavor, served with fries and salad.', '490', 'https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/steak-fries-1.jpg', 'steaks', 90, true),
('Rib Eye A3 (250g)', 'Premium Japanese Wagyu experience, served with fries and salad.', '490', 'https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/steak-fries-2.jpg', 'steaks', 100, true),
('Striploin 3+ (200g)', 'Lean and flavorful steak served with fries and salad.', '198', 'https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/steak-fries-promo.jpg', 'steaks', 110, true),
('Rib Eye 3+ (250g)', 'Tender and marbled cut grilled to perfection, served with fries and salad.', '198', 'https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/steak-sandwich.jpg', 'steaks', 120, true),
('Abdullah''s Steak', 'Signature indulgant steak, bold and unforgettable, served with fries and salad.', '740', 'https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/premium-wagyu-boxes.jpg', 'steaks', 130, true),
('Spicy Fries', 'Fries with a fiery kick.', '8', 'https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/steak-fries-1.jpg', 'add-on', 140, true),
('Parmesan Fries', 'Crispy fries with grated Parmesan.', '10', 'https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/steak-fries-2.jpg', 'add-on', 150, true);

INSERT INTO public.specials (title, description, price, image_url, sort_order, is_active) VALUES
('Feast for 2', 'Sharing feast for two guests.', '299', 'https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/feast-for-2.jpg', 1, true),
('Feast for 4', 'Sharing feast for four guests.', '549', 'https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/feast-for-4.jpg', 2, true),
('Weekly Special', 'Ask staff for current offers.', 'Ask staff', 'https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/weekly-specials.jpg', 3, true);

INSERT INTO public.gallery (image_url, alt_text, sort_order, is_active) VALUES
('https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/truffle-burger.jpg', 'Truffle burger', 1, true),
('https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/steak-fries-1.jpg', 'Steak', 2, true),
('https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/sharing-board.jpg', 'Sharing board', 3, true),
('https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/exterior.jpg', 'Restaurant exterior', 4, true),
('https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/table-ready.jpg', 'Table setting', 5, true),
('https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/tiramisu.jpg', 'Dessert', 6, true),
('https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/burger-closeup.jpg', 'Burger', 7, true),
('https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/come-try-it.jpg', 'Come try it', 8, true);
