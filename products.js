export const DEFAULT_PRODUCTS = {
  "🍷 BEVANDE": [
    { name: "Vino della Casa", price: 350, icon: "🍷" },
    { name: "Tè Freddo al Limone", price: 195, icon: "🥤" },
    { name: "Cola", price: 130, icon: "🥤" },
    { name: "Energy Drink", price: 200, icon: "⚡" },
    { name: "Kaffee", price: 190, icon: "☕" },
    { name: "Espresso", price: 190, icon: "☕" },
    { name: "Limoncello", price: 350, icon: "🍋" }
  ],

  "🍕 PIZZA": [
    { name: "Pizza Margherita", price: 330, icon: "🍕" },
    { name: "Pizza Salame Piccante", price: 330, icon: "🍕" },
    { name: "Pizza Tonno e Cipolla", price: 330, icon: "🍕" },
    { name: "Pizza Calzone", price: 360, icon: "🍕" }
  ],

  "🥗 ANTIPASTI": [
    { name: "Antipasto Italiano della Casa", price: 110, icon: "🥗" },
    { name: "Bruschetta Classica", price: 165, icon: "🍅" }
  ],

  "🍝 SECONDI PIATTI": [
    { name: "Lasagna Napoletana della Casa", price: 550, icon: "🍝" },
    { name: "Grigliata Mista di Pesce", price: 410, icon: "🐟" },
    { name: "Parmigiana di Melanzane", price: 450, icon: "🍆" }
  ],

  "🍝 PASTA": [
    { name: "Spaghetti alla Carbonara", price: 300, icon: "🍝" },
    { name: "Spaghetti alla Bolognese", price: 300, icon: "🍝" },
    { name: "Penne all’Arrabbiata", price: 320, icon: "🍝" },
    { name: "Frittatina di Pasta", price: 260, icon: "🍝" }
  ],

  "🍰 DESSERT": [
    { name: "Coppa Gelato della Casa", price: 400, icon: "🍨" },
    { name: "Tiramisu", price: 275, icon: "🍰" },
    { name: "Panna Cotta ai Lamponi Caldi", price: 110, icon: "🍮" },
    { name: "Zeppole di San Giuseppe", price: 320, icon: "🥐" }
  ],

  "⭐ MENÜ 1": [
    { name: "Menü 1: Eistee + Pizza nach Wahl + Panna Cotta", price: 540, icon: "🍽️", menu: "menu1" }
  ],

  "⭐ MENÜ 2": [
    { name: "Menü 2: Cola + Pasta nach Wahl + Tiramisu", price: 600, icon: "🍽️", menu: "menu2" }
  ],

  "⭐ MENÜ 3": [
    { name: "Menü 3: Energy Drink + Grigliata Mista di Pesce + Coppa Gelato", price: 860, icon: "🍽️", menu: "menu3" }
  ]
};

export const MENU_RECIPES = {
  menu1: {
    choices: {
      pizza: [
        "Pizza Margherita",
        "Pizza Salame Piccante",
        "Pizza Tonno e Cipolla",
        "Pizza Calzone"
      ]
    },
    fixed: [
      "Tè Freddo al Limone",
      "Panna Cotta ai Lamponi Caldi"
    ]
  },

  menu2: {
    choices: {
      pasta: [
        "Spaghetti alla Carbonara",
        "Spaghetti alla Bolognese",
        "Penne all’Arrabbiata",
        "Frittatina di Pasta"
      ]
    },
    fixed: [
      "Cola",
      "Tiramisu"
    ]
  },

  menu3: {
    fixed: [
      "Energy Drink",
      "Grigliata Mista di Pesce",
      "Coppa Gelato della Casa"
    ]
  }
};
