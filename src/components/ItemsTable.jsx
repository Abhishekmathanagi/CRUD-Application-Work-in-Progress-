import ItemRow from "./ItemRow";

export default function ItemsTable({ items, loading, onSave, onDelete }) {
  if (loading) return <p className="state">Loading items…</p>;
  if (items.length === 0) return <p className="state">No items found.</p>;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th className="num">Price</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              onSave={onSave}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
