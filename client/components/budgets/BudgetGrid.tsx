import React from 'react';
import BudgetCard from './BudgetCard';

const BudgetGrid = ({ budgets, loading, onQuickExpense, onEdit, onView }) => {
  if (loading) return <div className="text-center py-8 text-slate-400">Loading budgets...</div>;
  if (!budgets.length) return <div className="text-center py-8 text-slate-400">No budgets found. Create one!</div>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {budgets.map(budget => (
        <BudgetCard
          key={budget._id}
          budget={budget}
          onQuickExpense={onQuickExpense}
          onEdit={onEdit}
          onView={onView}
        />
      ))}
    </div>
  );
};

export default BudgetGrid;
