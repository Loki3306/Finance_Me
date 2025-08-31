import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountForm } from "./AccountForm";
import { AccountCard } from "./AccountCard";
import { apiFetch } from "@/lib/api";

export function AccountGrid() {
  const qc = useQueryClient();
  const [type, setType] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["accounts", type],
    queryFn: async () => {
      const qs = type !== "all" ? `?type=${type}` : "";
      const res = await apiFetch(`/api/accounts${qs}`);
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/api/accounts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });

  const tabs = useMemo(
    () => [
      { v: "all", label: "All" },
      { v: "cash", label: "Cash" },
      { v: "upi", label: "UPI" },
      { v: "credit_card", label: "Credit" },
      { v: "bank", label: "Bank" },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={type} onValueChange={setType}>
          <TabsList>
            {tabs.map((t) => (
              <TabsTrigger key={t.v} value={t.v}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button
          className="bg-primary text-primary-foreground"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          Add Account
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((a: any) => (
          <AccountCard
            key={a._id}
            account={a}
            onEdit={(acc) => {
              setEditing({ id: acc._id, ...acc });
              setOpen(true);
            }}
            onDelete={(id) => del.mutate(id)}
          />
        ))}
      </div>
      <AccountForm
        open={open}
        onOpenChange={setOpen}
        initialValues={editing || undefined}
      />
    </div>
  );
}
