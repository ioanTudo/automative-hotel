import { formatCurrency } from "@/lib/booking-utils";

type MenuItem = { name: string; description: string; price: number };
type MenuSection = { title: string; items: MenuItem[] };

const MENU: MenuSection[] = [
  {
    title: "Starters",
    items: [
      { name: "Roasted tomato soup", description: "Basil oil, sourdough croutons", price: 6.5 },
      { name: "Garden salad", description: "Seasonal leaves, walnuts, house dressing", price: 7 },
      { name: "Bruschetta", description: "Tomato, garlic, olive oil on toasted bread", price: 6 },
    ],
  },
  {
    title: "Mains",
    items: [
      { name: "Grilled chicken", description: "Roast potatoes, seasonal vegetables", price: 15 },
      { name: "Pan-seared salmon", description: "Lemon butter, herbed rice", price: 18 },
      { name: "Wild mushroom risotto", description: "Parmesan, truffle oil (v)", price: 14 },
    ],
  },
  {
    title: "Desserts",
    items: [
      { name: "Chocolate fondant", description: "Vanilla ice cream", price: 7 },
      { name: "Seasonal fruit tart", description: "Crème pâtissière", price: 6.5 },
      { name: "Cheese selection", description: "Local cheeses, crackers, chutney", price: 9 },
    ],
  },
];

export function MenuPreview() {
  return (
    <div className="grid gap-8 md:grid-cols-3">
      {MENU.map((section) => (
        <div key={section.title}>
          <h3 className="text-lg font-semibold text-stone-900">{section.title}</h3>
          <ul className="mt-4 space-y-4">
            {section.items.map((item) => (
              <li key={item.name} className="border-b border-stone-100 pb-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-medium text-stone-800">{item.name}</span>
                  <span className="text-sm font-semibold text-amber-700">
                    {formatCurrency(item.price)}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-stone-500">{item.description}</p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
