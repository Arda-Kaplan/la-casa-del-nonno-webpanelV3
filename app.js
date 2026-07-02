import { db, doc, getDoc, setDoc, onSnapshot, runTransaction, collection, addDoc, serverTimestamp, getDocs } from "./firebase.js";
import { DEFAULT_PRODUCTS, MENU_RECIPES } from "./products.js";
import { productKey, euro, can } from "./utils.js";
import { login, logout, restoreUser, currentUser } from "./auth.js";

const webhookURL = "";

const inventoryRef = doc(db, "inventory", "stock");

let products = DEFAULT_PRODUCTS;
let inventory = {};
let activeCategory = "";
let quantities = {};
let orders = [];
let discount = 0;
let firebaseLoaded = false;

const $ = id => document.getElementById(id);

function showApp(user) {
  $("loginScreen").classList.add("hidden");
  $("appScreen").classList.remove("hidden");

  $("currentUserName").innerText = user.username;
  $("currentUserRole").innerText = user.role;

  $("inventoryBtn").style.display = can(user.role, "inventory") ? "" : "none";
  $("adminBtn").style.display = "none";
  $("statsBtn").style.display = can(user.role, "stats") ? "" : "none";

  activeCategory = Object.keys(products)[0];

  renderDiscounts();
  renderOrder();
  initFirebaseData();
}

function showLogin() {
  $("loginScreen").classList.remove("hidden");
  $("appScreen").classList.add("hidden");
}

async function handleLogin() {
  try {
    $("loginError").innerText = "";
    const user = await login($("loginUsername").value, $("loginPassword").value);
    showApp(user);
  } catch (e) {
    $("loginError").innerText = e.message;
  }
}

function getDefaultInventory() {
  const d = {};

  Object.values(products).flat().forEach(item => {
    if (item.menu) return;
    d[productKey(item.name)] = 100;
  });

  return d;
}

async function initFirebaseData() {
  try {
    const inv = await getDoc(inventoryRef);

    if (!inv.exists()) {
      inventory = getDefaultInventory();
      await setDoc(inventoryRef, inventory);
    }

    onSnapshot(inventoryRef, s => {
      inventory = s.exists() ? s.data() : getDefaultInventory();
      firebaseLoaded = true;

      $("loadingText").style.display = "none";

      renderTabs();
      renderProducts();
      renderInventoryIfOpen();
    });
  } catch (e) {
    console.error(e);
    $("loadingText").innerText = "Firebase Fehler: " + e.message;
  }
}

function renderTabs() {
  const t = $("categoryTabs");
  t.innerHTML = "";

  Object.keys(products).forEach(c => {
    t.innerHTML += `<button class="tab ${c === activeCategory ? "active" : ""}" onclick="setCategory('${c}')">${c}</button>`;
  });
}

function setCategory(c) {
  activeCategory = c;
  renderTabs();
  renderProducts();
}

function renderProducts() {
  const grid = $("productGrid");
  grid.innerHTML = "";

  (products[activeCategory] || []).forEach((item, index) => {
    const id = productKey(activeCategory) + "_" + index;
    const isMenu = item.menu;

    if (quantities[id] === undefined) quantities[id] = 0;

    let stockHtml = "";
    let choiceHtml = "";

    if (isMenu) {
      const r = MENU_RECIPES[item.menu];

      stockHtml = `<div class="stock">Lager wird von Einzelprodukten abgezogen</div>`;

      if (r?.choices?.pizza) {
        choiceHtml += `<select class="choice" id="choice-${id}-pizza">
          ${r.choices.pizza.map(p => `<option value="${p}">${p}</option>`).join("")}
        </select>`;
      }

      if (r?.choices?.pasta) {
        choiceHtml += `<select class="choice" id="choice-${id}-pasta">
          ${r.choices.pasta.map(p => `<option value="${p}">${p}</option>`).join("")}
        </select>`;
      }
    } else {
      const key = productKey(item.name);
      const stock = inventory[key] ?? 0;
      stockHtml = `<div class="stock ${stock <= 10 ? "low" : ""}">Lager: ${stock}</div>`;
    }

    grid.innerHTML += `
      <div class="product-card">
        <div class="icon">${item.icon}</div>
        <div class="pname">${item.name}</div>
        <div class="price">${euro(item.price)}</div>

        ${stockHtml}
        ${choiceHtml}

        <div class="qty-row">
          <button onclick="changeQty('${id}', -10)">-10</button>
          <button onclick="changeQty('${id}', -5)">-5</button>
          <div class="qty" id="qty-${id}">${quantities[id]}</div>
          <button onclick="changeQty('${id}', 5)">+5</button>
          <button onclick="changeQty('${id}', 10)">+10</button>
        </div>

        <div class="plusminus">
          <button onclick="changeQty('${id}', -1)">−</button>
          <button onclick="changeQty('${id}', 1)">+</button>
        </div>

        <button class="add" onclick="addItem('${item.name}', ${item.price}, '${id}', '${item.menu || ""}', '${item.icon}')">
          HINZUFÜGEN
        </button>
      </div>
    `;
  });
}

