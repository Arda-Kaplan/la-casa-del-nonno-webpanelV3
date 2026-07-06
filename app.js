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
let selectedQuantities = {};
let selectedCategory = "Alle";
let discount = 0;
let editingProductId = null;

const rolePower = {
  "Geschäftsführer": 4,
  "Geschäftsleitung": 3,
  "Mitarbeiter": 2,
  "Praktikant": 1
};

const defaultProducts = [
  { id: "espresso", name: "Espresso", category: "Getränke", price: 190, icon: "☕", stock: 100 },
  { id: "kaffee", name: "Kaffee", category: "Getränke", price: 190, icon: "☕", stock: 100 },
  { id: "hauswein_rot", name: "Hauswein rot", category: "Getränke", price: 350, icon: "🍷", stock: 100 },
  { id: "limoncello", name: "Limoncello", category: "Getränke", price: 350, icon: "🍋", stock: 100 },
  { id: "eistee_pfirsich", name: "Eistee Pfirsich", category: "Getränke", price: 195, icon: "🧊", stock: 100 },
  { id: "cola", name: "Cola", category: "Getränke", price: 130, icon: "🥤", stock: 100 },
  { id: "energy_drink", name: "Energy Drink", category: "Getränke", price: 200, icon: "⚡", stock: 100 },

  { id: "pizza_margherita", name: "Pizza Margherita", category: "Pizzen", price: 330, icon: "🍕", stock: 100 },
  { id: "pizza_salami_scharf", name: "Pizza Salami scharf", category: "Pizzen", price: 330, icon: "🍕", stock: 100 },
  { id: "pizza_tonno_e_cipolla", name: "Pizza Tonno e Cipolla", category: "Pizzen", price: 330, icon: "🍕", stock: 100 },
  { id: "calzone", name: "Calzone", category: "Pizzen", price: 360, icon: "🥟", stock: 100 },

  { id: "gemischte_vorspeisenplatte", name: "Gemischte Vorspeisenplatte", category: "Vorspeisen", price: 110, icon: "🥗", stock: 100 },
  { id: "bruschetta_mit_tomaten", name: "Bruschetta mit Tomaten", category: "Vorspeisen", price: 165, icon: "🥖", stock: 100 },

  { id: "lasagne_al_forno", name: "Lasagne al Forno", category: "Hauptgerichte", price: 550, icon: "🍝", stock: 100 },
  { id: "gemischter_fisch_vom_grill", name: "Gemischter Fisch vom Grill", category: "Hauptgerichte", price: 410, icon: "🐟", stock: 100 },
  { id: "parmigiana_di_melanzane", name: "Parmigiana di Melanzane", category: "Hauptgerichte", price: 450, icon: "🍆", stock: 100 },

  { id: "spaghetti_carbonara", name: "Spaghetti Carbonara", category: "Pasta", price: 300, icon: "🍝", stock: 100 },
  { id: "spaghetti_bolognese", name: "Spaghetti Bolognese", category: "Pasta", price: 300, icon: "🍝", stock: 100 },
  { id: "penne_all_arrabbiata", name: "Penne all’Arrabbiata", category: "Pasta", price: 320, icon: "🍝", stock: 100 },
  { id: "frittatina_di_pasta", name: "Frittatina di Pasta", category: "Pasta", price: 260, icon: "🍝", stock: 100 },

  { id: "hausgemachtes_tiramisu", name: "Hausgemachtes Tiramisu", category: "Desserts", price: 275, icon: "🍰", stock: 100 },
  { id: "panna_cotta_mit_waldbeeren", name: "Panna Cotta mit Waldbeeren", category: "Desserts", price: 110, icon: "🍮", stock: 100 },
  { id: "hausgemachtes_eis", name: "Hausgemachtes Eis", category: "Desserts", price: 400, icon: "🍨", stock: 100 },
  { id: "zeppole_di_san_giuseppe", name: "Zeppole di San Giuseppe", category: "Desserts", price: 320, icon: "🥯", stock: 100 },

  { id: "menu_1", name: "Menü 1 Italienischer Lunch", category: "Menüs", price: 540, icon: "⭐", stock: 100 },
  { id: "menu_2", name: "Menü 2 Traditionelle Hausküche", category: "Menüs", price: 600, icon: "⭐", stock: 100 },
  { id: "menu_3", name: "Menü 3 Fischgenuss", category: "Menüs", price: 860, icon: "⭐", stock: 100 }
];

