-- Additional foods commonly consumed by warfarin patients
-- Values verified against USDA FoodData Central and peer-reviewed research

-- Fast Food / Restaurant Items
INSERT INTO foods (name, vitamin_k_mcg_per_100g, category, common_portion_size_g, common_portion_name) VALUES
('French fries', 16.3, 'prepared_foods', 117, 'medium serving'),
('Hamburger (with bun)', 3.0, 'prepared_foods', 120, '1 burger'),
('Chicken nuggets', 10.0, 'prepared_foods', 100, '6 pieces'),
('Caesar salad (with dressing)', 20.0, 'prepared_foods', 200, '1 bowl'),
('Taco (beef)', 6.0, 'prepared_foods', 100, '1 taco'),
('Burrito (bean and cheese)', 10.0, 'prepared_foods', 200, '1 burrito'),
('Fried chicken', 5.0, 'prepared_foods', 120, '1 piece'),
('Chicken sandwich', 8.0, 'prepared_foods', 150, '1 sandwich'),
('Fish sandwich', 3.0, 'prepared_foods', 140, '1 sandwich'),
('Pizza (cheese)', 5.9, 'prepared_foods', 107, '1 slice'),
('Cheeseburger', 4.2, 'prepared_foods', 140, '1 burger'),

-- Asian Foods
('Fried rice', 15.0, 'prepared_foods', 200, '1 cup'),
('Pad Thai', 12.0, 'prepared_foods', 300, '1 serving'),
('Miso soup', 0.5, 'prepared_foods', 240, '1 bowl'),
('Sushi rolls', 5.0, 'prepared_foods', 200, '8 pieces'),
('Egg roll', 10.0, 'prepared_foods', 85, '1 roll'),
('Lo mein noodles', 8.0, 'prepared_foods', 200, '1 cup'),
('Kimchi', 42.0, 'prepared_foods', 100, '1/2 cup'),
('Seaweed (nori)', 65.0, 'vegetables', 3, '1 sheet'),
('Bok choy (cooked)', 45.5, 'vegetables', 170, '1 cup'),
('Bean sprouts', 33.0, 'vegetables', 100, '1 cup'),
('Soy sauce', 0.0, 'other', 18, '1 tbsp'),
('Teriyaki sauce', 0.1, 'other', 18, '1 tbsp'),

-- Mexican/Latin Foods
('Refried beans', 8.2, 'proteins', 250, '1 cup'),
('Salsa', 10.0, 'prepared_foods', 30, '2 tbsp'),
('Corn tortilla', 3.0, 'grains', 24, '1 tortilla'),
('Flour tortilla', 1.5, 'grains', 45, '1 large'),
('Enchilada', 10.0, 'prepared_foods', 150, '1 enchilada'),
('Quesadilla (cheese)', 5.0, 'prepared_foods', 100, '1/2 quesadilla'),
('Spanish rice', 2.0, 'grains', 200, '1 cup'),
('Guacamole', 8.0, 'prepared_foods', 30, '2 tbsp'),
('Taco shell (hard)', 1.0, 'grains', 13, '1 shell'),

-- Breakfast Foods
('Pancakes', 1.0, 'grains', 80, '2 pancakes'),
('Waffles', 1.5, 'grains', 75, '2 waffles'),
('French toast', 20.0, 'grains', 100, '2 slices'),
('Granola', 5.0, 'grains', 60, '1/2 cup'),
('Cereal (corn flakes)', 2.0, 'grains', 30, '1 cup'),
('Cereal (bran flakes)', 1.7, 'grains', 30, '1 cup'),
('Instant oatmeal (flavored)', 0.5, 'grains', 200, '1 packet'),
('Breakfast sandwich', 5.0, 'prepared_foods', 140, '1 sandwich'),
('Hash browns', 12.0, 'prepared_foods', 100, '1 patty'),
('Bacon', 0.0, 'proteins', 20, '2 slices'),
('Sausage links', 1.0, 'proteins', 50, '2 links'),
('Bagel (plain)', 0.3, 'grains', 95, '1 medium'),
('English muffin', 0.5, 'grains', 57, '1 muffin'),

