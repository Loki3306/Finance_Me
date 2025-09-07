import React, { useState } from "react";

// --- MOCK UTILITIES (For a runnable example) ---
// In a real project, these would be in separate files.
const cn = (...classes) => classes.filter(Boolean).join(" ");
const buttonVariants = ({ variant }) => {
  const base = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
  const variants = {
    ghost: "hover:bg-accent hover:text-accent-foreground",
    outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
  };
  return cn(base, variants[variant]);
};

// --- Calendar Component ---
export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, onSelect }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // Build calendar grid
  const rows = [];
  let cells = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(<td key={`empty-${i}`}></td>);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday =
      d === new Date().getDate() &&
      month === new Date().getMonth() &&
      year === new Date().getFullYear();
    const isSelected = selectedDay === d;
    cells.push(
      <td
        key={d.toString()}
        className={
          "rounded-full transition-colors duration-100 cursor-pointer px-0 py-0 text-sm font-semibold w-8 h-8 " +
          (isSelected
            ? "bg-blue-500 text-white border-2 border-blue-700"
            : isToday
            ? "bg-blue-100 text-blue-700 border-2 border-blue-400"
            : "hover:bg-gray-100 text-gray-800")
        }
        onClick={() => {
          setSelectedDay(d);
          if (onSelect) onSelect(new Date(year, month, d));
        }}
      >
        {d}
      </td>
    );
    if ((cells.length) % 7 === 0 || d === daysInMonth) {
      rows.push(<tr key={`row-${d}`}>{cells}</tr>);
      cells = [];
    }
  }

  return (
    <div className={"p-2 rounded bg-white shadow-xl border border-gray-200 w-fit mx-auto min-w-[220px] " + (className || "") }>
      <div className="flex justify-between items-center mb-1 min-w-[220px]">
        <button
          className="px-1 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-sm font-bold"
          onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
        >
          &lt;
        </button>
        <span className="font-bold text-sm tracking-wide text-gray-900">
          {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
        </span>
        <button
          className="px-1 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-sm font-bold"
          onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
        >
          &gt;
        </button>
      </div>
      <table className="border-collapse text-center text-sm min-w-[220px]">
        <thead>
          <tr>
            {weekdays.map(day => (
              <th key={day} className="py-1 font-bold text-gray-600 text-sm tracking-wide">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
}

export { Calendar };