const menuIngredients = {
  "Menü 1 Italienischer Lunch": [
    "Eistee Pfirsich",
    "Pizza Margherita",
    "Panna Cotta mit Waldbeeren"
  ],
  "Menü 2 Traditionelle Hausküche": [
    "Cola",
    "Spaghetti Carbonara",
    "Hausgemachtes Tiramisu"
  ],
  "Menü 3 Fischgenuss": [
    "Limoncello",
    "Gemischter Fisch vom Grill",
    "Zeppole di San Giuseppe"
  ]
};

const categoryIcons = {
  "Alle": "🍽️",
  "Getränke": "🍷",
  "Pizzen": "🍕",
  "Vorspeisen": "🥗",
  "Hauptgerichte": "🍽️",
  "Pasta": "🍝",
  "Desserts": "🍨",
  "Menüs": "⭐"
};

const oldSeedNamesToDisable = [
  "Vino della Casa",
  "Tè Freddo al Limone",
  "Pizza Salame",
  "Pizza Tonno",
  "Antipasto Italiano della Casa",
  "Bruschetta",
  "Pasta Carbonara",
  "Pasta Bolognese",
  "Lasagna",
  "Grigliata Mista di Pesce",
  "Tiramisu",
  "Panna Cotta",
  "Coppa Gelato della Casa",
  "Menü 1",
  "Menü 2",
  "Menü 3"
];

const $ = id => document.getElementById(id);

$("loginBtn").addEventListener("click", login);
$("logoutBtn").addEventListener("click", logout);
$("checkoutBtn").addEventListener("click", checkout);
$("clearCartBtn").addEventListener("click", clearCart);
$("inventoryQuickBtn").addEventListener("click", () => switchPage("inventoryPage"));

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
  updateClock();
  setInterval(updateClock, 1000);

  await ensureDefaultAdmin();
  await syncMenuProducts();

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

