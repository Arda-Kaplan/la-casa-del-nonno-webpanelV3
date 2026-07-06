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

import {
  firebaseConfig,
  DISCORD_WEBHOOK_URL
} from "./firebase.js";


/* =========================================================
   FIREBASE
========================================================= */

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);


/* =========================================================
   VARIABLEN
========================================================= */

let currentUser = null;

let products = [];
let users = [];
let sales = [];

let cart = [];

let selectedQuantities = {};
let selectedMenuOptions = {};

let selectedCategory = "Alle";
let discount = 0;

let editingProductId = null;


/* =========================================================
   ROLLEN
========================================================= */

const rolePower = {
  "Geschäftsführer": 4,
  "Geschäftsleitung": 3,
  "Mitarbeiter": 2,
  "Praktikant": 1
};


/* =========================================================
   PRODUKTE
========================================================= */

const defaultProducts = [

  /* GETRÄNKE */

  {
    id: "espresso",
    name: "Espresso",
    category: "Getränke",
    price: 190,
    icon: "☕",
    stock: 100
  },

  {
    id: "kaffee",
    name: "Kaffee",
    category: "Getränke",
    price: 190,
    icon: "☕",
    stock: 100
  },

  {
    id: "hauswein_rot",
    name: "Hauswein rot",
    category: "Getränke",
    price: 350,
    icon: "🍷",
    stock: 100
  },

  {
    id: "limoncello",
    name: "Limoncello",
    category: "Getränke",
    price: 350,
    icon: "🍋",
    stock: 100
  },

  {
    id: "eistee_pfirsich",
    name: "Eistee Pfirsich",
    category: "Getränke",
    price: 195,
    icon: "🧊",
    stock: 100
  },

  {
    id: "cola",
    name: "Cola",
    category: "Getränke",
    price: 130,
    icon: "🥤",
    stock: 100
  },

  {
    id: "energy_drink",
    name: "Energy Drink",
    category: "Getränke",
    price: 200,
    icon: "⚡",
    stock: 100
  },


  /* PIZZEN */

  {
    id: "pizza_margherita",
    name: "Pizza Margherita",
    category: "Pizzen",
    price: 330,
    icon: "🍕",
    stock: 100
  },

  {
    id: "pizza_salami_scharf",
    name: "Pizza Salami scharf",
    category: "Pizzen",
    price: 330,
    icon: "🍕",
    stock: 100
  },

  {
    id: "pizza_tonno_e_cipolla",
    name: "Pizza Tonno e Cipolla",
    category: "Pizzen",
    price: 330,
    icon: "🍕",
    stock: 100
  },

  {
    id: "calzone",
    name: "Calzone",
    category: "Pizzen",
    price: 360,
    icon: "🥟",
    stock: 100
  },


  /* VORSPEISEN */

  {
    id: "gemischte_vorspeisenplatte",
    name: "Gemischte Vorspeisenplatte",
    category: "Vorspeisen",
    price: 110,
    icon: "🥗",
    stock: 100
  },

  {
    id: "bruschetta_mit_tomaten",
    name: "Bruschetta mit Tomaten",
    category: "Vorspeisen",
    price: 165,
    icon: "🥖",
    stock: 100
  },


  /* HAUPTGERICHTE */

  {
    id: "lasagne_al_forno",
    name: "Lasagne al Forno",
    category: "Hauptgerichte",
    price: 550,
    icon: "🍝",
    stock: 100
  },

  {
    id: "gemischter_fisch_vom_grill",
    name: "Gemischter Fisch vom Grill",
    category: "Hauptgerichte",
    price: 410,
    icon: "🐟",
    stock: 100
  },

  {
    id: "parmigiana_di_melanzane",
    name: "Parmigiana di Melanzane",
    category: "Hauptgerichte",
    price: 450,
    icon: "🍆",
    stock: 100
  },


  /* PASTA */

  {
    id: "spaghetti_carbonara",
    name: "Spaghetti Carbonara",
    category: "Pasta",
    price: 300,
    icon: "🍝",
    stock: 100
  },

  {
    id: "spaghetti_bolognese",
    name: "Spaghetti Bolognese",
    category: "Pasta",
    price: 300,
    icon: "🍝",
    stock: 100
  },

  {
    id: "penne_all_arrabbiata",
    name: "Penne all’Arrabbiata",
    category: "Pasta",
    price: 320,
    icon: "🍝",
    stock: 100
  },

  {
    id: "frittatina_di_pasta",
    name: "Frittatina di Pasta",
    category: "Pasta",
    price: 260,
    icon: "🍝",
    stock: 100
  },


  /* DESSERTS */

  {
    id: "hausgemachtes_tiramisu",
    name: "Hausgemachtes Tiramisu",
    category: "Desserts",
    price: 275,
    icon: "🍰",
    stock: 100
  },

  {
    id: "panna_cotta_mit_waldbeeren",
    name: "Panna Cotta mit Waldbeeren",
    category: "Desserts",
    price: 110,
    icon: "🍮",
    stock: 100
  },

  {
    id: "hausgemachtes_eis",
    name: "Hausgemachtes Eis",
    category: "Desserts",
    price: 400,
    icon: "🍨",
    stock: 100
  },

  {
    id: "zeppole_di_san_giuseppe",
    name: "Zeppole di San Giuseppe",
    category: "Desserts",
    price: 320,
    icon: "🥯",
    stock: 100
  },


  /* MENÜS */

  {
    id: "menu_1",
    name: "Menü 1 Italienischer Lunch",
    category: "Menüs",
    price: 540,
    icon: "⭐",
    stock: 100
  },

  {
    id: "menu_2",
    name: "Menü 2 Traditionelle Hausküche",
    category: "Menüs",
    price: 600,
    icon: "⭐",
    stock: 100
  },

  {
    id: "menu_3",
    name: "Menü 3 Fischgenuss",
    category: "Menüs",
    price: 860,
    icon: "⭐",
    stock: 100
  }

];


