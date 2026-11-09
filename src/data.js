const photos = {
  sandwich: "photo-1528735602780-2552fd46c7af",
  pasta: "photo-1473093295043-cdd812d0e601",
  rice: "photo-1512058564366-18510be2db19",
  croissant: "photo-1555507036-ab1f4038808a",
  wrap: "photo-1626700051175-6818013e1d4f",
  burger: "photo-1568901346375-23c9450c58cd",
  samosa: "photo-1601050690597-df0568f70950",
  dessert: "photo-1578985545062-69928b1d9587",
  coffee: "photo-1509042239860-f550ce710b93",
  salad: "photo-1512621776951-a57141f2eefd",
  noodles: "photo-1569718212165-3a8278d5f624",
  dosa: "photo-1630383249896-424e482df921",
  muffin: "photo-1607958996333-41aef7caefaa",
  smoothie: "photo-1505252585461-04db1eb84625",
  pizza: "photo-1513104890138-7c749659a591",
};

const image = (name) =>
  `https://images.unsplash.com/${photos[name]}?auto=format&fit=crop&w=960&q=85`;

const samples = [
  ["Grilled Veggie Sandwich", "Campus Café", "Quick Meals", 100, 50, 4, "6:30 PM", "sandwich", ["Vegetarian"], "Toasted sourdough packed with grilled seasonal vegetables, greens and house pesto."],
  ["Creamy Tomato Penne", "The Food Court", "Pasta & Noodles", 180, 90, 3, "7:00 PM", "pasta", ["Vegetarian"], "Penne tossed in a slow-cooked tomato cream sauce with parmesan."],
  ["Paneer Tikka Rice Bowl", "Green Bowl", "Quick Meals", 210, 110, 5, "7:30 PM", "rice", ["Vegetarian", "High protein"], "Smoky paneer tikka, fragrant rice, crunchy slaw and mint yoghurt."],
  ["Butter Croissant", "Bakers' Corner", "Bakery", 90, 40, 6, "6:15 PM", "croissant", ["Vegetarian"], "Flaky, buttery layers baked fresh this morning."],
  ["Falafel Hummus Wrap", "Green Bowl", "Healthy Bites", 160, 80, 3, "7:15 PM", "wrap", ["Vegan"], "Crispy falafel, creamy hummus and crisp greens in a soft wrap."],
  ["Classic Veg Burger", "The Food Court", "Quick Meals", 150, 75, 2, "6:50 PM", "burger", ["Vegetarian"], "A golden veggie patty with lettuce, tomato and our signature sauce."],
  ["Crispy Aloo Samosa", "Snack Station", "Snacks", 40, 20, 8, "6:10 PM", "samosa", ["Vegan"], "Golden pastry filled with spiced potato and green peas."],
  ["Chocolate Fudge Slice", "Bakers' Corner", "Desserts", 120, 55, 2, "6:40 PM", "dessert", ["Vegetarian"], "Rich chocolate cake with a glossy fudge finish."],
  ["Iced Vanilla Latte", "Brew & Bite", "Beverages", 140, 70, 4, "7:45 PM", "coffee", ["Vegetarian"], "A double shot over chilled milk with a hint of vanilla."],
  ["Garden Greens Salad", "Green Bowl", "Healthy Bites", 170, 85, 3, "7:20 PM", "salad", ["Vegan", "Gluten free"], "Fresh greens, cucumber, tomato and lemon-tahini dressing."],
  ["Chilli Garlic Noodles", "The Noodle Stop", "Pasta & Noodles", 160, 80, 2, "6:55 PM", "noodles", ["Vegan"], "Wok-tossed noodles with garlic, chilli and crunchy vegetables."],
  ["Masala Dosa", "The Food Court", "Quick Meals", 130, 65, 4, "7:35 PM", "dosa", ["Vegan"], "Crisp rice crepe with spiced potato, coconut chutney and sambar."],
  ["Blueberry Muffin", "Bakers' Corner", "Bakery", 85, 40, 5, "8:00 PM", "muffin", ["Vegetarian"], "Soft-baked muffin studded with juicy blueberries."],
  ["Mango Yogurt Smoothie", "Brew & Bite", "Beverages", 120, 60, 3, "7:50 PM", "smoothie", ["Vegetarian"], "Ripe mango blended with chilled yoghurt and a touch of honey."],
  ["Margherita Pizza Slice", "Campus Café", "Snacks", 110, 55, 4, "7:10 PM", "pizza", ["Vegetarian"], "A generous slice topped with tomato, mozzarella and basil."],
];

export function createSampleListings() {
  const now = Date.now();
  const offsets = [25, 55, 95, 140, 185, 225, 270, 315, 360, 405, 450, 495, 540, 585, 630];
  return samples.map((row, index) => ({
    id: `demo-${index + 1}`,
    name: row[0],
    outlet: row[1],
    category: row[2],
    originalPrice: row[3],
    rescuePrice: row[4],
    portions: row[5],
    deadline: new Date(now + offsets[index] * 60_000).toISOString(),
    pickupLocation: `${row[1]}, Main Campus`,
    image: image(row[7]),
    dietary: row[8],
    description: row[9],
    ingredients: "Made fresh with seasonal ingredients.",
    allergens: index === 1 ? "Gluten, dairy" : "Ask the outlet team about allergen details.",
    createdAt: new Date(now - 45 * 60_000).toISOString(),
  })).concat([
    {
      id: "demo-soldout",
      name: "Cinnamon Roll",
      outlet: "Bakers' Corner",
      category: "Bakery",
      originalPrice: 95,
      rescuePrice: 45,
      portions: 0,
      deadline: new Date(now + 3 * 60 * 60_000).toISOString(),
      pickupLocation: "Bakers' Corner, Main Campus",
      image: image("croissant"),
      dietary: ["Vegetarian"],
      description: "Soft cinnamon roll finished with a sweet glaze.",
      ingredients: "Flour, cinnamon, butter, sugar.",
      allergens: "Gluten, dairy",
      createdAt: new Date(now - 60 * 60_000).toISOString(),
    },
    {
      id: "demo-expired",
      name: "Roasted Veggie Pita",
      outlet: "Green Bowl",
      category: "Healthy Bites",
      originalPrice: 140,
      rescuePrice: 70,
      portions: 2,
      deadline: new Date(now - 30 * 60_000).toISOString(),
      pickupLocation: "Green Bowl, Main Campus",
      image: image("wrap"),
      dietary: ["Vegan"],
      description: "Roasted vegetables with herby tahini in a warm pita.",
      ingredients: "Pita, seasonal vegetables, tahini.",
      allergens: "Gluten, sesame",
      createdAt: new Date(now - 4 * 60 * 60_000).toISOString(),
    },
  ]);
}

export const initialNotifications = [
  { id: "welcome", title: "Welcome to CampusPantry!", body: "Find your first feel-good food deal today.", time: new Date().toISOString(), read: false, kind: "welcome" },
  { id: "demo-alert", title: "A few deals are closing soon", body: "Catch a delicious rescue before pickup ends.", time: new Date(Date.now() - 10 * 60_000).toISOString(), read: false, kind: "deadline" },
];

export const weekActivity = [
  { day: "Mon", portions: 12 },
  { day: "Tue", portions: 18 },
  { day: "Wed", portions: 15 },
  { day: "Thu", portions: 24 },
  { day: "Fri", portions: 31 },
  { day: "Sat", portions: 20 },
  { day: "Sun", portions: 27 },
];

export const categories = ["All Food", "Quick Meals", "Bakery", "Snacks", "Pasta & Noodles", "Beverages", "Desserts", "Healthy Bites"];