async function syncMenuProducts() {
  const snap = await getDocs(collection(db, "products"));
  const existingProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  for (const product of defaultProducts) {
    const sameNameProduct = existingProducts.find(p => normalize(p.name) === normalize(product.name));
    const stableRef = doc(db, "products", product.id);
    const stableSnap = await getDoc(stableRef);

    if (stableSnap.exists()) {
      await updateDoc(stableRef, {
        name: product.name,
        category: product.category,
        price: product.price,
        icon: product.icon,
        active: true,
        menuProduct: true,
        updatedAt: serverTimestamp()
      });
    } else if (sameNameProduct) {
      await updateDoc(doc(db, "products", sameNameProduct.id), {
        name: product.name,
        category: product.category,
        price: product.price,
        icon: product.icon,
        active: true,
        menuProduct: true,
        updatedAt: serverTimestamp()
      });
    } else {
      await setDoc(stableRef, {
        name: product.name,
        category: product.category,
        price: product.price,
        icon: product.icon,
        stock: product.stock,
        active: true,
        menuProduct: true,
        createdAt: serverTimestamp()
      });
    }
  }

  for (const oldProduct of existingProducts) {
    const isOldSeed = oldSeedNamesToDisable.some(name => normalize(name) === normalize(oldProduct.name));
    const stillExistsInNewMenu = defaultProducts.some(product => normalize(product.name) === normalize(oldProduct.name));

    if (isOldSeed && !stillExistsInNewMenu) {
      await updateDoc(doc(db, "products", oldProduct.id), {
        active: false,
        updatedAt: serverTimestamp()
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

  if (user.active === false) {
    $("loginError").textContent = "Dieser Benutzer ist deaktiviert.";
    return;
  }

  if (String(user.password) !== String(password)) {
    $("loginError").textContent = "Passwort falsch.";
    return;
  }

  currentUser = {
    username: user.username || username,
    password: user.password,
    role: user.role || "Mitarbeiter",
    active: user.active !== false
  };

  $("loginScreen").classList.add("hidden");
  $("appScreen").classList.remove("hidden");
  $("currentUserLabel").textContent = `${currentUser.username} · ${currentUser.role}`;

  applyRoleVisibility();
  await discordLog(`✅ Login: **${currentUser.username}** (${currentUser.role})`);
}

function logout() {
  currentUser = null;
  cart = [];
  selectedQuantities = {};
  discount = 0;

  $("loginScreen").classList.remove("hidden");
  $("appScreen").classList.add("hidden");
  $("loginPassword").value = "";

  renderCart();
  renderProducts();
}

function applyRoleVisibility() {
  const power = rolePower[currentUser.role] || 0;

  document.querySelector('[data-page="usersPage"]').style.display = power >= 4 ? "block" : "none";
  document.querySelector('[data-page="productsPage"]').style.display = power >= 3 ? "block" : "none";
  document.querySelector('[data-page="inventoryPage"]').style.display = power >= 2 ? "block" : "none";
  document.querySelector('[data-page="statsPage"]').style.display = power >= 3 ? "block" : "none";
  document.querySelector('[data-page="closingPage"]').style.display = power >= 3 ? "block" : "none";
  $("inventoryQuickBtn").style.display = power >= 2 ? "block" : "none";
}

function hasPower(minRole) {
  return (rolePower[currentUser?.role] || 0) >= minRole;
}

function switchPage(pageId) {
  document.querySelectorAll(".page").forEach(page => page.classList.remove("active-page"));
  document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));

  $(pageId).classList.add("active-page");

  const tab = document.querySelector(`[data-page="${pageId}"]`);
  if (tab) tab.classList.add("active");
}

function listenProducts() {
  onSnapshot(collection(db, "products"), snapshot => {
    products = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    renderCategories();
    renderProducts();
    renderInventory();
    renderProductsAdmin();
  });
}

function listenUsers() {
  onSnapshot(collection(db, "users"), snapshot => {
    users = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    renderUsersAdmin();
  });
}

function listenSales() {
  const salesQuery = query(collection(db, "sales"), orderBy("createdAtMs", "desc"));

  onSnapshot(salesQuery, snapshot => {
    sales = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    renderStats();
  });
}

function renderCategories() {
  const categories = ["Alle", ...new Set(products.filter(p => p.active !== false).map(p => p.category || "Sonstiges"))];

  $("categoryButtons").innerHTML = categories.map(category => `
    <button class="${selectedCategory === category ? "active-discount" : ""}" data-category="${escapeHtml(category)}">
      ${categoryIcons[category] || "🍽️"} ${escapeHtml(category)}
    </button>
  `).join("");

  document.querySelectorAll("[data-category]").forEach(button => {
    button.addEventListener("click", () => {
      selectedCategory = button.dataset.category;
      renderCategories();
      renderProducts();
    });
  });
}

function renderProducts() {
  const visibleProducts = products.filter(product => {
    const active = product.active !== false;
    const categoryMatch = selectedCategory === "Alle" || product.category === selectedCategory;
    return active && categoryMatch;
  });

  $("productGrid").innerHTML = visibleProducts.map(product => {
    const selectedQuantity = selectedQuantities[product.id] || 0;

    return `
      <div class="product-card">
        <div class="icon">${escapeHtml(product.icon || "🍽️")}</div>
        <h3>${escapeHtml(product.name)}</h3>
        <div class="product-price">${money(product.price)}</div>
        <div class="product-stock">Lager: ${Number(product.stock || 0)}</div>

        <div class="quick-row">
          <button onclick="window.changeSelectedQty('${product.id}', -10)">-10</button>
          <button onclick="window.changeSelectedQty('${product.id}', -5)">-5</button>
          <button class="quantity-display" disabled>${selectedQuantity}</button>
          <button onclick="window.changeSelectedQty('${product.id}', 5)">+5</button>
          <button onclick="window.changeSelectedQty('${product.id}', 10)">+10</button>
        </div>

        <div class="qty-row">
          <button onclick="window.changeSelectedQty('${product.id}', -1)">−</button>
          <button onclick="window.changeSelectedQty('${product.id}', 1)">+</button>
        </div>

        <button class="add-btn" onclick="window.addSelectedToCart('${product.id}')">Hinzufügen</button>
      </div>
    `;
  }).join("");
}

window.changeSelectedQty = function(productId, amount) {
  const current = selectedQuantities[productId] || 0;
  selectedQuantities[productId] = Math.max(0, current + amount);
  renderProducts();
};

window.addSelectedToCart = function(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const quantity = selectedQuantities[productId] || 0;

  if (quantity <= 0) {
    alert("Bitte erst eine Menge auswählen.");
    return;
  }

  const existingItem = cart.find(item => item.id === product.id);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: Number(product.price || 0),
      icon: product.icon || "🍽️",
      quantity
    });
  }

  selectedQuantities[productId] = 0;

  renderCart();
  renderProducts();
};

