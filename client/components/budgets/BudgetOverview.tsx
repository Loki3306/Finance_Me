import React from 'react';

const BudgetOverview = ({ budgets, loading }) => {
  // TODO: Calculate overall spending, health, comparison, alerts
  return (
    <div className="my-6">
      <div className="bg-slate-800/60 rounded-xl p-4 text-slate-100 shadow">
        <div className="font-bold text-xl mb-2">Overall Spending Summary</div>
        {/* TODO: Health indicator, comparison, top overspent categories */}
        <div className="text-sm">{budgets.length} budgets tracked.</div>
      </div>
    </div>
  );
};

export default BudgetOverview;
