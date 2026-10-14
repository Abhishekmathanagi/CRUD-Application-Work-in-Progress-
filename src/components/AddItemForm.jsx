import { useState } from "react";
import { normalizeItem, validateItem } from "../utils/validate";

const EMPTY = { id: "", name: "", price: "" };

export default function AddItemForm({ onAdd }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const change = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const problem = validateItem(form);
    if (problem) return setError(problem);

    setBusy(true);
    setError("");
    try {
      await onAdd(normalizeItem(form));
      setForm(EMPTY);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="add-form" onSubmit={submit}>
      <input
        type="number"
        min="1"
        placeholder="ID"
        value={form.id}
        onChange={change("id")}
        aria-label="New item ID"
      />
      <input
        type="text"
        placeholder="Item name"
        value={form.name}
        onChange={change("name")}
        aria-label="New item name"
      />
      <input
        type="number"
        min="0"
        step="0.01"
        placeholder="Price"
        value={form.price}
        onChange={change("price")}
        aria-label="New item price"
      />
      <button type="submit" className="btn primary" disabled={busy}>
        {busy ? "Adding…" : "Add item"}
      </button>
      {error && <p className="form-error" role="alert">{error}</p>}
    </form>
  );
}