function renderCart() {
  if (cart.length === 0) {
    $("cartItems").innerHTML = `<div class="cart-item"><div></div><div class="cart-name">Warenkorb leer</div><div></div><div></div></div>`;
  } else {
    $("cartItems").innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="cart-icon">${escapeHtml(item.icon || "🍽️")}</div>
        <div class="cart-name">${item.quantity}x ${escapeHtml(item.name)}</div>
        <div class="cart-price">${money(item.price * item.quantity)}</div>
        <button class="cart-remove" onclick="window.removeCartItem('${item.id}')">×</button>
      </div>
    `).join("");
  }

  const subtotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
  const total = Math.round(subtotal * (1 - discount / 100));

  $("subtotalLabel").textContent = money(subtotal);
  $("discountLabel").textContent = `${discount} %`;
  $("totalLabel").textContent = money(total);
}

window.removeCartItem = function(id) {
  cart = cart.filter(item => item.id !== id);
  renderCart();
};

function clearCart() {
  cart = [];
  selectedQuantities = {};
  discount = 0;
  renderDiscountButtons();
  renderCart();
  renderProducts();
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

  const subtotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
  const total = Math.round(subtotal * (1 - discount / 100));

  for (const item of cart) {
    await subtractStockForSale(item);
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
    `Artikel: ${cart.map(item => `${item.quantity}x ${item.name}`).join(", ")}\n` +
    `Rabatt: ${discount}%\n` +
    `Gesamt: **${money(total)}**`
  );

  clearCart();
  alert("Verkauf abgeschlossen.");
}

async function subtractStockForSale(item) {
  const soldProduct = products.find(product => product.id === item.id);

  if (soldProduct) {
    const newStock = Math.max(0, Number(soldProduct.stock || 0) - Number(item.quantity || 0));
    await updateDoc(doc(db, "products", soldProduct.id), { stock: newStock });
  }

  const ingredients = menuIngredients[item.name];

  if (!ingredients) return;

  for (const ingredientName of ingredients) {
    const ingredientProduct = products.find(product => product.name === ingredientName);
    if (!ingredientProduct) continue;

    const newIngredientStock = Math.max(0, Number(ingredientProduct.stock || 0) - Number(item.quantity || 0));
    await updateDoc(doc(db, "products", ingredientProduct.id), { stock: newIngredientStock });
  }
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
  $("productsAdminList").innerHTML = products.map(product => `
    <div class="admin-item">
      <div>
        <b>${escapeHtml(product.icon || "🍽️")} ${escapeHtml(product.name)}</b><br>
        Kategorie: ${escapeHtml(product.category || "-")}<br>
        Preis: ${money(product.price)}<br>
        Lager: ${Number(product.stock || 0)}<br>
        Status: ${product.active !== false ? "Aktiv" : "Inaktiv"}
      </div>
      <div class="admin-buttons">
        <button onclick="window.editProduct('${product.id}')">Bearbeiten</button>
        <button onclick="window.toggleProduct('${product.id}')">${product.active !== false ? "Deaktivieren" : "Aktivieren"}</button>
        <button class="danger" onclick="window.deleteProduct('${product.id}')">Löschen</button>
      </div>
    </div>
  `).join("");
}

window.editProduct = function(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  editingProductId = id;
  $("productName").value = product.name || "";
  $("productCategory").value = product.category || "";
  $("productPrice").value = product.price || "";
  $("productIcon").value = product.icon || "";
  $("productStock").value = product.stock || "";
  $("addProductBtn").textContent = "Produkt ändern";
};

window.toggleProduct = async function(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  await updateDoc(doc(db, "products", id), { active: product.active === false });
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
  $("inventoryList").innerHTML = products.map(product => `
    <div class="admin-item">
      <div>
        <b>${escapeHtml(product.icon || "🍽️")} ${escapeHtml(product.name)}</b><br>
        Kategorie: ${escapeHtml(product.category || "-")}<br>
        Lager: ${Number(product.stock || 0)}
      </div>
      <div class="admin-buttons">
        <button onclick="window.quickStock('${product.id}', -10)">-10</button>
        <button onclick="window.quickStock('${product.id}', -5)">-5</button>
        <button onclick="window.quickStock('${product.id}', -1)">-1</button>
        <button onclick="window.quickStock('${product.id}', 1)">+1</button>
        <button onclick="window.quickStock('${product.id}', 5)">+5</button>
        <button onclick="window.quickStock('${product.id}', 10)">+10</button>
      </div>
    </div>
  `).join("");
}

window.quickStock = async function(productId, amount) {
  if (!hasPower(2)) {
    alert("Keine Berechtigung für Lageränderung.");
    return;
  }

  const product = products.find(p => p.id === productId);
  if (!product) return;

  const newStock = Math.max(0, Number(product.stock || 0) + amount);
  await updateDoc(doc(db, "products", productId), { stock: newStock });
  await discordLog(`📦 Lager geändert: **${product.name}** jetzt ${newStock}`);
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
  clearUserForm();
}

function renderUsersAdmin() {
  $("usersAdminList").innerHTML = users.map(user => `
    <div class="admin-item">
      <div>
        <b>${escapeHtml(user.username || user.id)}</b><br>
        Rolle: ${escapeHtml(user.role || "Mitarbeiter")}<br>
        Status: ${user.active === false ? "Inaktiv" : "Aktiv"}
      </div>
      <div class="admin-buttons">
        <button onclick="window.editUser('${user.username || user.id}')">Bearbeiten</button>
        <button onclick="window.toggleUser('${user.username || user.id}')">${user.active === false ? "Aktivieren" : "Deaktivieren"}</button>
        ${(user.username || user.id) !== "admin" ? `<button class="danger" onclick="window.deleteUser('${user.username || user.id}')">Löschen</button>` : ""}
      </div>
    </div>
  `).join("");
}

window.editUser = function(username) {
  const user = users.find(u => (u.username || u.id) === username);
  if (!user) return;

  $("newUsername").value = user.username || user.id;
  $("newUsername").disabled = true;
  $("newPassword").value = user.password || "";
  $("newRole").value = user.role || "Mitarbeiter";
};

window.toggleUser = async function(username) {
  if (username === "admin") {
    alert("Admin kann nicht deaktiviert werden.");
    return;
  }

  const user = users.find(u => (u.username || u.id) === username);
  if (!user) return;

  await updateDoc(doc(db, "users", username), { active: user.active === false });
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

  const todaySalesArr = sales.filter(sale => new Date(sale.createdAtMs).toDateString() === today);
  const todayRevenueSum = todaySalesArr.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
  const totalRevenueSum = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);

  $("todayRevenue").textContent = money(todayRevenueSum);
  $("todaySales").textContent = todaySalesArr.length;
  $("totalRevenue").textContent = money(totalRevenueSum);
  $("totalSales").textContent = sales.length;

  $("salesList").innerHTML = sales.slice(0, 30).map(sale => `
    <div class="admin-item">
      <div>
        <b>${money(sale.total)}</b><br>
        Mitarbeiter: ${escapeHtml(sale.user || "-")}<br>
        Rabatt: ${Number(sale.discount || 0)}%<br>
        Artikel: ${(sale.items || []).map(item => `${item.quantity}x ${escapeHtml(item.name)}`).join(", ")}<br>
        Datum: ${new Date(sale.createdAtMs).toLocaleString("de-DE")}
      </div>
    </div>
  `).join("");
}

async function dailyClose() {
  const today = new Date().toDateString();
  const todaySalesArr = sales.filter(sale => new Date(sale.createdAtMs).toDateString() === today);
  const revenue = todaySalesArr.reduce((sum, sale) => sum + Number(sale.total || 0), 0);

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
  } catch (error) {
    console.error("Discord Webhook Fehler:", error);
  }
}

function updateClock() {
  const now = new Date();

  $("clockTime").textContent = now.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit"
  });

  $("clockDate").textContent = now.toLocaleDateString("de-DE");
}

function money(value) {
  return `${Number(value || 0).toLocaleString("de-DE")} €`;
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replaceAll("’", "'")
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

boot();
