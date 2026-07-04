import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

import { firebaseConfig, DISCORD_WEBHOOK_URL } from "./firebase.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let currentUser = null;
let products = [];
let users = [];
let sales = [];
let cart = [];
let selectedCategory = "Alle";
let discount = 0;
let editingProductId = null;
let editingUserId = null;

const rolePower = {
  "Geschäftsführer": 4,
  "Geschäftsleitung": 3,
  "Mitarbeiter": 2,
  "Praktikant": 1
};

const defaultProducts = [
  { name: "Cola", category: "Getränke", price: 130, icon: "🥤", stock: 100 },
  { name: "Tè Freddo al Limone", category: "Getränke", price: 195, icon: "🥤", stock: 100 },
  { name: "Energy Drink", category: "Getränke", price: 200, icon: "⚡", stock: 100 },
  { name: "Vino della Casa", category: "Getränke", price: 350, icon: "🍷", stock: 100 },
  { name: "Pizza Margherita", category: "Pizza", price: 330, icon: "🍕", stock: 100 },
  { name: "Pizza Salame", category: "Pizza", price: 330, icon: "🍕", stock: 100 },
  { name: "Pizza Tonno", category: "Pizza", price: 330, icon: "🍕", stock: 100 },
  { name: "Pasta Carbonara", category: "Pasta", price: 300, icon: "🍝", stock: 100 },
  { name: "Pasta Bolognese", category: "Pasta", price: 300, icon: "🍝", stock: 100 },
  { name: "Lasagna", category: "Pasta", price: 550, icon: "🍝", stock: 100 },
  { name: "Tiramisu", category: "Dessert", price: 300, icon: "🍰", stock: 100 },
  { name: "Panna Cotta", category: "Dessert", price: 300, icon: "🍮", stock: 100 },
  { name: "Menü 1", category: "Menüs", price: 540, icon: "🍽️", stock: 100 },
  { name: "Menü 2", category: "Menüs", price: 600, icon: "🍽️", stock: 100 },
  { name: "Menü 3", category: "Menüs", price: 860, icon: "🍽️", stock: 100 }
];

const menuIngredients = {
  "Menü 1": ["Tè Freddo al Limone", "Pizza Margherita", "Panna Cotta"],
  "Menü 2": ["Cola", "Pasta Carbonara", "Tiramisu"],
  "Menü 3": ["Energy Drink"]
};

const $ = id => document.getElementById(id);

$("loginBtn").addEventListener("click", login);
$("logoutBtn").addEventListener("click", logout);
$("checkoutBtn").addEventListener("click", checkout);
$("clearCartBtn").addEventListener("click", clearCart);
$("removeDiscountBtn").addEventListener("click", () => {
  discount = 0;
  renderDiscountButtons();
  renderCart();
});
$("addProductBtn").addEventListener("click", saveProduct);
$("addUserBtn").addEventListener("click", saveUser);
$("dailyCloseBtn").addEventListener("click", dailyClose);

document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => switchPage(btn.dataset.page));
});

$("loginUsername").addEventListener("keydown", e => {
  if (e.key === "Enter") login();
});

$("loginPassword").addEventListener("keydown", e => {
  if (e.key === "Enter") login();
});

async function boot() {
  await ensureDefaultAdmin();
  await ensureDefaultProducts();
  listenProducts();
  listenUsers();
  listenSales();
  renderDiscountButtons();
}

async function ensureDefaultAdmin() {
  const adminRef = doc(db, "users", "admin");
  const snap = await getDoc(adminRef);

  if (!snap.exists()) {
    await setDoc(adminRef, {
      username: "admin",
      password: "admin123",
      role: "Geschäftsführer",
      active: true,
      createdAt: serverTimestamp()
    });
  }
}

