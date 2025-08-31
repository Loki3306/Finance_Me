export function formatINR(n: number) {
  if (n === null || n === undefined) return "₹0";
  const isNeg = n < 0;
  const x = Math.abs(Math.round(n));
  const lastThree = x % 1000;
  const other = Math.floor(x / 1000);
  const formatted = other ? `${other.toString().replace(/\B(?=(\d{2})+(?!\d))/g, ",")},${lastThree.toString().padStart(3, "0")}` : `${lastThree}`;
  return `${isNeg ? "-" : ""}₹${formatted}`;
}