/* =========================================================
   MENÜ-KONFIGURATION
========================================================= */

const menuConfig = {

  menu_1: {

    type: "choice",

    label: "Pizza auswählen",

    fixedIngredients: [
      "Eistee Pfirsich",
      "Panna Cotta mit Waldbeeren"
    ],

    choices: [
      "Pizza Margherita",
      "Pizza Salami scharf",
      "Pizza Tonno e Cipolla",
      "Calzone"
    ]

  },


  menu_2: {

    type: "choice",

    label: "Pasta auswählen",

    fixedIngredients: [
      "Cola",
      "Hausgemachtes Tiramisu"
    ],

    choices: [
      "Spaghetti Carbonara",
      "Spaghetti Bolognese",
      "Penne all’Arrabbiata",
      "Frittatina di Pasta"
    ]

  },


  menu_3: {

    type: "fixed",

    fixedIngredients: [
      "Limoncello",
      "Gemischter Fisch vom Grill",
      "Zeppole di San Giuseppe"
    ]

  }

};


/* =========================================================
   KATEGORIE ICONS
========================================================= */

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


/* =========================================================
   ALTE PRODUKTE DEAKTIVIEREN
========================================================= */

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


/* =========================================================
   HELPER
========================================================= */

const $ = id => document.getElementById(id);


/* =========================================================
   EVENTS
========================================================= */

$("loginBtn")?.addEventListener("click", login);

$("logoutBtn")?.addEventListener("click", logout);

$("checkoutBtn")?.addEventListener("click", checkout);

$("clearCartBtn")?.addEventListener("click", clearCart);

$("inventoryQuickBtn")?.addEventListener("click", () => {
  switchPage("inventoryPage");
});


$("removeDiscountBtn")?.addEventListener("click", () => {

  discount = 0;

  renderDiscountButtons();
  renderCart();

});


$("addProductBtn")?.addEventListener("click", saveProduct);

$("addUserBtn")?.addEventListener("click", saveUser);

$("dailyCloseBtn")?.addEventListener("click", dailyClose);


document.querySelectorAll(".tab").forEach(button => {

  button.addEventListener("click", () => {

    switchPage(button.dataset.page);

  });

});


$("loginUsername")?.addEventListener("keydown", event => {

  if (event.key === "Enter") {
    login();
  }

});


$("loginPassword")?.addEventListener("keydown", event => {

  if (event.key === "Enter") {
    login();
  }

});


/* =========================================================
   START
========================================================= */

async function boot() {

  updateClock();

  setInterval(updateClock, 1000);

  await ensureDefaultAdmin();

  await syncMenuProducts();

  listenProducts();

  listenUsers();

  listenSales();

  renderDiscountButtons();

  renderCart();

}


/* =========================================================
   ADMIN ANLEGEN
========================================================= */

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


/* =========================================================
   PRODUKTE SYNCHRONISIEREN
========================================================= */

