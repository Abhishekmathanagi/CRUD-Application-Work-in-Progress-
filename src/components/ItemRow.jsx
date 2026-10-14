import { useState } from "react";
import { formatPrice } from "../config";
import { normalizeItem, validateItem } from "../utils/validate";

export default function ItemRow({ item, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const startEdit = () => {
    setDraft(item);
    setError("");
    setEditing(true);
  };

  const change = (field) => (e) =>
    setDraft((prev) => ({ ...prev, [field]: e.target.value }));

  const save = async () => {
    const problem = validateItem(draft);
    if (problem) return setError(problem);

    setBusy(true);
    setError("");
    try {
      await onSave(item.id, normalizeItem(draft));
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    setBusy(true);
    try {
      await onDelete(item.id);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  if (!editing) {
    return (
      <tr>
        <td>{item.id}</td>
        <td>{item.name}</td>
        <td className="num">{formatPrice(item.price)}</td>
        <td className="actions">
          <button className="btn" onClick={startEdit} disabled={busy}>
            Edit
          </button>
          <button className="btn danger" onClick={remove} disabled={busy}>
            Delete
          </button>
          {error && <span className="row-error" role="alert">{error}</span>}
        </td>
      </tr>
    );
  }

  return (
    <tr className="editing">
      <td>
        <input
          type="number"
          min="1"
          value={draft.id}
          onChange={change("id")}
          aria-label="Item ID"
        />
      </td>
      <td>
        <input
          type="text"
          value={draft.name}
          onChange={change("name")}
          aria-label="Item name"
          autoFocus
        />
      </td>
      <td>
        <input
          type="number"
          min="0"
          step="0.01"
          value={draft.price}
          onChange={change("price")}
          aria-label="Item price"
        />
      </td>
      <td className="actions">
        <button className="btn primary" onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </button>
        <button className="btn" onClick={() => setEditing(false)} disabled={busy}>
          Cancel
        </button>
        {error && <span className="row-error" role="alert">{error}</span>}
      </td>
    </tr>
  );
}