function buildRecipe(menuCode, id) {
  if (!menuCode) return null;

  const r = MENU_RECIPES[menuCode];
  const ingredients = [...(r.fixed || [])];
  let choiceText = "";

  if (r.choices?.pizza) {
    const p = $(`choice-${id}-pizza`).value;
    ingredients.push(p);
    choiceText += ` | Pizza: ${p}`;
  }

  if (r.choices?.pasta) {
    const p = $(`choice-${id}-pasta`).value;
    ingredients.push(p);
    choiceText += ` | Pasta: ${p}`;
  }

  return { ingredients, choiceText };
}

function changeQty(id, a) {
  quantities[id] = Math.max(0, (quantities[id] || 0) + a);

  const el = $("qty-" + id);
  if (el) el.innerText = quantities[id];
}

function addItem(name, price, id, menuCode, icon) {
  const qty = quantities[id] || 0;

  if (qty <= 0) {
    alert("Bitte Menge auswählen.");
    return;
  }

  const r = buildRecipe(menuCode, id);

  orders.push({
    id: Date.now() + Math.random(),
    name: name + (r ? r.choiceText : ""),
    price,
    qty,
    icon,
    ingredients: r ? r.ingredients : [name]
  });

  quantities[id] = 0;

  const el = $("qty-" + id);
  if (el) el.innerText = 0;

  renderOrder();
}

function removeItem(id) {
  orders = orders.filter(o => o.id !== id);
  renderOrder();
}

function clearCart() {
  if (confirm("Warenkorb wirklich leeren?")) {
    orders = [];
    discount = 0;
    renderOrder();
    renderDiscounts();
  }
}

function setDiscount(v) {
  if (!can(currentUser.role, "discount")) {
    alert("Praktikanten dürfen keinen Rabatt geben.");
    return;
  }

  discount = v;
  renderOrder();
  renderDiscounts();
}

function removeDiscount() {
  discount = 0;
  renderOrder();
  renderDiscounts();
}

function renderDiscounts() {
  const b = $("discountButtons");
  b.innerHTML = "";

  const ok = can(currentUser.role, "discount");

  for (let i = 5; i <= 100; i += 5) {
    b.innerHTML += `<button class="${discount === i ? "active" : ""}" ${ok ? "" : "disabled"} onclick="setDiscount(${i})">${i}%</button>`;
  }

  b.innerHTML += `<button class="remove-discount" ${ok ? "" : "disabled"} onclick="removeDiscount()">Rabatt entfernen</button>`;
}

function getSubtotal() {
  return orders.reduce((s, o) => s + o.price * o.qty, 0);
}

function getTotal() {
  return Math.round(getSubtotal() - getSubtotal() * discount / 100);
}

function renderOrder() {
  const list = $("cartList");
  list.innerHTML = "";

  if (orders.length === 0) {
    list.innerHTML = `<div style="padding:18px;color:#b9a987;font-size:18px;">Keine Artikel im Warenkorb</div>`;
  }

  orders.forEach(i => {
    list.innerHTML += `
      <div class="cart-row">
        <div class="cart-icon">${i.icon || "🍽️"}</div>
        <div>${i.qty}x ${i.name}</div>
        <div class="cart-price">${euro(i.price * i.qty)}</div>
        <button class="remove" onclick="removeItem(${i.id})">×</button>
      </div>
    `;
  });

  $("totalValue").innerText = euro(getTotal());
}

function getNeededIngredients() {
  const n = {};

  orders.forEach(i => {
    i.ingredients.forEach(x => {
      const k = productKey(x);
      n[k] = (n[k] || 0) + i.qty;
    });
  });

  return n;
}

function checkInventoryLocal() {
  const n = getNeededIngredients();

  for (const k in n) {
    if ((inventory[k] ?? 0) < n[k]) {
      alert("Nicht genug Lagerbestand für: " + k.replaceAll("_", " "));
      return false;
    }
  }

  return true;
}

async function reduceInventory() {
  const n = getNeededIngredients();

  await runTransaction(db, async tx => {
    const snap = await tx.get(inventoryRef);

    if (!snap.exists()) throw new Error("Inventur-Dokument fehlt.");

    const cur = snap.data();
    const upd = { ...cur };

    for (const k in n) {
      const stock = cur[k] ?? 0;

      if (stock < n[k]) throw new Error("Nicht genug Lagerbestand für: " + k);

      upd[k] = stock - n[k];
    }

    tx.set(inventoryRef, upd);
  });
}

