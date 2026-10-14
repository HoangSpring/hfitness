export type SeedFood = {
  name: string;
  slug: string;
  category: string;
  serving_size: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  status: 'PUBLISHED';
};

const groups: Record<string, string[]> = {
  Staples: ['White rice', 'Brown rice', 'Jasmine rice', 'Sticky rice', 'Oats', 'Quinoa', 'Couscous', 'Whole wheat pasta', 'Rice noodles', 'Egg noodles', 'Sourdough bread', 'Whole wheat bread', 'Rye bread', 'Corn tortilla', 'Flour tortilla', 'Potato', 'Sweet potato', 'Cassava', 'Corn', 'Rice paper'],
  Proteins: ['Chicken breast', 'Chicken thigh', 'Turkey breast', 'Lean beef', 'Ground beef', 'Pork loin', 'Pork tenderloin', 'Pork belly', 'Salmon', 'Tuna', 'Sardines', 'Shrimp', 'White fish', 'Cod', 'Tofu', 'Tempeh', 'Egg', 'Egg whites', 'Greek yogurt', 'Cottage cheese'],
  Vegetables: ['Broccoli', 'Spinach', 'Kale', 'Cabbage', 'Carrot', 'Cucumber', 'Tomato', 'Bell pepper', 'Mushroom', 'Green beans', 'Asparagus', 'Zucchini', 'Eggplant', 'Bok choy', 'Bean sprouts', 'Cauliflower', 'Lettuce', 'Onion', 'Garlic', 'Pumpkin'],
  Fruits: ['Apple', 'Banana', 'Orange', 'Mango', 'Pineapple', 'Papaya', 'Watermelon', 'Strawberry', 'Blueberry', 'Grapes', 'Pear', 'Peach', 'Kiwi', 'Guava', 'Dragon fruit', 'Passion fruit', 'Avocado', 'Lime', 'Lemon', 'Coconut'],
  Dairy: ['Low-fat milk', 'Whole milk', 'Soy milk', 'Almond milk', 'Cheddar cheese', 'Mozzarella', 'Parmesan', 'Plain yogurt', 'Skyr', 'Kefir', 'Butter', 'Cream cheese', 'Feta cheese', 'Whey protein', 'Chocolate milk', 'Condensed milk', 'Oat milk', 'Rice milk', 'Sour cream', 'Whipping cream'],
  Snacks: ['Almonds', 'Peanuts', 'Cashews', 'Walnuts', 'Pistachios', 'Peanut butter', 'Hummus', 'Granola', 'Popcorn', 'Rice cakes', 'Dark chocolate', 'Trail mix', 'Protein bar', 'Potato chips', 'Pretzels', 'Crackers', 'Dried mango', 'Raisins', 'Chia seeds', 'Flax seeds'],
  Vietnamese: ['Pho bo', 'Pho ga', 'Banh mi', 'Bun cha', 'Bun thit nuong', 'Com tam', 'Goi cuon', 'Cha gio', 'Banh xeo', 'Bo kho', 'Ca kho to', 'Canh chua ca', 'Thit kho trung', 'Mi Quang', 'Bun bo Hue', 'Hu tieu', 'Xoi ga', 'Chao ga', 'Com chien', 'Che dau den'],
  Drinks: ['Water', 'Black coffee', 'Milk coffee', 'Green tea', 'Black tea', 'Orange juice', 'Apple juice', 'Coconut water', 'Smoothie', 'Cola', 'Sparkling water', 'Sports drink', 'Matcha latte', 'Herbal tea', 'Lemonade', 'Tomato juice', 'Protein shake', 'Iced tea', 'Soy latte', 'Hot chocolate'],
  Legumes: ['Black beans', 'Kidney beans', 'Chickpeas', 'Lentils', 'Edamame', 'Green peas', 'Mung beans', 'Red beans', 'Navy beans', 'Pinto beans', 'Pea soup', 'Lentil soup', 'Bean salad', 'Falafel', 'Baked beans', 'Soy beans', 'Tofu skin', 'Peanut sprouts', 'Mung bean noodles', 'Bean curd'],
  Prepared: ['Chicken salad', 'Tuna salad', 'Caesar salad', 'Beef burger', 'Chicken burger', 'Margherita pizza', 'Vegetable pizza', 'Chicken curry', 'Beef curry', 'Vegetable curry', 'Chicken stir fry', 'Beef stir fry', 'Fried rice', 'Pasta tomato sauce', 'Pasta meat sauce', 'Baked chicken', 'Roast beef', 'Grilled salmon', 'Vegetable soup', 'Chicken soup'],
};

const presets: Record<string, [number, number, number, number]> = {
  Staples: [180, 4, 38, 1], Proteins: [180, 25, 2, 8], Vegetables: [35, 2, 6, 0], Fruits: [65, 1, 16, 0],
  Dairy: [110, 8, 10, 4], Snacks: [170, 5, 18, 9], Vietnamese: [360, 18, 42, 13], Drinks: [80, 1, 16, 1],
  Legumes: [150, 9, 24, 2], Prepared: [380, 20, 35, 16],
};

export const seedFoods: readonly SeedFood[] = Object.entries(groups).flatMap(([category, names]) =>
  names.map((name, index) => {
    const [calories, protein, carbs, fat] = presets[category];
    const factor = 0.85 + (index % 4) * 0.1;
    return {
      name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      category, serving_size: category === 'Drinks' ? 250 : 100, unit: category === 'Drinks' ? 'ml' : 'g',
      calories: Math.round(calories * factor), protein: Math.round(protein * factor * 10) / 10,
      carbs: Math.round(carbs * factor * 10) / 10, fat: Math.round(fat * factor * 10) / 10, status: 'PUBLISHED' as const,
    };
  }),
);
