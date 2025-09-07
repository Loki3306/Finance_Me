import React, { useState } from "react";

const initialAccounts = [
  { id: 1, name: "Savings", type: "Bank", balance: 12000, icon: "💰" },
  { id: 2, name: "Credit Card", type: "Credit", balance: -5000, icon: "💳" },
  { id: 3, name: "Wallet", type: "Cash", balance: 800, icon: "👛" },
];

export default function AccountsPage() {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [filter, setFilter] = useState("All");

  const filteredAccounts =
    filter === "All"
      ? accounts
      : accounts.filter((acc) => acc.type === filter);

  const handleEdit = (id, name) => {
    setEditingId(id);
    setEditValue(name);
  };

  const handleEditSave = (id) => {
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === id ? { ...acc, name: editValue } : acc
      )
    );
    setEditingId(null);
    setEditValue("");
  };

  const handleDelete = (id) => {
    setAccounts((prev) => prev.filter((acc) => acc.id !== id));
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Accounts</h1>
      <div className="flex gap-2 mb-6 justify-center">
        {["All", "Bank", "Credit", "Cash"].map((type) => (
          <button
            key={type}
            className={`px-3 py-1 rounded-full border ${
              filter === type
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
            }`}
            onClick={() => setFilter(type)}
          >
            {type}
          </button>
        ))}
      </div>
      <div className="grid gap-4">
        {filteredAccounts.map((acc) => (
          <div
            key={acc.id}
            className="flex items-center bg-white rounded-lg shadow p-4 gap-4"
          >
            <span className="text-3xl">{acc.icon}</span>
            <div className="flex-1">
              {editingId === acc.id ? (
                <input
                  className="border rounded px-2 py-1 w-full"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleEditSave(acc.id)}
                  autoFocus
                />
              ) : (
                <>
                  <div className="font-semibold text-lg">{acc.name}</div>
                  <div className="text-sm text-gray-500">{acc.type}</div>
                  <div className="text-sm text-gray-700">
                    Balance: ₹{acc.balance.toLocaleString()}
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-2">
              {editingId === acc.id ? null : (
                <>
                  <button
                    className="px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
                    onClick={() => handleEdit(acc.id, acc.name)}
                  >
                    Edit
                  </button>
                  <button
                    className="px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600"
                    onClick={() => handleDelete(acc.id)}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {filteredAccounts.length === 0 && (
          <div className="text-center text-gray-400 py-8">No accounts found.</div>
        )}
      </div>
    </div>
  );
}
