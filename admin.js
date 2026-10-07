const { getAdminFoods, saveAdminFoods, getOrders, saveOrders, getStudents, peso } = TamBayts;
const byId = (id) => document.getElementById(id);
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[char]));

function notify(message) {
  const toast = byId("admin-toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => toast.classList.remove("show"), 2100);
}

function renderStats() {
  const orders = getOrders();
  const foods = getAdminFoods();
  const students = getStudents();
  const unavailable = foods.filter((item) => !item.available).length;
  byId("stat-orders").textContent = orders.length;
  byId("stat-orders-note").textContent = orders.length ? `${orders.length} recorded order${orders.length === 1 ? "" : "s"}` : "No orders yet";
  byId("stat-sales").textContent = peso(orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0));
  byId("stat-menu").textContent = foods.length - unavailable;
  byId("stat-menu-note").textContent = `${unavailable} unavailable`;
  byId("stat-students").textContent = students.length;
  byId("nav-order-count").textContent = orders.filter((order) => !["Picked up", "Completed", "Cancelled"].includes(order.status)).length;
}

function renderOrders() {
  const orders = getOrders();
  byId("no-orders").classList.toggle("hidden", orders.length > 0);
  byId("admin-orders").innerHTML = orders.slice(0, 8).map((order) => {
    const next = order.status === "Pending" ? "Preparing" : order.status === "Preparing" ? "Ready" : order.status === "Ready" ? "Picked up" : null;
    const statusClass = order.status === "Ready" ? "ready" : ["Picked up", "Completed"].includes(order.status) ? "picked" : "";
    const names = Array.isArray(order.names) ? order.names.join(", ") : (order.names || "—");
    const student = order.student || order.studentName || "Student";
    return `<tr>
      <td class="order-code">#${escapeHtml(order.id)}</td><td>${escapeHtml(student)}</td>
      <td>${escapeHtml(names)}</td><td>${peso(Number(order.total) || 0)}</td>
      <td><span class="status-pill ${statusClass}">${escapeHtml(order.status || "Pending")}</span></td>
      <td><button class="table-action" data-order="${escapeHtml(order.id)}" ${next ? "" : "disabled"}>${next ? `Mark ${escapeHtml(next)}` : "Complete"}</button></td>
    </tr>`;
  }).join("");
}

function renderMenu() {
  const foods = getAdminFoods();
  byId("admin-menu").innerHTML = foods.map((food, index) => `
    <div class="menu-row">
      <span class="food-swatch" style="background:${escapeHtml(food.color || "linear-gradient(140deg,#f4cf75,#e6a94c)")}"></span>
      <div class="menu-details"><strong>${escapeHtml(food.name)}</strong><small>${escapeHtml(food.category)} · ${peso(Number(food.price) || 0)}</small></div>
      <label class="availability ${food.available ? "" : "off"}"><input type="checkbox" data-availability="${index}" ${food.available ? "checked" : ""}> ${food.available ? "Available" : "Hidden"}</label>
    </div>`).join("");
}

function renderStudents() {
  const students = getStudents();
  byId("no-students").classList.toggle("hidden", students.length > 0);
  byId("admin-students").innerHTML = students.slice(0, 8).map((student) => {
    const name = student.name || student.full_name || "Student";
    const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
    return `<div class="student-row"><span class="student-avatar">${escapeHtml(initials)}</span><div><strong>${escapeHtml(name)}</strong><small>${escapeHtml(student.email || student.course || "Canvas student")}</small></div></div>`;
  }).join("");
}

function render() {
  renderStats();
  renderOrders();
  renderMenu();
  renderStudents();
}

byId("admin-orders").addEventListener("click", (event) => {
  const button = event.target.closest("[data-order]");
  if (!button) return;
  const orders = getOrders();
  const order = orders.find((item) => String(item.id) === button.dataset.order);
  if (!order) return;
  order.status = order.status === "Pending" ? "Preparing" : order.status === "Preparing" ? "Ready" : "Picked up";
  saveOrders(orders);
  render();
  notify(`Order #${order.id} updated to ${order.status}.`);
});

byId("admin-menu").addEventListener("change", (event) => {
  const index = Number(event.target.dataset.availability);
  if (!Number.isInteger(index)) return;
  const foods = getAdminFoods();
  if (!foods[index]) return;
  foods[index].available = event.target.checked;
  saveAdminFoods(foods);
  render();
  notify(`${foods[index].name} is ${foods[index].available ? "available" : "hidden"}.`);
});

byId("add-menu-item").addEventListener("click", () => {
  const name = prompt("Menu item name");
  if (!name?.trim()) return;
  const priceValue = prompt("Price in pesos");
  const price = Number(priceValue);
  if (!Number.isFinite(price) || price < 0) {
    notify("Enter a valid price.");
    return;
  }
  const category = prompt("Category (meals, drinks, healthy, snacks, pasta)", "meals") || "meals";
  const foods = getAdminFoods();
  foods.push({ name: name.trim(), price, category: category.trim().toLowerCase(), available: true, color: "linear-gradient(140deg,#f4cf75,#e6a94c)" });
  saveAdminFoods(foods);
  render();
  notify(`${name.trim()} added to the menu.`);
});

render();
