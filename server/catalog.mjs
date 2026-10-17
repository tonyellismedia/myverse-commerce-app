export const decorCatalog = [
  {
    title: "Aurelia Lounge Chair",
    description:
      "A sculptural lounge chair in warm ivory bouclé with a solid oak frame. An inviting focal point for living rooms and reading corners. Dimensions: 82 × 84 × 76 cm.",
    price: 249900,
    inventory: 8,
    category: "Seating",
    art: "chair",
  },
  {
    title: "Caldera Travertine Table",
    description:
      "A low, architectural coffee table crafted from natural honed travertine. Each surface has its own veining. For considered living spaces. Dimensions: 100 × 60 × 32 cm.",
    price: 189000,
    inventory: 6,
    category: "Tables",
    art: "table",
  },
  {
    title: "Halo Linen Pendant",
    description:
      "A softly sculpted linen shade, suspended above dining tables and quiet corners. A warm statement for layered interiors. Shade diameter: 55 cm. Professional installation required.",
    price: 62000,
    inventory: 12,
    category: "Lighting",
    art: "lamp",
  },
  {
    title: "Arc Ceramic Vessel",
    description:
      "An expressive, hand-finished ceramic vessel in a matte chalk glaze. Beautiful on consoles, shelves, and dining tables. Height: 34 cm. Decorative use.",
    price: 18500,
    inventory: 24,
    category: "Objects",
    art: "vase",
  },
];
export function addDecorCatalog(db, storeId) {
  const insert = db.prepare(
    "INSERT INTO products (id,store_id,title,description,price,inventory,category,art) VALUES (?,?,?,?,?,?,?,?)",
  );
  for (const [i, p] of decorCatalog.entries())
    insert.run(
      `${storeId}-decor-${i}`,
      storeId,
      p.title,
      p.description,
      p.price,
      p.inventory,
      p.category,
      p.art,
    );
}