async function syncMenuProducts() {

  const snapshot = await getDocs(collection(db, "products"));


  const existingProducts = snapshot.docs.map(productDoc => ({

    id: productDoc.id,

    ...productDoc.data()

  }));


  for (const product of defaultProducts) {

    const stableRef = doc(db, "products", product.id);

    const stableSnap = await getDoc(stableRef);


    const sameNameProduct = existingProducts.find(existing =>

      normalize(existing.name) === normalize(product.name)

    );


    if (stableSnap.exists()) {

      const oldData = stableSnap.data();


      await setDoc(

        stableRef,

        {

          ...oldData,

          name: product.name,

          category: product.category,

          price: product.price,

          icon: product.icon,

          active: true,

          menuProduct: true,

          updatedAt: serverTimestamp()

        },

        { merge: true }

      );

    }

    else if (sameNameProduct) {

      await updateDoc(

        doc(db, "products", sameNameProduct.id),

        {

          name: product.name,

          category: product.category,

          price: product.price,

          icon: product.icon,

          active: true,

          menuProduct: true,

          updatedAt: serverTimestamp()

        }

      );

    }

    else {

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

    const isOldSeed = oldSeedNamesToDisable.some(name =>

      normalize(name) === normalize(oldProduct.name)

    );


    const stillExists = defaultProducts.some(product =>

      normalize(product.name) === normalize(oldProduct.name)

    );


    if (isOldSeed && !stillExists) {

      await updateDoc(

        doc(db, "products", oldProduct.id),

        {

          active: false,

          updatedAt: serverTimestamp()

        }

      );

    }

  }

}


/* =========================================================
   LOGIN
========================================================= */

async function login() {

  const username = $("loginUsername").value.trim();

  const password = $("loginPassword").value.trim();


  $("loginError").textContent = "";


  if (!username || !password) {

    $("loginError").textContent =
      "Bitte Benutzername und Passwort eingeben.";

    return;

  }


  const userRef = doc(db, "users", username);

  const snap = await getDoc(userRef);


  if (!snap.exists()) {

    $("loginError").textContent =
      "Benutzer nicht gefunden.";

    return;

  }


  const user = snap.data();


  if (user.active === false) {

    $("loginError").textContent =
      "Dieser Benutzer ist deaktiviert.";

    return;

  }


  if (String(user.password) !== String(password)) {

    $("loginError").textContent =
      "Passwort falsch.";

    return;

  }


  currentUser = {

    username: user.username || username,

    role: user.role || "Mitarbeiter",

    active: user.active !== false

  };


  $("loginScreen").classList.add("hidden");

  $("appScreen").classList.remove("hidden");


  $("currentUserLabel").textContent =
    `${currentUser.username} · ${currentUser.role}`;


  applyRoleVisibility();


  await discordLog(

    `✅ Login: **${currentUser.username}** (${currentUser.role})`

  );

}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {

  currentUser = null;

  cart = [];

  selectedQuantities = {};

  selectedMenuOptions = {};

  discount = 0;


  $("loginScreen").classList.remove("hidden");

  $("appScreen").classList.add("hidden");


  if ($("loginPassword")) {
    $("loginPassword").value = "";
  }


  renderCart();

  renderProducts();

}


/* =========================================================
   ROLLEN
========================================================= */

function applyRoleVisibility() {

  const power = rolePower[currentUser?.role] || 0;


  setElementDisplay(
    document.querySelector('[data-page="usersPage"]'),
    power >= 4
  );


  setElementDisplay(
    document.querySelector('[data-page="productsPage"]'),
    power >= 3
  );


  setElementDisplay(
    document.querySelector('[data-page="inventoryPage"]'),
    power >= 2
  );


  setElementDisplay(
    document.querySelector('[data-page="statsPage"]'),
    power >= 3
  );


  setElementDisplay(
    document.querySelector('[data-page="closingPage"]'),
    power >= 3
  );


  setElementDisplay(
    $("inventoryQuickBtn"),
    power >= 2
  );

}


function setElementDisplay(element, visible) {

  if (!element) return;

  element.style.display = visible ? "" : "none";

}


function hasPower(minimumPower) {

  return (rolePower[currentUser?.role] || 0) >= minimumPower;

}


/* =========================================================
   SEITENWECHSEL
========================================================= */

function switchPage(pageId) {

  document.querySelectorAll(".page").forEach(page => {

    page.classList.remove("active-page");

  });


  document.querySelectorAll(".tab").forEach(tab => {

    tab.classList.remove("active");

  });


  const page = $(pageId);

  if (page) {
    page.classList.add("active-page");
  }


  const tab =
    document.querySelector(`[data-page="${pageId}"]`);


  if (tab) {
    tab.classList.add("active");
  }

}


/* =========================================================
   FIRESTORE LISTENER
========================================================= */

function listenProducts() {

  onSnapshot(

    collection(db, "products"),

    snapshot => {

      products = snapshot.docs.map(productDoc => ({

        id: productDoc.id,

        ...productDoc.data()

      }));


      products.sort((a, b) => {

        const categoryCompare =
          String(a.category || "").localeCompare(
            String(b.category || ""),
            "de"
          );


        if (categoryCompare !== 0) {
          return categoryCompare;
        }


        return String(a.name || "").localeCompare(
          String(b.name || ""),
          "de"
        );

      });


      renderCategories();

      renderProducts();

      renderInventory();

      renderProductsAdmin();

    }

  );

}


function listenUsers() {

  onSnapshot(

    collection(db, "users"),

    snapshot => {

      users = snapshot.docs.map(userDoc => ({

        id: userDoc.id,

        ...userDoc.data()

      }));


      renderUsersAdmin();

    }

  );

}


function listenSales() {

  const salesQuery = query(

    collection(db, "sales"),

    orderBy("createdAtMs", "desc")

  );


  onSnapshot(

    salesQuery,

    snapshot => {

      sales = snapshot.docs.map(saleDoc => ({

        id: saleDoc.id,

        ...saleDoc.data()

      }));


      renderStats();

    }

  );

}


/* =========================================================
   KATEGORIEN
========================================================= */

function renderCategories() {

  const categories = [

    "Alle",

    ...new Set(

      products

        .filter(product => product.active !== false)

        .map(product => product.category || "Sonstiges")

    )

  ];


  $("categoryButtons").innerHTML = categories.map(category => `

    <button

      class="${selectedCategory === category ? "active-discount" : ""}"

      data-category="${escapeHtml(category)}"

    >

      ${categoryIcons[category] || "🍽️"}

      ${escapeHtml(category)}

    </button>

  `).join("");


  document
    .querySelectorAll("[data-category]")
    .forEach(button => {

      button.addEventListener("click", () => {

        selectedCategory = button.dataset.category;

        renderCategories();

        renderProducts();

      });

    });

}


/* =========================================================
   PRODUKTE RENDERN
========================================================= */

function renderProducts() {

  const visibleProducts = products.filter(product => {

    const active =
      product.active !== false;


    const categoryMatch =
      selectedCategory === "Alle" ||
      product.category === selectedCategory;


    return active && categoryMatch;

  });


  $("productGrid").innerHTML = visibleProducts.map(product => {

    const selectedQuantity =
      selectedQuantities[product.id] || 0;


    const menu = menuConfig[product.id];


    let menuHtml = "";


    if (menu?.type === "choice") {

      const selectedOption =
        selectedMenuOptions[product.id] || "";


      menuHtml = `

        <select
          class="menu-select"
          onchange="window.setMenuOption(
            '${product.id}',
            this.value
          )"
        >

          <option value="">
            ${escapeHtml(menu.label)}
          </option>

          ${menu.choices.map(choice => `

            <option
              value="${escapeHtml(choice)}"
              ${selectedOption === choice ? "selected" : ""}
            >
              ${escapeHtml(choice)}
            </option>

          `).join("")}

        </select>

      `;

    }


    if (menu?.type === "fixed") {

      menuHtml = `

        <div class="menu-description">

          🍋 Limoncello<br>

          🐟 Gemischter Fisch vom Grill<br>

          🥯 Zeppole di San Giuseppe

        </div>

      `;

    }


    return `

      <div class="product-card">

        <div class="icon">
          ${escapeHtml(product.icon || "🍽️")}
        </div>


        <h3>
          ${escapeHtml(product.name)}
        </h3>


        <div class="product-price">

          ${money(product.price)}

        </div>


        ${menuHtml}


        <div class="quick-row">

          <button
            onclick="window.changeSelectedQty(
              '${product.id}',
              -10
            )"
          >
            -10
          </button>


          <button
            onclick="window.changeSelectedQty(
              '${product.id}',
              -5
            )"
          >
            -5
          </button>


          <button
            class="quantity-display"
            disabled
          >

            ${selectedQuantity}

          </button>


          <button
            onclick="window.changeSelectedQty(
              '${product.id}',
              5
            )"
          >
            +5
          </button>


          <button
            onclick="window.changeSelectedQty(
              '${product.id}',
              10
            )"
          >
            +10
          </button>

        </div>


        <div class="qty-row">

          <button
            onclick="window.changeSelectedQty(
              '${product.id}',
              -1
            )"
          >
            −
          </button>


          <button
            onclick="window.changeSelectedQty(
              '${product.id}',
              1
            )"
          >
            +
          </button>

        </div>


        <button
          class="add-btn"
          onclick="window.addSelectedToCart(
            '${product.id}'
          )"
        >

          Hinzufügen

        </button>

      </div>

    `;

  }).join("");

}


/* =========================================================
   MENÜ AUSWAHL
========================================================= */

window.setMenuOption = function(productId, value) {

  selectedMenuOptions[productId] = value;

};


/* =========================================================
   MENGE AUSWÄHLEN
========================================================= */

window.changeSelectedQty = function(productId, amount) {

  const current =
    selectedQuantities[productId] || 0;


  selectedQuantities[productId] =
    Math.max(0, current + amount);


  renderProducts();

};


/* =========================================================
   IN WARENKORB
========================================================= */

window.addSelectedToCart = function(productId) {

  const product =
    products.find(item => item.id === productId);


  if (!product) return;


  const quantity =
    selectedQuantities[productId] || 0;


  if (quantity <= 0) {

    alert("Bitte erst eine Menge auswählen.");

    return;

  }


  const menu =
    menuConfig[productId];


  let menuChoice = null;


  if (menu?.type === "choice") {

    menuChoice =
      selectedMenuOptions[productId];


    if (!menuChoice) {

      alert(menu.label);

      return;

    }

  }


  /*
     Gleiche Menüs mit unterschiedlicher Auswahl
     bleiben getrennte Warenkorbpositionen.
  */

  const cartKey =
    menuChoice
      ? `${product.id}__${normalize(menuChoice)}`
      : product.id;


  const existingItem =
    cart.find(item => item.cartKey === cartKey);


  if (existingItem) {

    existingItem.quantity += quantity;

  }

  else {

    cart.push({

      cartKey,

      id: product.id,

      name: product.name,

      price: Number(product.price || 0),

      icon: product.icon || "🍽️",

      quantity,

      menuChoice

    });

  }


  selectedQuantities[productId] = 0;


  renderCart();

  renderProducts();

};


/* =========================================================
   WARENKORB
========================================================= */

function renderCart() {

  if (!$("cartItems")) return;


  if (cart.length === 0) {

    $("cartItems").innerHTML = `

      <div class="cart-item">

        <div></div>

        <div class="cart-name">
          Warenkorb leer
        </div>

        <div></div>

        <div></div>

      </div>

    `;

  }

  else {

    $("cartItems").innerHTML = cart.map(item => {

      const choiceHtml = item.menuChoice
        ? `
          <small>
            Auswahl: ${escapeHtml(item.menuChoice)}
          </small>
        `
        : "";


      return `

        <div class="cart-item">

          <div class="cart-icon">

            ${escapeHtml(item.icon || "🍽️")}

          </div>


          <div class="cart-name">

            ${item.quantity}x
            ${escapeHtml(item.name)}

            <br>

            ${choiceHtml}

          </div>


          <div class="cart-price">

            ${money(
              Number(item.price) *
              Number(item.quantity)
            )}

          </div>


          <button
            class="cart-remove"
            onclick="window.removeCartItem(
              '${item.cartKey}'
            )"
          >

            ×

          </button>

        </div>

      `;

    }).join("");

  }


  const subtotal = cart.reduce(

    (sum, item) =>

      sum +
      Number(item.price || 0) *
      Number(item.quantity || 0),

    0

  );


  const total = Math.round(

    subtotal *
    (1 - discount / 100)

  );


  $("subtotalLabel").textContent =
    money(subtotal);


  $("discountLabel").textContent =
    `${discount} %`;


  $("totalLabel").textContent =
    money(total);

}


/* =========================================================
   WARENKORB POSITION ENTFERNEN
========================================================= */

window.removeCartItem = function(cartKey) {

  cart = cart.filter(

    item => item.cartKey !== cartKey

  );


  renderCart();

};


/* =========================================================
   WARENKORB LEEREN
========================================================= */

function clearCart() {

  cart = [];

  selectedQuantities = {};

  selectedMenuOptions = {};

  discount = 0;


  renderDiscountButtons();

  renderCart();

  renderProducts();

}


/* =========================================================
   RABATT
========================================================= */

function renderDiscountButtons() {

  let html = "";


  for (let value = 5; value <= 100; value += 5) {

    html += `

      <button

        class="${
          discount === value
            ? "active-discount"
            : ""
        }"

        onclick="window.setDiscount(${value})"

      >

        ${value}%

      </button>

    `;

  }


  $("discountButtons").innerHTML = html;

}


window.setDiscount = function(value) {

  discount = value;

  renderDiscountButtons();

  renderCart();

};


/* =========================================================
   VERKAUF ABSCHLIESSEN
========================================================= */

async function checkout() {

  if (cart.length === 0) {

    alert("Warenkorb ist leer.");

    return;

  }


  const subtotal = cart.reduce(

    (sum, item) =>

      sum +
      Number(item.price || 0) *
      Number(item.quantity || 0),

    0

  );


  const total = Math.round(

    subtotal *
    (1 - discount / 100)

  );


  /*
     Lager prüfen
  */

  const stockCheck =
    calculateRequiredStock(cart);


  for (const required of stockCheck) {

    const product =
      products.find(item => item.id === required.productId);


    if (!product) continue;


    if (Number(product.stock || 0) < required.quantity) {

      alert(
        `Nicht genug Lagerbestand:\n\n` +
        `${product.name}\n` +
        `Benötigt: ${required.quantity}\n` +
        `Lager: ${Number(product.stock || 0)}`
      );

      return;

    }

  }


  /*
     Lager abziehen
  */

  await subtractCartStock(stockCheck);


  /*
     Verkauf speichern
  */

  const saleItems = cart.map(item => ({

    productId: item.id,

    name: item.name,

    price: item.price,

    quantity: item.quantity,

    menuChoice: item.menuChoice || null

  }));


  await addDoc(

    collection(db, "sales"),

    {

      items: saleItems,

      subtotal,

      discount,

      total,

      user: currentUser.username,

      role: currentUser.role,

      createdAt: serverTimestamp(),

      createdAtMs: Date.now()

    }

  );


  /*
     Discord
  */

  const discordItems = cart.map(item => {

    const choice =
      item.menuChoice
        ? ` (${item.menuChoice})`
        : "";


    return `${item.quantity}x ${item.name}${choice}`;

  }).join("\n");


  await discordLog(

    `🧾 **Verkauf abgeschlossen**\n\n` +

    `👤 Mitarbeiter: **${currentUser.username}**\n\n` +

    `${discordItems}\n\n` +

    `🏷️ Rabatt: ${discount}%\n` +

    `💰 Gesamt: **${money(total)}**`

  );


  clearCart();


  alert("Verkauf erfolgreich abgeschlossen.");

}


/* =========================================================
   BENÖTIGTEN LAGERBESTAND BERECHNEN
========================================================= */

function calculateRequiredStock(cartItems) {

  const requiredMap = {};


  function addRequirement(productId, quantity) {

    if (!requiredMap[productId]) {

      requiredMap[productId] = 0;

    }


    requiredMap[productId] += quantity;

  }


  for (const item of cartItems) {

    const menu =
      menuConfig[item.id];


    /*
       NORMALES PRODUKT
    */

    if (!menu) {

      addRequirement(
        item.id,
        item.quantity
      );

      continue;

    }


    /*
       FESTE MENÜ-ZUTATEN
    */

    for (const ingredientName of menu.fixedIngredients) {

      const ingredient =
        products.find(product =>
          normalize(product.name) ===
          normalize(ingredientName)
        );


      if (ingredient) {

        addRequirement(
          ingredient.id,
          item.quantity
        );

      }

    }


    /*
       MENÜ-AUSWAHL
    */

    if (menu.type === "choice" && item.menuChoice) {

      const selectedIngredient =
        products.find(product =>
          normalize(product.name) ===
          normalize(item.menuChoice)
        );


      if (selectedIngredient) {

        addRequirement(
          selectedIngredient.id,
          item.quantity
        );

      }

    }

  }


  return Object.entries(requiredMap).map(

    ([productId, quantity]) => ({

      productId,

      quantity

    })

  );

}


/* =========================================================
   LAGER ABZIEHEN
========================================================= */

async function subtractCartStock(stockRequirements) {

  for (const required of stockRequirements) {

    const product =
      products.find(item =>
        item.id === required.productId
      );


    if (!product) continue;


    const newStock =

      Number(product.stock || 0) -
      Number(required.quantity || 0);


    await updateDoc(

      doc(db, "products", product.id),

      {

        stock: Math.max(0, newStock),

        updatedAt: serverTimestamp()

      }

    );

  }

}


/* =========================================================
   INVENTUR
========================================================= */

function renderInventory() {

  if (!$("inventoryList")) return;


  const activeProducts = products.filter(

    product => product.active !== false

  );


  $("inventoryList").innerHTML = activeProducts.map(product => `

    <div class="admin-item inventory-item">

      <div>

        <b>

          ${escapeHtml(product.icon || "🍽️")}

          ${escapeHtml(product.name)}

        </b>

        <br>

        <small>

          ${escapeHtml(product.category || "-")}

        </small>

      </div>


      <div>

        <input

          type="number"

          min="0"

          step="1"

          value="${Number(product.stock || 0)}"

          class="inventory-input"

          data-product-id="${product.id}"

        >

      </div>

    </div>

  `).join("");


  document
    .querySelectorAll(".inventory-input")
    .forEach(input => {


      input.addEventListener("change", async () => {

        await saveInventoryInput(input);

      });


      input.addEventListener("keydown", async event => {

        if (event.key === "Enter") {

          event.preventDefault();

          await saveInventoryInput(input);

          input.blur();

        }

      });

    });

}


/* =========================================================
   INVENTUR SPEICHERN
========================================================= */

async function saveInventoryInput(input) {

  if (!hasPower(2)) {

    alert("Keine Berechtigung für Lageränderung.");

    return;

  }


  const productId =
    input.dataset.productId;


  const product =
    products.find(item => item.id === productId);


  if (!product) return;


  const oldStock =
    Number(product.stock || 0);


  let newStock =
    Number(input.value);


  if (!Number.isFinite(newStock)) {

    input.value = oldStock;

    return;

  }


  newStock =
    Math.max(0, Math.floor(newStock));


  input.value = newStock;


  if (oldStock === newStock) {
    return;
  }


  await updateDoc(

    doc(db, "products", productId),

    {

      stock: newStock,

      updatedAt: serverTimestamp(),

      lastStockChangeBy:
        currentUser?.username || "Unbekannt"

    }

  );


  await discordLog(

    `📦 **Lager geändert**\n` +

    `Produkt: **${product.name}**\n` +

    `Vorher: ${oldStock}\n` +

    `Neu: ${newStock}\n` +

    `Mitarbeiter: ${currentUser?.username || "Unbekannt"}`

  );

}


/* =========================================================
   PRODUKT SPEICHERN
========================================================= */

async function saveProduct() {

  if (!hasPower(3)) {

    alert("Keine Berechtigung.");

    return;

  }


  const name =
    $("productName").value.trim();


  const category =
    $("productCategory").value.trim();


  const price =
    Number($("productPrice").value);


  const icon =
    $("productIcon").value.trim();


  const stock =
    Number($("productStock").value);


  if (!name || !category || !price) {

    alert(
      "Bitte Produktname, Kategorie und Preis eingeben."
    );

    return;

  }


  const data = {

    name,

    category,

    price,

    icon: icon || "🍽️",

    stock:
      Number.isFinite(stock)
        ? Math.max(0, stock)
        : 0,

    active: true,

    updatedAt: serverTimestamp()

  };


  if (editingProductId) {

    await updateDoc(

      doc(db, "products", editingProductId),

      data

    );


    await discordLog(

      `✏️ Produkt bearbeitet: **${name}**`

    );

  }

  else {

    await addDoc(

      collection(db, "products"),

      {

        ...data,

        createdAt: serverTimestamp()

      }

    );


    await discordLog(

      `➕ Produkt hinzugefügt: **${name}**`

    );

  }


  editingProductId = null;


  $("addProductBtn").textContent =
    "Produkt speichern";


  clearProductForm();

}


/* =========================================================
   PRODUKT ADMIN LISTE
========================================================= */

function renderProductsAdmin() {

  if (!$("productsAdminList")) return;


  $("productsAdminList").innerHTML = products.map(product => `

    <div class="admin-item">

      <div>

        <b>

          ${escapeHtml(product.icon || "🍽️")}

          ${escapeHtml(product.name)}

        </b>

        <br>

        Kategorie:
        ${escapeHtml(product.category || "-")}

        <br>

        Preis:
        ${money(product.price)}

        <br>

        Lager:
        ${Number(product.stock || 0)}

        <br>

        Status:
        ${
          product.active !== false
            ? "Aktiv"
            : "Inaktiv"
        }

      </div>


      <div class="admin-buttons">

        <button
          onclick="window.editProduct('${product.id}')"
        >
          Bearbeiten
        </button>


        <button
          onclick="window.toggleProduct('${product.id}')"
        >

          ${
            product.active !== false
              ? "Deaktivieren"
              : "Aktivieren"
          }

        </button>


        <button
          class="danger"
          onclick="window.deleteProduct('${product.id}')"
        >
          Löschen
        </button>

      </div>

    </div>

  `).join("");

}


/* =========================================================
   PRODUKT BEARBEITEN
========================================================= */

window.editProduct = function(productId) {

  const product =
    products.find(item => item.id === productId);


  if (!product) return;


  editingProductId = productId;


  $("productName").value =
    product.name || "";


  $("productCategory").value =
    product.category || "";


  $("productPrice").value =
    product.price || "";


  $("productIcon").value =
    product.icon || "";


  $("productStock").value =
    product.stock || 0;


  $("addProductBtn").textContent =
    "Produkt ändern";

};


/* =========================================================
   PRODUKT AKTIV / INAKTIV
========================================================= */

window.toggleProduct = async function(productId) {

  const product =
    products.find(item => item.id === productId);


  if (!product) return;


  await updateDoc(

    doc(db, "products", productId),

    {

      active:
        product.active === false

    }

  );

};


/* =========================================================
   PRODUKT LÖSCHEN
========================================================= */

window.deleteProduct = async function(productId) {

  if (!confirm("Produkt wirklich löschen?")) {
    return;
  }


  await deleteDoc(

    doc(db, "products", productId)

  );

};


/* =========================================================
   PRODUKT FORM LEEREN
========================================================= */

function clearProductForm() {

  $("productName").value = "";

  $("productCategory").value = "";

  $("productPrice").value = "";

  $("productIcon").value = "";

  $("productStock").value = "";

}


/* =========================================================
   MITARBEITER SPEICHERN
========================================================= */

async function saveUser() {

  if (!hasPower(4)) {

    alert(
      "Nur Geschäftsführer darf Mitarbeiter verwalten."
    );

    return;

  }


  const username =
    $("newUsername").value.trim();


  const password =
    $("newPassword").value.trim();


  const role =
    $("newRole").value;


  if (!username || !password || !role) {

    alert(
      "Bitte Benutzername, Passwort und Rolle eingeben."
    );

    return;

  }


  await setDoc(

    doc(db, "users", username),

    {

      username,

      password,

      role,

      active: true,

      updatedAt: serverTimestamp()

    },

    { merge: true }

  );


  await discordLog(

    `👤 Mitarbeiter gespeichert: **${username}** (${role})`

  );


  clearUserForm();

}


/* =========================================================
   MITARBEITER LISTE
========================================================= */

function renderUsersAdmin() {

  if (!$("usersAdminList")) return;


  $("usersAdminList").innerHTML = users.map(user => {

    const username =
      user.username || user.id;


    return `

      <div class="admin-item">

        <div>

          <b>
            ${escapeHtml(username)}
          </b>

          <br>

          Rolle:
          ${escapeHtml(user.role || "Mitarbeiter")}

          <br>

          Status:
          ${
            user.active === false
              ? "Inaktiv"
              : "Aktiv"
          }

        </div>


        <div class="admin-buttons">

          <button
            onclick="window.editUser('${username}')"
          >
            Bearbeiten
          </button>


          <button
            onclick="window.toggleUser('${username}')"
          >

            ${
              user.active === false
                ? "Aktivieren"
                : "Deaktivieren"
            }

          </button>


          ${
            username !== "admin"
              ? `
                <button
                  class="danger"
                  onclick="window.deleteUser('${username}')"
                >
                  Löschen
                </button>
              `
              : ""
          }

        </div>

      </div>

    `;

  }).join("");

}


/* =========================================================
   MITARBEITER BEARBEITEN
========================================================= */

window.editUser = function(username) {

  const user = users.find(item =>

    (item.username || item.id) === username

  );


  if (!user) return;


  $("newUsername").value =
    user.username || user.id;


  $("newUsername").disabled = true;


  $("newPassword").value =
    user.password || "";


  $("newRole").value =
    user.role || "Mitarbeiter";

};


/* =========================================================
   MITARBEITER AKTIV / INAKTIV
========================================================= */

window.toggleUser = async function(username) {

  if (username === "admin") {

    alert("Admin kann nicht deaktiviert werden.");

    return;

  }


  const user = users.find(item =>

    (item.username || item.id) === username

  );


  if (!user) return;


  await updateDoc(

    doc(db, "users", username),

    {

      active:
        user.active === false

    }

  );

};


/* =========================================================
   MITARBEITER LÖSCHEN
========================================================= */

window.deleteUser = async function(username) {

  if (username === "admin") return;


  if (!confirm("Mitarbeiter wirklich löschen?")) {
    return;
  }


  await deleteDoc(

    doc(db, "users", username)

  );

};


/* =========================================================
   MITARBEITER FORM LEEREN
========================================================= */

function clearUserForm() {

  $("newUsername").value = "";

  $("newUsername").disabled = false;

  $("newPassword").value = "";

  $("newRole").value = "Mitarbeiter";

}


/* =========================================================
   STATISTIK
========================================================= */

function renderStats() {

  if (!$("todayRevenue")) return;


  const today =
    new Date().toDateString();


  const todaySalesArray = sales.filter(sale =>

    new Date(sale.createdAtMs).toDateString() === today

  );


  const todayRevenueSum =
    todaySalesArray.reduce(

      (sum, sale) =>
        sum + Number(sale.total || 0),

      0

    );


  const totalRevenueSum =
    sales.reduce(

      (sum, sale) =>
        sum + Number(sale.total || 0),

      0

    );


  $("todayRevenue").textContent =
    money(todayRevenueSum);


  $("todaySales").textContent =
    todaySalesArray.length;


  $("totalRevenue").textContent =
    money(totalRevenueSum);


  $("totalSales").textContent =
    sales.length;


  $("salesList").innerHTML = sales
    .slice(0, 30)
    .map(sale => {


      const itemText =
        (sale.items || [])
          .map(item => {

            const choice =
              item.menuChoice
                ? ` (${item.menuChoice})`
                : "";


            return `${item.quantity}x ${item.name}${choice}`;

          })
          .join(", ");


      return `

        <div class="admin-item">

          <div>

            <b>
              ${money(sale.total)}
            </b>

            <br>

            Mitarbeiter:
            ${escapeHtml(sale.user || "-")}

            <br>

            Rabatt:
            ${Number(sale.discount || 0)}%

            <br>

            Artikel:
            ${escapeHtml(itemText)}

            <br>

            Datum:
            ${
              new Date(
                sale.createdAtMs
              ).toLocaleString("de-DE")
            }

          </div>

        </div>

      `;

    })
    .join("");

}


/* =========================================================
   TAGESABSCHLUSS
========================================================= */

async function dailyClose() {

  const today =
    new Date().toDateString();


  const todaySalesArray = sales.filter(sale =>

    new Date(sale.createdAtMs).toDateString() === today

  );


  const revenue =
    todaySalesArray.reduce(

      (sum, sale) =>
        sum + Number(sale.total || 0),

      0

    );


  const text =

    `Tagesabschluss\n\n` +

    `Datum: ${
      new Date().toLocaleDateString("de-DE")
    }\n` +

    `Verkäufe: ${
      todaySalesArray.length
    }\n` +

    `Umsatz: ${
      money(revenue)
    }\n` +

    `Erstellt von: ${
      currentUser.username
    }`;


  $("dailyCloseResult").textContent = text;


  await addDoc(

    collection(db, "dailyClosings"),

    {

      date:
        new Date().toLocaleDateString("de-DE"),

      salesCount:
        todaySalesArray.length,

      revenue,

      user:
        currentUser.username,

      createdAt:
        serverTimestamp(),

      createdAtMs:
        Date.now()

    }

  );


  await discordLog(

    `📊 **Tagesabschluss**\n${text}`

  );

}


/* =========================================================
   DISCORD
========================================================= */

async function discordLog(message) {

  if (
    !DISCORD_WEBHOOK_URL ||
    DISCORD_WEBHOOK_URL.includes("DEIN_NEUER")
  ) {

    return;

  }


  try {

    await fetch(

      DISCORD_WEBHOOK_URL,

      {

        method: "POST",

        headers: {

          "Content-Type": "application/json"

        },

        body: JSON.stringify({

          username:
            "La Casa del Nonno Kassensystem",

          content:
            message

        })

      }

    );

  }

  catch (error) {

    console.error(
      "Discord Webhook Fehler:",
      error
    );

  }

}


/* =========================================================
   UHR
========================================================= */

function updateClock() {

  const now = new Date();


  if ($("clockTime")) {

    $("clockTime").textContent =
      now.toLocaleTimeString(
        "de-DE",
        {
          hour: "2-digit",
          minute: "2-digit"
        }
      );

  }


  if ($("clockDate")) {

    $("clockDate").textContent =
      now.toLocaleDateString("de-DE");

  }

}


/* =========================================================
   GELD FORMATIEREN
========================================================= */

function money(value) {

  return `${Number(value || 0).toLocaleString("de-DE")} €`;

}


/* =========================================================
   NORMALISIEREN
========================================================= */

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


/* =========================================================
   HTML SICHER AUSGEBEN
========================================================= */

function escapeHtml(value) {

  return String(value ?? "")

    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll('"', "&quot;")

    .replaceAll("'", "&#039;");

}


/* =========================================================
   START
========================================================= */

boot();
