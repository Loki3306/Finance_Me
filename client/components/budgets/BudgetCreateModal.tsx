import React, { useState } from 'react';

const BudgetCreateModal = ({ onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    const res = await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, amount: Number(amount), budgetType: 'overall', period: 'monthly' })
    });
    const data = await res.json();
    setLoading(false);
    if (data._id) {
      onCreated(data);
      onClose();
    } else {
      alert(data.error || 'Failed to create budget');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white/20 backdrop-blur-lg border border-slate-300 shadow-2xl rounded-2xl p-8 w-full max-w-md flex flex-col gap-4">
        <h2 className="font-extrabold text-2xl text-slate-900 mb-2 drop-shadow">Create Budget</h2>
        <label className="font-semibold text-slate-800 mb-1">Budget Name</label>
        <input className="w-full px-4 py-2 rounded-lg bg-slate-100 text-slate-900 font-medium border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 mb-2" placeholder="Budget Name" value={name} onChange={e => setName(e.target.value)} />
        <label className="font-semibold text-slate-800 mb-1">Amount (₹)</label>
        <input className="w-full px-4 py-2 rounded-lg bg-slate-100 text-slate-900 font-medium border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400 mb-4" placeholder="Amount (₹)" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
        <div className="flex gap-4 justify-end mt-2">
          <button className="px-4 py-2 rounded-lg font-bold bg-slate-700 text-white hover:bg-slate-900 transition" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 rounded-lg font-bold bg-emerald-500 text-white hover:bg-emerald-700 transition" disabled={loading} onClick={handleCreate}>Create</button>
        </div>
      </div>
    </div>
  );
};

export default BudgetCreateModal;