async function ensureDefaultProducts() {
  const snap = await getDocs(collection(db, "products"));

  if (snap.empty) {
    for (const p of defaultProducts) {
      await addDoc(collection(db, "products"), {
        ...p,
        active: true,
        createdAt: serverTimestamp()
      });
    }
  }
}

async function login() {
  const username = $("loginUsername").value.trim();
  const password = $("loginPassword").value.trim();

  $("loginError").textContent = "";

  if (!username || !password) {
    $("loginError").textContent = "Bitte Benutzername und Passwort eingeben.";
    return;
  }

  const userRef = doc(db, "users", username);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    $("loginError").textContent = "Benutzer nicht gefunden.";
    return;
  }

  const user = snap.data();

  if (!user.active) {
    $("loginError").textContent = "Dieser Benutzer ist deaktiviert.";
    return;
  }

  if (user.password !== password) {
    $("loginError").textContent = "Passwort falsch.";
    return;
  }

  currentUser = user;
  $("loginScreen").classList.add("hidden");
  $("appScreen").classList.remove("hidden");
  $("currentUserLabel").textContent = `${user.username} | ${user.role}`;

  applyRoleVisibility();
  await discordLog(`✅ Login: **${user.username}** (${user.role})`);
}

function logout() {
  currentUser = null;
  cart = [];
  discount = 0;
  $("loginScreen").classList.remove("hidden");
  $("appScreen").classList.add("hidden");
  $("loginPassword").value = "";
  renderCart();
}

function applyRoleVisibility() {
  const power = rolePower[currentUser.role] || 0;

  document.querySelector('[data-page="usersPage"]').style.display = power >= 4 ? "block" : "none";
  document.querySelector('[data-page="productsPage"]').style.display = power >= 3 ? "block" : "none";
  document.querySelector('[data-page="inventoryPage"]').style.display = power >= 2 ? "block" : "none";
  document.querySelector('[data-page="statsPage"]').style.display = power >= 3 ? "block" : "none";
  document.querySelector('[data-page="closingPage"]').style.display = power >= 3 ? "block" : "none";
}

function hasPower(minRole) {
  return (rolePower[currentUser?.role] || 0) >= minRole;
}

function switchPage(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active-page"));
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));

  $(pageId).classList.add("active-page");
  document.querySelector(`[data-page="${pageId}"]`).classList.add("active");
}

function listenProducts() {
  onSnapshot(collection(db, "products"), snap => {
    products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderCategories();
    renderProducts();
    renderInventory();
    renderProductsAdmin();
  });
}

function listenUsers() {
  onSnapshot(collection(db, "users"), snap => {
    users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderUsersAdmin();
  });
}

function listenSales() {
  const q = query(collection(db, "sales"), orderBy("createdAtMs", "desc"));

  onSnapshot(q, snap => {
    sales = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderStats();
  });
}

function renderCategories() {
  const categories = ["Alle", ...new Set(products.filter(p => p.active).map(p => p.category))];

  $("categoryButtons").innerHTML = categories.map(cat => `
    <button class="${selectedCategory === cat ? "active-discount" : ""}" onclick="window.selectCategory('${cat}')">
      ${cat}
    </button>
  `).join("");
}

window.selectCategory = function(cat) {
  selectedCategory = cat;
  renderCategories();
  renderProducts();
};

function renderProducts() {
  const visible = products.filter(p => p.active && (selectedCategory === "Alle" || p.category === selectedCategory));

  $("productGrid").innerHTML = visible.map(p => `
    <div class="product-card">
      <div class="icon">${p.icon || "🍽️"}</div>
      <h3>${p.name}</h3>
      <small>${p.category}</small>
      <p>${money(p.price)}</p>
      <small>Lager: ${p.stock ?? 0}</small>
      <br><br>
      <button onclick="window.addToCart('${p.id}')">Hinzufügen</button>
    </div>
  `).join("");
};

window.addToCart = function(productId) {
  const product = products.find(p => p.id === productId);

  if (!product) return;

  const existing = cart.find(item => item.id === product.id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: 1
    });
  }

  renderCart();
};

