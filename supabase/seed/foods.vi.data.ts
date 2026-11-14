import { seedFoods } from '../../server/src/lib/constants/foods.data.js';

export type VietnameseFoodSeed = { slug: string; name: string };

// DRAFT translations written by AI. A Vietnamese speaker MUST review them before real users see them.
const VietnameseDishNames: Record<string, string> = {
  'pho-bo': 'Phở bò', 'pho-ga': 'Phở gà', 'banh-mi': 'Bánh mì', 'bun-cha': 'Bún chả',
  'bun-thit-nuong': 'Bún thịt nướng', 'com-tam': 'Cơm tấm', 'goi-cuon': 'Gỏi cuốn',
  'cha-gio': 'Chả giò', 'banh-xeo': 'Bánh xèo', 'bo-kho': 'Bò kho', 'ca-kho-to': 'Cá kho tộ',
  'canh-chua-ca': 'Canh chua cá', 'thit-kho-trung': 'Thịt kho trứng', 'mi-quang': 'Mì Quảng',
  'bun-bo-hue': 'Bún bò Huế', 'hu-tieu': 'Hủ tiếu', 'xoi-ga': 'Xôi gà', 'chao-ga': 'Cháo gà',
  'com-chien': 'Cơm chiên', 'che-dau-den': 'Chè đậu đen',
};

export const vietnameseFoods: Record<string, VietnameseFoodSeed> = Object.fromEntries(
  seedFoods.map((food) => [food.slug, { slug: food.slug, name: VietnameseDishNames[food.slug] ?? food.name }]),
);