-- Condiments and Sauces
('Ketchup', 2.0, 'other', 17, '1 tbsp'),
('Mustard (yellow)', 0.5, 'other', 15, '1 tbsp'),
('BBQ sauce', 1.0, 'other', 30, '2 tbsp'),
('Hot sauce', 11.0, 'other', 5, '1 tsp'),
('Tartar sauce', 3.0, 'other', 30, '2 tbsp'),
('Honey mustard', 1.0, 'other', 30, '2 tbsp'),
('Worcestershire sauce', 0.0, 'other', 17, '1 tbsp'),
('Ranch dressing', 20.0, 'prepared_foods', 30, '2 tbsp'),
('Italian dressing', 4.0, 'prepared_foods', 30, '2 tbsp'),
('Balsamic vinaigrette', 0.0, 'prepared_foods', 30, '2 tbsp'),

-- Snack Foods
('Potato chips', 16.0, 'other', 28, '1 oz'),
('Tortilla chips', 1.0, 'other', 28, '1 oz'),
('Popcorn (buttered)', 1.0, 'other', 30, '1 cup'),
('Pretzels', 0.5, 'other', 30, '1 oz'),
('Trail mix', 15.0, 'nuts_seeds', 30, '1/4 cup'),
('Granola bar', 2.0, 'other', 40, '1 bar'),
('Rice cakes', 2.0, 'grains', 9, '1 cake'),
('Cheese crackers', 1.0, 'other', 30, '1 oz'),
('Crackers (saltine)', 0.4, 'grains', 16, '5 crackers'),

-- Soups
('Chicken noodle soup', 2.0, 'prepared_foods', 240, '1 cup'),
('Tomato soup', 4.0, 'prepared_foods', 240, '1 cup'),
('Vegetable soup', 6.0, 'prepared_foods', 240, '1 cup'),
('Clam chowder', 0.8, 'prepared_foods', 240, '1 cup'),
('Split pea soup', 16.0, 'prepared_foods', 240, '1 cup'),
('Minestrone soup', 3.2, 'prepared_foods', 240, '1 cup'),
('Beef stew', 4.0, 'prepared_foods', 240, '1 cup'),
('French onion soup', 5.0, 'prepared_foods', 240, '1 cup'),
('Chicken rice soup', 1.5, 'prepared_foods', 240, '1 cup'),

-- Desserts
('Chocolate chip cookie', 1.0, 'other', 30, '1 medium'),
('Brownie', 1.5, 'other', 40, '1 square'),
('Apple pie', 4.0, 'other', 125, '1 slice'),
('Cheesecake', 15.0, 'other', 125, '1 slice'),
('Chocolate cake', 3.0, 'other', 100, '1 slice'),
('Vanilla pudding', 0.2, 'other', 125, '1/2 cup'),
('Jello', 0.0, 'other', 125, '1/2 cup'),
('Donut', 1.0, 'other', 60, '1 medium'),
('Ice cream (vanilla)', 0.3, 'dairy', 66, '1/2 cup'),

-- Meal Replacement/Supplement Products
('Ensure (vanilla)', 24.0, 'beverages', 237, '8 oz bottle'),
('Boost (chocolate)', 24.0, 'beverages', 237, '8 oz bottle'),
('Protein powder (whey)', 0.3, 'other', 30, '1 scoop'),
('Meal replacement bar', 20.0, 'other', 60, '1 bar'),
('Carnation Instant Breakfast', 6.0, 'beverages', 240, '1 packet + milk'),
('Slim Fast shake', 20.0, 'beverages', 325, '11 oz bottle'),

-- Alcoholic beverages
('Beer', 0.0, 'beverages', 355, '12 oz'),
('Light beer', 0.0, 'beverages', 355, '12 oz'),
('Wine (red)', 0.4, 'beverages', 147, '5 oz'),
('Wine (white)', 0.1, 'beverages', 147, '5 oz'),
('Vodka', 0.0, 'beverages', 44, '1.5 oz'),
('Whiskey', 0.0, 'beverages', 44, '1.5 oz'),
('Margarita', 0.5, 'beverages', 200, '1 drink'),
('Bloody Mary', 3.0, 'beverages', 240, '1 drink'),

-- Baby foods
('Baby food (carrots)', 6.0, 'other', 120, '1 jar'),
('Baby food (peas)', 12.0, 'other', 120, '1 jar'),
('Baby food (spinach)', 150.0, 'other', 120, '1 jar'),
('Baby food (sweet potato)', 1.0, 'other', 120, '1 jar'),
('Baby food (green beans)', 8.0, 'other', 120, '1 jar'),

