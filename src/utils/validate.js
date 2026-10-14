// Returns an error message string, or "" when the item is valid.
export function validateItem({ id, name, price }) {
  const numericId = Number(id);
  const numericPrice = Number(price);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    return "ID must be a positive whole number.";
  }
  if (!String(name).trim()) {
    return "Name is required.";
  }
  if (price === "" || Number.isNaN(numericPrice) || numericPrice < 0) {
    return "Price must be a number of 0 or more.";
  }
  return "";
}

// Convert form strings into the shape the API expects.
export function normalizeItem({ id, name, price }) {
  return {
    id: Number(id),
    name: String(name).trim(),
    price: Number(price),
  };
}
