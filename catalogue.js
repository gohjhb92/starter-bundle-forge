// Single source of truth for the shared, structured catalogue data.
// Imported by BOTH the browser app (src/App.jsx) and the serverless function
// (api/bundle.js), so keep it plain ESM with no browser- or node-specific APIs.
//
// NOTE: the AI's full price list lives as prose in the SYSTEM_PROMPT inside
// api/bundle.js (that string is the model's catalogue-of-record). The demo
// fallback's prices are kept beside it there. What's centralised HERE is the
// data both sides genuinely share: the game/faction lists that drive the
// dropdowns and the demo, plus the store's reservation contact details.

export const GAMES = [
  "Warhammer 40,000",
  "Age of Sigmar",
  "The Old World",
  "Magic: The Gathering",
  "Pokémon TCG",
  "Not sure yet",
];

// Game -> selectable factions (feeds the quick-pick dropdown and demo replies).
export const FACTIONS = {
  "Warhammer 40,000": [
    "Space Marines", "Blood Angels", "Dark Angels", "Space Wolves", "Grey Knights",
    "Adeptus Custodes", "Adepta Sororitas", "Astra Militarum", "Adeptus Mechanicus", "Imperial Knights",
    "Chaos Space Marines", "Death Guard", "Thousand Sons", "World Eaters", "Chaos Daemons", "Chaos Knights",
    "Orks", "Necrons", "Tyranids", "Genestealer Cults", "Aeldari", "Drukhari", "T'au Empire", "Leagues of Votann",
  ],
  "Age of Sigmar": [
    "Stormcast Eternals", "Cities of Sigmar", "Daughters of Khaine", "Fyreslayers", "Idoneth Deepkin",
    "Kharadron Overlords", "Lumineth Realm-lords", "Seraphon", "Sylvaneth",
    "Blades of Khorne", "Disciples of Tzeentch", "Hedonites of Slaanesh", "Maggotkin of Nurgle", "Skaven", "Slaves to Darkness",
    "Flesh-eater Courts", "Nighthaunt", "Ossiarch Bonereapers", "Soulblight Gravelords",
    "Gloomspite Gitz", "Orruk Warclans", "Ogor Mawtribes", "Sons of Behemat",
  ],
  "The Old World": [
    "Kingdom of Bretonnia", "Tomb Kings of Khemri", "Empire of Man", "Grand Cathay", "Dwarfen Mountain Holds",
    "High Elf Realms", "Wood Elf Realms", "Orc & Goblin Tribes", "Warriors of Chaos", "Beastmen Brayherds",
  ],
  "Magic: The Gathering": ["White", "Blue", "Black", "Red", "Green", "Multicolour", "Commander"],
  "Pokémon TCG": ["Fire", "Water", "Grass", "Lightning", "Psychic", "Fighting", "Darkness", "Metal", "Dragon"],
  "Not sure yet": [],
};

// Where a "Reserve at store" enquiry is sent. These are PLACEHOLDERS — replace
// with Bastion Wargames' real details before going live.
//   whatsapp: full international number, digits only, no + or spaces (e.g. "6591234567").
//             Leave "" to hide the WhatsApp button.
//   email:    store enquiries inbox.
export const STORE = {
  name: "Bastion Wargames",
  whatsapp: "",
  email: "hello@bastionwargames.example",
};

// Common optional extras a customer can add to a bundle straight from the order
// card. Prices in SGD — keep roughly in step with the SYSTEM_PROMPT catalogue in
// api/bundle.js.
export const ADDONS = [
  { name: "Citadel paint", price: 9 },
  { name: "Faction Paint Set", price: 54 },
  { name: "Citadel Starter Brush", price: 9 },
  { name: "Warhammer Tools Set", price: 28 },
  { name: "Plastic glue", price: 11 },
  { name: "Chaos Black spray", price: 28 },
  { name: "Citadel Water Pot", price: 9 },
  { name: "Deck sleeves (100)", price: 9 },
  { name: "Deck box", price: 12 },
];