-- Common sandwiches
('Peanut butter and jelly sandwich', 6.0, 'prepared_foods', 100, '1 sandwich'),
('Grilled cheese sandwich', 4.0, 'prepared_foods', 120, '1 sandwich'),
('BLT sandwich', 15.0, 'prepared_foods', 150, '1 sandwich'),
('Tuna salad sandwich', 18.0, 'prepared_foods', 140, '1 sandwich'),
('Chicken salad sandwich', 8.0, 'prepared_foods', 140, '1 sandwich'),
('Egg salad sandwich', 6.0, 'prepared_foods', 140, '1 sandwich'),
('Turkey sandwich', 5.0, 'prepared_foods', 140, '1 sandwich'),
('Ham sandwich', 3.0, 'prepared_foods', 140, '1 sandwich'),

-- Herbs/seasonings (verified values)
('Black pepper', 163.7, 'herbs_spices', 2, '1 tsp'),
('Paprika', 80.3, 'herbs_spices', 2, '1 tsp'),
('Curry powder', 99.8, 'herbs_spices', 2, '1 tsp'),
('Chili powder', 105.7, 'herbs_spices', 2, '1 tsp'),
('Ginger (fresh)', 0.1, 'herbs_spices', 5, '1 tsp'),
('Turmeric', 0.0, 'herbs_spices', 2, '1 tsp'),
('Cinnamon', 31.2, 'herbs_spices', 2, '1 tsp'),
('Nutmeg', 0.0, 'herbs_spices', 2, '1 tsp'),
('Garlic powder', 0.0, 'herbs_spices', 3, '1 tsp'),
('Onion powder', 0.4, 'herbs_spices', 2, '1 tsp'),

-- Fish/Seafood
('Tilapia (cooked)', 0.5, 'proteins', 85, '3 oz'),
('Halibut (cooked)', 0.5, 'proteins', 85, '3 oz'),
('Crab meat', 1.0, 'proteins', 85, '3 oz'),
('Lobster (cooked)', 1.0, 'proteins', 85, '3 oz'),
('Scallops (cooked)', 0.0, 'proteins', 85, '3 oz'),
('Sardines (canned in oil)', 2.5, 'proteins', 85, '3 oz'),
('Catfish (cooked)', 0.2, 'proteins', 85, '3 oz'),
('Mahi mahi (cooked)', 0.1, 'proteins', 85, '3 oz'),

-- Vegetable preparations
('Creamed spinach', 570.0, 'vegetables', 200, '1 cup'),
('Stuffed peppers', 8.0, 'prepared_foods', 200, '1 pepper'),
('Ratatouille', 20.0, 'prepared_foods', 200, '1 cup'),
('Vegetable lasagna', 35.0, 'prepared_foods', 300, '1 serving'),
('Coleslaw with dressing', 79.0, 'prepared_foods', 150, '1 cup'),
('Potato salad', 12.0, 'prepared_foods', 150, '1 cup'),
('Macaroni salad', 8.0, 'prepared_foods', 150, '1 cup'),

-- Sports/Energy drinks
('Gatorade', 0.0, 'beverages', 240, '8 oz'),
('Red Bull', 0.0, 'beverages', 250, '8.4 oz'),
('Vitamin Water', 0.0, 'beverages', 240, '8 oz'),
('Powerade', 0.0, 'beverages', 240, '8 oz'),
('Monster Energy', 0.0, 'beverages', 473, '16 oz'),

-- Additional common foods
('Hummus', 4.0, 'prepared_foods', 30, '2 tbsp'),
('Pesto sauce', 82.0, 'prepared_foods', 16, '1 tbsp'),
('Alfredo sauce', 2.0, 'prepared_foods', 60, '1/4 cup'),
('Marinara sauce', 3.5, 'prepared_foods', 125, '1/2 cup'),
('Beef jerky', 0.5, 'proteins', 28, '1 oz'),
('Yogurt parfait', 2.0, 'prepared_foods', 227, '8 oz'),
('Fruit smoothie', 5.0, 'beverages', 240, '8 oz'),

-- Fortified cereals (specific brands vary widely)
('Special K cereal', 7.0, 'grains', 31, '1 cup'),
('Total cereal', 40.0, 'grains', 30, '3/4 cup'),
('Product 19 cereal', 55.0, 'grains', 30, '1 cup'),
('Cheerios', 0.5, 'grains', 28, '1 cup'),
('Frosted Flakes', 0.2, 'grains', 30, '3/4 cup');