async function finishOrder() {
  if (!firebaseLoaded) {
    alert("Firebase lädt noch.");
    return;
  }

  if (orders.length === 0) {
    alert("Keine Bestellung vorhanden.");
    return;
  }

  if (!checkInventoryLocal()) return;

  const sale = {
    employee: currentUser.username,
    role: currentUser.role,
    discount,
    subtotal: getSubtotal(),
    total: getTotal(),
    items: orders.map(o => ({
      name: o.name,
      qty: o.qty,
      price: o.price,
      total: o.price * o.qty,
      ingredients: o.ingredients
    })),
    date: new Date().toLocaleString("de-DE")
  };

  try {
    await reduceInventory();
    await addDoc(collection(db, "sales"), { ...sale, createdAt: serverTimestamp() });
    await sendDiscordLog(sale);

    alert("Bestellung abgeschlossen.");

    orders = [];
    discount = 0;
    renderOrder();
    renderDiscounts();
  } catch (e) {
    alert(e.message || "Fehler beim Abschließen.");
  }
}

async function sendDiscordLog(sale) {
  if (!webhookURL || webhookURL === "DEIN_DISCORD_WEBHOOK_HIER_EINFÜGEN") return;

  const text = sale.items.map(i => `${i.qty}x ${i.name} - ${euro(i.total)}`).join("\n");

  await fetch(webhookURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [{
        title: "🍷 Neue Bestellung - La Casa del Nonno",
        color: 11141120,
        description: text,
        fields: [
          { name: "Mitarbeiter", value: sale.employee, inline: true },
          { name: "Rolle", value: sale.role, inline: true },
          { name: "Rabatt", value: sale.discount + "%", inline: true },
          { name: "Gesamt", value: euro(sale.total), inline: true }
        ],
        timestamp: new Date()
      }]
    })
  });
}

function openInventory() {
  if (!can(currentUser.role, "inventory")) {
    alert("Keine Berechtigung für Inventur.");
    return;
  }

  renderInventory();
  $("inventoryModal").classList.remove("hidden");
}

function closeModal(id) {
  $(id).classList.add("hidden");
}

function renderInventoryIfOpen() {
  if (!$("inventoryModal").classList.contains("hidden")) renderInventory();
}

function renderInventory() {
  const list = $("inventoryList");
  list.innerHTML = "";

  Object.values(products).flat().forEach(item => {
    if (item.menu) return;

    const k = productKey(item.name);

    list.innerHTML += `
      <div class="inventory-row">
        <div>${item.icon} ${item.name}</div>
        <input type="number" min="0" value="${inventory[k] ?? 0}" id="inv-${k}">
      </div>
    `;
  });
}

async function saveInventory() {
  if (!can(currentUser.role, "inventory")) return;

  const ni = { ...inventory };

  Object.values(products).flat().forEach(item => {
    if (item.menu) return;

    const k = productKey(item.name);
    const v = parseInt($("inv-" + k).value);

    ni[k] = isNaN(v) ? 0 : v;
  });

  await setDoc(inventoryRef, ni);

  alert("Inventur gespeichert.");
  closeModal("inventoryModal");
}

async function openStats() {
  if (!can(currentUser.role, "stats")) return;

  const snap = await getDocs(collection(db, "sales"));
  const sales = [];

  snap.forEach(d => sales.push(d.data()));

  const total = sales.reduce((s, x) => s + (x.total || 0), 0);
  const count = sales.length;
  const byUser = {};

  sales.forEach(s => {
    byUser[s.employee] = (byUser[s.employee] || 0) + (s.total || 0);
  });

  let html = `
    <div class="stat-line"><b>Anzahl Bestellungen:</b> ${count}</div>
    <div class="stat-line"><b>Gesamtumsatz:</b> ${euro(total)}</div>
    <h3>Umsatz pro Mitarbeiter</h3>
  `;

  Object.entries(byUser)
    .sort((a, b) => b[1] - a[1])
    .forEach(([u, v]) => {
      html += `<div class="stat-line">${u}: ${euro(v)}</div>`;
    });

  $("statsContent").innerHTML = html;
  $("statsModal").classList.remove("hidden");
}

function updateClock() {
  const n = new Date();

  $("clockTime").innerText = n.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit"
  });

  $("clockDate").innerText = n.toLocaleDateString("de-DE");
}

$("loginBtn").addEventListener("click", handleLogin);

$("loginPassword").addEventListener("keydown", e => {
  if (e.key === "Enter") handleLogin();
});

$("logoutBtn").addEventListener("click", () => {
  logout();
  location.reload();
});

$("clearCartBtn").addEventListener("click", clearCart);
$("checkoutBtn").addEventListener("click", finishOrder);
$("inventoryBtn").addEventListener("click", openInventory);
$("saveInventoryBtn").addEventListener("click", saveInventory);
$("statsBtn").addEventListener("click", openStats);

if ($("adminBtn")) {
  $("adminBtn").style.display = "none";
}

document.querySelectorAll("[data-close]").forEach(btn => {
  btn.addEventListener("click", () => closeModal(btn.dataset.close));
});

window.setCategory = setCategory;
window.changeQty = changeQty;
window.addItem = addItem;
window.removeItem = removeItem;
window.setDiscount = setDiscount;
window.removeDiscount = removeDiscount;

updateClock();
setInterval(updateClock, 1000);

const user = restoreUser();

if (user) showApp(user);
else showLogin();