function renderCart() {
  if (cart.length === 0) {
    $("cartItems").innerHTML = "<p>Warenkorb leer</p>";
  } else {
    $("cartItems").innerHTML = cart.map(item => `
      <div class="cart-item">
        <div>
          <b>${item.quantity}x ${item.name}</b><br>
          <small>${money(item.price)} pro Stück</small><br>
          <b>${money(item.price * item.quantity)}</b>
        </div>
        <div class="cart-actions">
          <button onclick="window.changeQty('${item.id}', -1)">-</button>
          <button onclick="window.changeQty('${item.id}', 1)">+</button>
          <button class="danger" onclick="window.removeCartItem('${item.id}')">X</button>
        </div>
      </div>
    `).join("");
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = Math.round(subtotal * (1 - discount / 100));

  $("subtotalLabel").textContent = money(subtotal);
  $("discountLabel").textContent = `${discount} %`;
  $("totalLabel").textContent = money(total);
}

window.changeQty = function(id, amount) {
  const item = cart.find(i => i.id === id);
  if (!item) return;

  item.quantity += amount;

  if (item.quantity <= 0) {
    cart = cart.filter(i => i.id !== id);
  }

  renderCart();
};

window.removeCartItem = function(id) {
  cart = cart.filter(i => i.id !== id);
  renderCart();
};

function clearCart() {
  cart = [];
  discount = 0;
  renderDiscountButtons();
  renderCart();
}

function renderDiscountButtons() {
  let html = "";

  for (let i = 5; i <= 100; i += 5) {
    html += `<button class="${discount === i ? "active-discount" : ""}" onclick="window.setDiscount(${i})">${i}%</button>`;
  }

  $("discountButtons").innerHTML = html;
}

window.setDiscount = function(value) {
  discount = value;
  renderDiscountButtons();
  renderCart();
};

async function checkout() {
  if (cart.length === 0) {
    alert("Warenkorb ist leer.");
    return;
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = Math.round(subtotal * (1 - discount / 100));

  for (const item of cart) {
    const product = products.find(p => p.id === item.id);
    if (!product) continue;

    let amountToSubtract = item.quantity;

    if (menuIngredients[item.name]) {
      amountToSubtract = item.quantity;
    }

    const newStock = Math.max(0, Number(product.stock || 0) - amountToSubtract);
    await updateDoc(doc(db, "products", product.id), { stock: newStock });
  }

  await addDoc(collection(db, "sales"), {
    items: cart,
    subtotal,
    discount,
    total,
    user: currentUser.username,
    role: currentUser.role,
    createdAt: serverTimestamp(),
    createdAtMs: Date.now()
  });

  await discordLog(
    `🧾 Verkauf abgeschlossen von **${currentUser.username}**\n` +
    `Artikel: ${cart.map(i => `${i.quantity}x ${i.name}`).join(", ")}\n` +
    `Rabatt: ${discount}%\n` +
    `Gesamt: **${money(total)}**`
  );

  clearCart();
  alert("Verkauf abgeschlossen.");
}

async function saveProduct() {
  if (!hasPower(3)) {
    alert("Keine Berechtigung.");
    return;
  }

  const name = $("productName").value.trim();
  const category = $("productCategory").value.trim();
  const price = Number($("productPrice").value);
  const icon = $("productIcon").value.trim();
  const stock = Number($("productStock").value);

  if (!name || !category || !price) {
    alert("Bitte Produktname, Kategorie und Preis eingeben.");
    return;
  }

  const data = {
    name,
    category,
    price,
    icon: icon || "🍽️",
    stock: stock || 0,
    active: true,
    updatedAt: serverTimestamp()
  };

  if (editingProductId) {
    await updateDoc(doc(db, "products", editingProductId), data);
    await discordLog(`✏️ Produkt bearbeitet: **${name}**`);
  } else {
    await addDoc(collection(db, "products"), {
      ...data,
      createdAt: serverTimestamp()
    });
    await discordLog(`➕ Produkt hinzugefügt: **${name}**`);
  }

  editingProductId = null;
  $("addProductBtn").textContent = "Produkt speichern";
  clearProductForm();
}

function renderProductsAdmin() {
  $("productsAdminList").innerHTML = products.map(p => `
    <div class="admin-item">
      <div>
        <b>${p.icon || "🍽️"} ${p.name}</b><br>
        Kategorie: ${p.category}<br>
        Preis: ${money(p.price)}<br>
        Lager: ${p.stock ?? 0}<br>
        Status: ${p.active ? "Aktiv" : "Inaktiv"}
      </div>
      <div class="admin-buttons">
        <button onclick="window.editProduct('${p.id}')">Bearbeiten</button>
        <button onclick="window.toggleProduct('${p.id}')">${p.active ? "Deaktivieren" : "Aktivieren"}</button>
        <button class="danger" onclick="window.deleteProduct('${p.id}')">Löschen</button>
      </div>
    </div>
  `).join("");
}

window.editProduct = function(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;

  editingProductId = id;
  $("productName").value = p.name;
  $("productCategory").value = p.category;
  $("productPrice").value = p.price;
  $("productIcon").value = p.icon;
  $("productStock").value = p.stock;
  $("addProductBtn").textContent = "Produkt ändern";
};

window.toggleProduct = async function(id) {
  const p = products.find(x => x.id === id);
  await updateDoc(doc(db, "products", id), { active: !p.active });
};

window.deleteProduct = async function(id) {
  if (!confirm("Produkt wirklich löschen?")) return;
  await deleteDoc(doc(db, "products", id));
};

function clearProductForm() {
  $("productName").value = "";
  $("productCategory").value = "";
  $("productPrice").value = "";
  $("productIcon").value = "";
  $("productStock").value = "";
}

function renderInventory() {
  $("inventoryList").innerHTML = products.map(p => `
    <div class="admin-item">
      <div>
        <b>${p.name}</b><br>
        Lager: ${p.stock ?? 0}
      </div>
      <div class="admin-buttons">
        <button onclick="window.changeStock('${p.id}', -1)">-1</button>
        <button onclick="window.changeStock('${p.id}', 1)">+1</button>
        <button onclick="window.changeStock('${p.id}', 10)">+10</button>
      </div>
    </div>
  `).join("");
}

window.changeStock = async function(id, amount) {
  if (!hasPower(2)) {
    alert("Keine Berechtigung.");
    return;
  }

  const p = products.find(x => x.id === id);
  const newStock = Math.max(0, Number(p.stock || 0) + amount);

  await updateDoc(doc(db, "products", id), { stock: newStock });
  await discordLog(`📦 Lager geändert: **${p.name}** jetzt ${newStock}`);
};

async function saveUser() {
  if (!hasPower(4)) {
    alert("Nur Geschäftsführer darf Mitarbeiter verwalten.");
    return;
  }

  const username = $("newUsername").value.trim();
  const password = $("newPassword").value.trim();
  const role = $("newRole").value;

  if (!username || !password || !role) {
    alert("Bitte Benutzername, Passwort und Rolle eingeben.");
    return;
  }

  await setDoc(doc(db, "users", username), {
    username,
    password,
    role,
    active: true,
    updatedAt: serverTimestamp()
  }, { merge: true });

  await discordLog(`👤 Mitarbeiter gespeichert: **${username}** (${role})`);

  editingUserId = null;
  clearUserForm();
}

function renderUsersAdmin() {
  $("usersAdminList").innerHTML = users.map(u => `
    <div class="admin-item">
      <div>
        <b>${u.username}</b><br>
        Rolle: ${u.role}<br>
        Status: ${u.active ? "Aktiv" : "Inaktiv"}
      </div>
      <div class="admin-buttons">
        <button onclick="window.editUser('${u.username}')">Bearbeiten</button>
        <button onclick="window.toggleUser('${u.username}')">${u.active ? "Deaktivieren" : "Aktivieren"}</button>
        ${u.username !== "admin" ? `<button class="danger" onclick="window.deleteUser('${u.username}')">Löschen</button>` : ""}
      </div>
    </div>
  `).join("");
}

window.editUser = function(username) {
  const u = users.find(x => x.username === username);
  if (!u) return;

  editingUserId = username;
  $("newUsername").value = u.username;
  $("newUsername").disabled = true;
  $("newPassword").value = u.password;
  $("newRole").value = u.role;
};

window.toggleUser = async function(username) {
  if (username === "admin") {
    alert("Admin kann nicht deaktiviert werden.");
    return;
  }

  const u = users.find(x => x.username === username);
  await updateDoc(doc(db, "users", username), { active: !u.active });
};

window.deleteUser = async function(username) {
  if (username === "admin") return;
  if (!confirm("Mitarbeiter wirklich löschen?")) return;

  await deleteDoc(doc(db, "users", username));
};

function clearUserForm() {
  $("newUsername").value = "";
  $("newUsername").disabled = false;
  $("newPassword").value = "";
  $("newRole").value = "Mitarbeiter";
}

function renderStats() {
  const today = new Date().toDateString();

  const todaySalesArr = sales.filter(s => new Date(s.createdAtMs).toDateString() === today);
  const todayRevenueSum = todaySalesArr.reduce((sum, s) => sum + Number(s.total || 0), 0);
  const totalRevenueSum = sales.reduce((sum, s) => sum + Number(s.total || 0), 0);

  $("todayRevenue").textContent = money(todayRevenueSum);
  $("todaySales").textContent = todaySalesArr.length;
  $("totalRevenue").textContent = money(totalRevenueSum);
  $("totalSales").textContent = sales.length;

  $("salesList").innerHTML = sales.slice(0, 30).map(s => `
    <div class="admin-item">
      <div>
        <b>${money(s.total)}</b><br>
        Mitarbeiter: ${s.user}<br>
        Rabatt: ${s.discount}%<br>
        Artikel: ${s.items.map(i => `${i.quantity}x ${i.name}`).join(", ")}<br>
        Datum: ${new Date(s.createdAtMs).toLocaleString("de-DE")}
      </div>
    </div>
  `).join("");
}

async function dailyClose() {
  const today = new Date().toDateString();
  const todaySalesArr = sales.filter(s => new Date(s.createdAtMs).toDateString() === today);
  const revenue = todaySalesArr.reduce((sum, s) => sum + Number(s.total || 0), 0);

  const text =
    `Tagesabschluss\n\n` +
    `Datum: ${new Date().toLocaleDateString("de-DE")}\n` +
    `Verkäufe: ${todaySalesArr.length}\n` +
    `Umsatz: ${money(revenue)}\n` +
    `Erstellt von: ${currentUser.username}`;

  $("dailyCloseResult").textContent = text;

  await addDoc(collection(db, "dailyClosings"), {
    date: new Date().toLocaleDateString("de-DE"),
    salesCount: todaySalesArr.length,
    revenue,
    user: currentUser.username,
    createdAt: serverTimestamp(),
    createdAtMs: Date.now()
  });

  await discordLog(`📊 **Tagesabschluss**\n${text}`);
}

async function discordLog(message) {
  if (!DISCORD_WEBHOOK_URL || DISCORD_WEBHOOK_URL.includes("DEIN_NEUER")) return;

  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: "La Casa del Nonno Kassensystem",
        content: message
      })
    });
  } catch (err) {
    console.error("Discord Webhook Fehler:", err);
  }
}

function money(value) {
  return `${Number(value || 0).toLocaleString("de-DE")} €`;
}

boot();
