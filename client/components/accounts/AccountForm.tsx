import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { apiFetch } from "@/lib/api";

const schema = z.object({
  name: z.string().min(2),
  type: z.enum(["cash", "upi", "credit_card", "bank"]),
  subType: z.string().optional(),
  balance: z.coerce.number(),
  creditLimit: z.coerce.number().optional(),
  upiId: z.string().optional(),
  paymentDueDate: z.coerce.number().min(1).max(31).optional(),
});

export type AccountFormValues = z.infer<typeof schema>;

export function AccountForm({
  open,
  onOpenChange,
  initialValues,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialValues?: Partial<AccountFormValues> & { id?: string };
}) {
  const qc = useQueryClient();
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      type: "cash",
      balance: 0,
      ...initialValues,
    } as any,
  });

  useEffect(() => {
    form.reset({ name: "", type: "cash", balance: 0, ...initialValues } as any);
  }, [initialValues]);

  const mutation = useMutation({
    mutationFn: async (values: AccountFormValues) => {
      const res = await apiFetch(
        initialValues?.id
          ? `/api/accounts/${initialValues.id}`
          : "/api/accounts",
        {
          method: initialValues?.id ? "PUT" : "POST",
          body: JSON.stringify(values),
        },
      );
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      onOpenChange(false);
    },
  });

  const type = form.watch("type");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initialValues?.id ? "Edit Account" : "Add Account"}
          </DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
        >
          <div>
            <label className="text-sm">Account Name</label>
            <Input
              {...form.register("name")}
              placeholder="My HDFC Credit Card"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm">Account Type</label>
              <Select
                value={form.watch("type")}
                onValueChange={(v: any) => form.setValue("type", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm">Sub-Type</label>
              <Input
                {...form.register("subType")}
                placeholder={
                  type === "upi"
                    ? "Paytm / PhonePe / GPay"
                    : type === "credit_card" || type === "bank"
                      ? "HDFC / SBI / ICICI / Axis"
                      : ""
                }
              />
            </div>
          </div>
          {type === "upi" && (
            <div>
              <label className="text-sm">UPI ID</label>
              <Input {...form.register("upiId")} placeholder="user@paytm" />
            </div>
          )}
          {type === "credit_card" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm">Credit Limit</label>
                <Input
                  type="number"
                  step="0.01"
                  {...form.register("creditLimit")}
                />
              </div>
              <div>
                <label className="text-sm">Payment Due Date</label>
                <Input type="number" {...form.register("paymentDueDate")} />
              </div>
            </div>
          )}
          <div>
            <label className="text-sm">Current Balance</label>
            <Input
              type="number"
              step="0.01"
              {...form.register("balance", { valueAsNumber: true })}
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground"
            >
              {initialValues?.id ? "Save" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
