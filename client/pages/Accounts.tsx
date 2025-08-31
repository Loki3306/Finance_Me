import { AccountGrid } from "@/components/accounts/AccountGrid";

export default function Accounts() {
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Accounts</h1>
      </div>
      <AccountGrid />
    </div>
  );
}
