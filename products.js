export const DEFAULT_PRODUCTS = {
  "🍷 BEVANDE": [["Vino della Casa",350,"🍷"],["Tè Freddo al Limone",195,"🥤"],["Cola",130,"🥃"],["Energy Drink",200,"⚡"],["Kaffee",190,"☕"],["Espresso",190,"☕"],["Limoncello",350,"🥤"]],
  "🍕 PIZZA": [["Pizza Margherita",330,"🍕"],["Pizza Salame Piccante",330,"🍕"],["Pizza Tonno e Cipolla",330,"🍕"],["Pizza Calzone",360,"🍕"]],
  "🥗 ANTIPASTI": [["Antipasto Italiano della Casa",110,"🥗"],["Bruschetta Classica",165,"🍅"]],
  "🍝 SECONDI PIATTI": [["Lasagna Napoletana della Casa",550,"🍝"],["Grigliata Mista di Pesce",410,"🦐"],["Parmigiana di Melanzane",450,"🍝"]],
  "🍝 PASTA": [["Spaghetti alla Carbonara",300,"🍝"],["Spaghetti alla Bolognese",300,"🍝"],["Penne all’Arrabbiata",320,"🍝"],["Frittatina di Pasta",260,"🍝"]],
  "🍮 DESSERT": [["Coppa Gelato della Casa",400,"🍨"],["Tiramisu",275,"🍰"],["Panna Cotta ai Lamponi Caldi",110,"🍮"],["Zeppole di San Giuseppe",320,"🍰"]],
  "⭐ MENÜ 1": [["Menü 1: Eistee + Pizza nach Wahl + Panna Cotta",540,"🍽️","menu1"]],
  "⭐ MENÜ 2": [["Menü 2: Cola + Pasta nach Wahl + Tiramisu",600,"🍽️","menu2"]],
  "⭐ MENÜ 3": [["Menü 3: Energy Drink + Grigliata Mista di Pesce + Coppa Gelato",860,"🍽️","menu3"]]
};

export const MENU_RECIPES = {
  menu1: { choices:{pizza:["Pizza Margherita","Pizza Salame Piccante","Pizza Tonno e Cipolla","Pizza Calzone"]}, fixed:["Tè Freddo al Limone","Panna Cotta ai Lamponi Caldi"] },
  menu2: { choices:{pasta:["Spaghetti alla Carbonara","Spaghetti alla Bolognese","Penne all’Arrabbiata","Frittatina di Pasta"]}, fixed:["Cola","Tiramisu"] },
  menu3: { fixed:["Energy Drink","Grigliata Mista di Pesce","Coppa Gelato della Casa"] }
};
