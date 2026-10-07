window.TamBayts = (() => {
  const foods = [
    { name: "Chicken Pastil", price: 25, category: "meals", color: "linear-gradient(100deg, #3ab4d7, #0756b5)" },
    { name: "Buffalo Wings", price: 80, category: "meals", color: "linear-gradient(100deg, #9852dc, #ff8751)" },
    { name: "Sisig", price: 80, category: "meals", color: "linear-gradient(180deg, #16731d, #37d11c)" },
    { name: "Siomai Rice", price: 45, category: "meals", color: "linear-gradient(100deg, #18aeba, #7adc4b)" },
    { name: "Beef Steak", price: 75, category: "meals", color: "linear-gradient(100deg, #090909, #bd870e)" },
    { name: "Tapsilog", price: 80, category: "meals", color: "linear-gradient(180deg, #9b3a12, #ed6b3c)" },
    { name: "Adobo", price: 80, category: "meals", color: "linear-gradient(100deg, #7dcf4e, #c5e552)" },
    { name: "Hotsilog", price: 65, category: "meals", color: "linear-gradient(180deg, #853c9a, #894bbe 36%, #f3c623 75%)" },
    { name: "Hungsilog", price: 70, category: "meals", color: "linear-gradient(180deg, #a13d16, #f0713d)" },
    { name: "Bottled Iced Tea", price: 25, category: "drinks", color: "linear-gradient(100deg, #3181cc, #35c7c6)" },
    { name: "Fruit Bowl", price: 60, category: "healthy", color: "linear-gradient(100deg, #4aaf59, #c5dc49)" },
    { name: "Cheese Sticks", price: 35, category: "snacks", color: "linear-gradient(100deg, #e1871a, #f4c846)" },
    { name: "Carbonara", price: 75, category: "pasta", color: "linear-gradient(100deg, #d8b46c, #9f6f27)" },
  ];

  const read = (key, fallback) => {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch {
      return fallback;
    }
  };
  const readArray = (key, fallback) => {
    const value = read(key, fallback);
    return Array.isArray(value) ? value : fallback;
  };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

  return {
    foods,
    peso: (amount) => `₱${amount}`,
    getCart: () => readArray("tambayts-cart", []).map((item) =>
      typeof item === "string" ? { name: item, quantity: 1 } :
        item && typeof item.name === "string" ? { name: item.name, quantity: Math.max(1, Number(item.quantity) || 1) } : null,
    ).filter(Boolean),
    saveCart: (value) => write("tambayts-cart", value),
    getFavorites: () => readArray("tambayts-favorites", ["Buffalo Wings", "Hotsilog"]),
    saveFavorites: (value) => write("tambayts-favorites", value),
    getOrders: () => readArray("tambayts-orders", [
      { id: "TB-1024", names: ["Buffalo Wings"], total: 80, status: "Preparing", createdAt: "Today", student: "Alex P." },
    ]),
    saveOrders: (value) => write("tambayts-orders", value),
    getProfile: () => read("tambayts-profile", { name: "Alex P.", course: "Campus Student · 2026" }),
    saveProfile: (value) => write("tambayts-profile", value),
    getAdminFoods: () => readArray("tambayts-menu", foods).map((food) => ({ available: true, ...food })),
    saveAdminFoods: (value) => write("tambayts-menu", value),
    getStudents: () => readArray("tambayts-students", []),
  };
})();
