const { getAdminFoods, getCart, saveCart, getFavorites, getOrders, saveOrders, getProfile, saveProfile, peso } = TamBayts;
const findFood = (name) => getAdminFoods().find((food) => food.name === name && food.available);
const toast = document.querySelector("#toast");
function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}
function updateBadges() {
  const count = getCart().reduce((total, item) => total + item.quantity, 0);
  document.querySelectorAll(".cart-badge, #cart-badge").forEach((badge) => {
    badge.textContent = count;
    badge.classList.toggle("has-items", count > 0);
  });
}
function renderCartPage() {
  const target = document.querySelector("#cart-page-items");
  if (!target) return;
  const items = getCart().map((cartItem) => ({ ...findFood(cartItem.name), quantity: cartItem.quantity })).filter((item) => item.name);
  target.innerHTML = items.length ? items.map((item) => `<article class="cart-page-line"><div><h2>${item.name}</h2><p>${item.category}</p></div><strong>${peso(item.price * item.quantity)}</strong><div class="cart-quantity"><button data-decrease="${item.name}" aria-label="Remove one ${item.name}">−</button><span>${item.quantity}</span><button data-increase="${item.name}" aria-label="Add one ${item.name}">+</button></div></article>`).join("")
    : '<div class="cart-empty"><span>🛒</span><h2>Your cart is empty</h2><p>Add something tasty from the menu.</p><a href="index.html">Browse food</a></div>';
  document.querySelector("#cart-page-total").textContent = peso(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
}
function renderOrders(status = "active") {
  const target = document.querySelector("#order-list");
  if (!target) return;
  const shown = getOrders().filter((order) => status === "past" ? ["Picked up", "Completed"].includes(order.status) : !["Picked up", "Completed"].includes(order.status));
  target.innerHTML = shown.length ? shown.map((order) => {
    const ready = order.status === "Ready";
    const done = ["Picked up", "Completed"].includes(order.status);
    const action = order.status === "Preparing" ? `<button data-ready="${order.id}">Mark ready</button>` : ready ? `<button data-pickup="${order.id}">Confirm pickup</button>` : "";
    return `<article class="order-card"><div class="order-top"><div><span class="order-status ${ready ? "ready" : "preparing"}">${order.status}</span><h2>Order #${order.id}</h2><p>${(order.names || []).join(", ")}</p></div><strong>${peso(order.total)}</strong></div><div class="order-progress"><span class="done"></span><span class="${order.status !== "Preparing" ? "done" : "current"}"></span><span class="${ready || done ? "done" : ""}"></span></div><div class="order-labels"><span>Confirmed</span><span>Preparing</span><span>Ready</span></div><div class="order-action"><span>${done ? "Picked up" : `Placed ${order.createdAt}`}</span>${action}</div></article>`;
  }).join("") : '<article class="empty-order"><span>☼</span><h2>No orders here yet</h2><p>Browse the menu when you are ready for a meal.</p><a href="index.html">Browse food</a></article>';
}
function renderProfile() {
  const profile = getProfile();
  const name = document.querySelector("#profile-name");
  if (!name) return;
  name.textContent = profile.name;
  document.querySelector("#profile-course").textContent = profile.course;
  document.querySelector(".avatar").textContent = profile.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const favorites = getFavorites().map(findFood).filter(Boolean);
  document.querySelector("#saved-list").innerHTML = favorites.length ? favorites.map((item) => `<p>★ <span>${item.name}</span><small>${item.category}</small></p>`).join("") : '<p class="no-favorites">No favorites yet. Tap a star on Home to save a meal.</p>';
}
document.querySelector("#cart-page-items")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-increase], [data-decrease]");
  if (!button) return;
  const name = button.dataset.increase || button.dataset.decrease;
  const cart = getCart();
  const item = cart.find((cartItem) => cartItem.name === name);
  if (!item) return;
  item.quantity += button.dataset.increase ? 1 : -1;
  saveCart(cart.filter((cartItem) => cartItem.quantity > 0));
  renderCartPage();
  updateBadges();
});
document.querySelector("#place-order")?.addEventListener("click", async (event) => {
  const cart = getCart();
  if (!cart.length) return showToast("Your cart is empty.");
  const items = cart.map((cartItem) => ({ ...findFood(cartItem.name), quantity: cartItem.quantity })).filter((item) => item.name);
  if (!items.length) return showToast("Your cart has no valid items.");
  const button = event.currentTarget;
  button.disabled = true;
  button.textContent = "Saving order…";
  try {
    let clientId = localStorage.getItem("tambayts-client-id");
    if (!clientId) {
      clientId = crypto.randomUUID();
      localStorage.setItem("tambayts-client-id", clientId);
    }
    const response = await fetch("api/orders.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        student: getProfile().name,
        items: items.map(({ name, quantity }) => ({ name, quantity })),
      }),
    });
    const responseText = await response.text();
    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      const isPhpPage = responseText.trimStart().startsWith("<");
      throw new Error(isPhpPage
        ? "The order API returned a server error. Open the site through XAMPP (http://localhost/...) and check the PHP error log."
        : "The order API returned an empty or invalid response. Make sure Apache and MySQL are running in XAMPP and open the site through http://localhost/...");
    }
    if (!response.ok) throw new Error(result.error || "Order could not be saved.");
    saveOrders([result.order, ...getOrders()]);
    saveCart([]);
    location.href = "orders.html";
  } catch (error) {
    showToast(error.message || "Could not connect to the order database.");
    button.disabled = false;
    button.textContent = "Place order";
  }
});
document.querySelector("#order-tabs")?.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  document.querySelectorAll("#order-tabs button").forEach((tab) => tab.classList.toggle("selected", tab === button));
  renderOrders(button.dataset.tab);
});
document.querySelector("#order-list")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-ready], [data-pickup]");
  if (!button) return;
  const orders = getOrders();
  const order = orders.find((item) => item.id === (button.dataset.ready || button.dataset.pickup));
  if (!order) return;
  order.status = button.dataset.ready ? "Ready" : "Picked up";
  saveOrders(orders);
  renderOrders(document.querySelector("#order-tabs .selected")?.dataset.tab || "active");
});
document.querySelector("#edit-profile")?.addEventListener("click", () => {
  const profile = getProfile();
  const name = prompt("Your display name", profile.name);
  if (!name?.trim()) return;
  saveProfile({ ...profile, name: name.trim() });
  renderProfile();
  showToast("Profile updated");
});
document.querySelector("#settings-list")?.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (button) showToast(`${button.dataset.setting} settings will be available soon.`);
});
updateBadges();
renderCartPage();
renderOrders();
renderProfile();
