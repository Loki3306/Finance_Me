import React from 'react';

const BudgetFilterBar = () => {
  // TODO: Filter tabs, view toggle, sort dropdown, search bar
  return (
    <div className="flex flex-wrap gap-2 items-center py-4">
      <div className="tabs">
        <button className="tab tab-active">All</button>
        <button className="tab">Active</button>
        <button className="tab">Exceeded</button>
        <button className="tab">Completed</button>
      </div>
      {/* TODO: View toggle, sort dropdown, search bar */}
    </div>
  );
};

export default BudgetFilterBar;
