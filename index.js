const { getAdminFoods, getCart, saveCart, getFavorites, saveFavorites, peso } = TamBayts;
const grid = document.querySelector("#food-grid");
const search = document.querySelector("#food-search");
const cartBadge = document.querySelector("#cart-badge");
const toast = document.querySelector("#toast");
let currentCategory = "all";
let sortLowToHigh = false;

function updateBadge() {
  const count = getCart().reduce((total, item) => total + item.quantity, 0);
  cartBadge.textContent = count;
  cartBadge.classList.toggle("has-items", count > 0);
}
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2000);
}
function renderFood() {
  const term = search.value.trim().toLowerCase();
  const cart = getCart();
  const favorites = new Set(getFavorites());
  let shown = getAdminFoods().filter((food) => food.available && (currentCategory === "all" || food.category === currentCategory) && food.name.toLowerCase().includes(term));
  if (sortLowToHigh) shown = [...shown].sort((first, second) => first.price - second.price);
  document.querySelector("#results-message").textContent = term
    ? `${shown.length} result${shown.length === 1 ? "" : "s"} for “${search.value.trim()}”`
    : sortLowToHigh ? "Sorted by lowest price" : "";
  grid.innerHTML = shown.length ? shown.map((food) => {
    const item = cart.find((cartItem) => cartItem.name === food.name);
    const isFavorite = favorites.has(food.name);
    const quantityControl = item
      ? `<div class="quantity-control" aria-label="Quantity for ${food.name}"><button data-decrease="${food.name}" aria-label="Remove one ${food.name}">−</button><strong>${item.quantity}</strong><button data-increase="${food.name}" aria-label="Add one ${food.name}">+</button></div>`
      : `<button class="add-button" data-add="${food.name}" aria-label="Add ${food.name} to cart"></button>`;
    return `<article class="food-card ${item ? "is-added" : ""}"><div class="food-category-label" style="height:47px;padding:12px;display:flex;align-items:center;color:#fff;background:${food.color};font-weight:700;font-size:13px">${food.category}</div><div class="card-body"><h2 class="food-name">${food.name}</h2><button class="favorite ${isFavorite ? "is-favorite" : ""}" data-favorite="${food.name}" aria-label="Favorite ${food.name}">${isFavorite ? "★" : "☆"}</button><span class="price">${peso(food.price)}</span>${quantityControl}</div></article>`;
  }).join("") : '<p class="empty-results">No meals found. Try another search.</p>';
  updateBadge();
}
document.querySelector(".category-row").addEventListener("click", (event) => {
  const button = event.target.closest(".category");
  if (!button) return;
  currentCategory = button.dataset.category;
  document.querySelectorAll(".category").forEach((category) => category.classList.toggle("active", category === button));
  renderFood();
});
document.querySelector("#filter-button").addEventListener("click", () => {
  sortLowToHigh = !sortLowToHigh;
  document.querySelector("#filter-button").innerHTML = sortLowToHigh ? "Lowest price <span>↑</span>" : "Filters <span>⌄</span>";
  renderFood();
});
grid.addEventListener("click", (event) => {
  const favorite = event.target.closest("[data-favorite]");
  const control = event.target.closest("[data-add], [data-increase], [data-decrease]");
  if (favorite) {
    const favorites = getFavorites();
    const name = favorite.dataset.favorite;
    saveFavorites(favorites.includes(name) ? favorites.filter((item) => item !== name) : [...favorites, name]);
    renderFood();
  }
  if (!control) return;
  const name = control.dataset.add || control.dataset.increase || control.dataset.decrease;
  const cart = getCart();
  const item = cart.find((cartItem) => cartItem.name === name);
  const isDecrease = control.hasAttribute("data-decrease");
  if (isDecrease && item) item.quantity -= 1;
  else if (item) item.quantity += 1;
  else cart.push({ name, quantity: 1 });
  saveCart(cart.filter((cartItem) => cartItem.quantity > 0));
  showToast(isDecrease && item?.quantity === 0 ? `${name} removed from your cart` : `${name} quantity updated`);
  renderFood();
});
search.addEventListener("input", renderFood);
renderFood();
