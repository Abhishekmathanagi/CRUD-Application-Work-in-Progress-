import { useCallback, useEffect, useState } from "react";
import { api } from "../api";

export function useItems(query, enabled = true) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch whenever the (debounced) search query changes.
  // AbortController drops stale responses if the user keeps typing.
  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setLoading(false);
      setError("");
      return undefined;
    }
    const controller = new AbortController();
    setLoading(true);
    setError("");

    api
      .list(query, controller.signal)
      .then(setItems)
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [query, enabled]);

  const addItem = useCallback(async (item) => {
    const created = await api.create(item);
    setItems((prev) => [...prev, created]);
  }, []);

  const updateItem = useCallback(async (originalId, item) => {
    const updated = await api.update(originalId, item);
    setItems((prev) => prev.map((i) => (i.id === originalId ? updated : i)));
  }, []);

  const removeItem = useCallback(async (id) => {
    await api.remove(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return { items, loading, error, addItem, updateItem, removeItem };
}
