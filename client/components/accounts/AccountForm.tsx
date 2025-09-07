import { useForm } from "react-hook-form";
import React from "react";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const schema = z.object({
  name: z.string().min(2),
  type: z.enum(["cash", "upi", "credit_card", "bank"]),
  subType: z.string().optional(),
  balance: z.coerce.number().min(0, "Balance cannot be negative").optional(),
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
      type: "placeholder", // <-- Start with placeholder value
      balance: initialValues?.balance ?? NaN,
      ...initialValues,
    } as any,
  });

  useEffect(() => {
    if (open) {
      form.reset({ name: "", type: "cash", balance: NaN } as any);
    }
  }, [open]);

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
  const [submitAttempted, setSubmitAttempted] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={(v) => {
      onOpenChange(v);
      if (!v) {
        form.reset({ name: "", type: "placeholder", balance: NaN } as any);
      }
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initialValues?.id ? "Edit Account" : "Add Account"}
          </DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={e => {
            e.preventDefault();
            setSubmitAttempted(true);
            let values = form.getValues();
            console.log("AccountForm submit handler called", values);
            // Remove balance for credit card accounts
            if (values.type === "credit_card") {
              const { balance, ...rest } = values;
              values = rest;
            }
            // Only submit if required fields are filled
            if (
              values.name &&
              values.type &&
              (values.type !== "credit_card" ? !isNaN(values.balance) : true)
            ) {
              mutation.mutate(values);
            }
          }}
        >
          <div>
            <label className="text-sm mb-2 block">Account Name</label>
            <Input
              {...form.register("name")}
              placeholder="My HDFC Credit Card"
            />
            {submitAttempted && form.watch("name") === "" && (
              <div className="text-red-500 text-xs mt-1">This block has not been filled</div>
            )}
          </div>
          <div>
            <label className="text-sm mb-2 block">Account Type</label>
            <Select
              value={form.watch("type")}
              onValueChange={(v: any) => form.setValue("type", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Account Type" />
              </SelectTrigger>
              <SelectContent>
                {/* Remove placeholder to fix type error */}
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
              </SelectContent>
            </Select>
            {submitAttempted && form.watch("type") === "placeholder" && (
              {/* Remove placeholder error to fix type error */}
            )}
          </div>
          {type === "upi" && (
            <div>
              <label className="text-sm mb-2 block">UPI Provider</label>
              <Select
                value={form.watch("subType")}
                onValueChange={v => form.setValue("subType", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select UPI Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phonepe">PhonePe</SelectItem>
                  <SelectItem value="googlepay">Google Pay</SelectItem>
                  <SelectItem value="paytm">Paytm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {type === "credit_card" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm mb-2 block">Credit Limit</label>
                <Input
                  type="number"
                  step="0.01"
                  {...form.register("creditLimit")}
                  className={form.watch("creditLimit") < 0 ? "border-red-500 focus:border-red-500" : ""}
                />
                {form.watch("creditLimit") < 0 && (
                  <div className="text-red-500 text-xs mt-1">Credit limit can't be negative</div>
                )}
                <div className="mt-2">
                  <label className="text-xs mb-1 block">Quick Select:</label>
                  <div className="flex gap-2">
                    {[5000, 10000, 15000, 20000].map((limit) => (
                      <button
                        key={limit}
                        type="button"
                        className={`px-3 py-1 rounded-full border transition-colors text-sm font-medium ${form.watch("creditLimit") === limit ? "bg-primary text-primary-foreground border-primary" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"}`}
                        onClick={() => form.setValue("creditLimit", limit)}
                      >
                        {limit}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm mb-2 block">Payment Due Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Input
                      readOnly
                      value={form.watch("paymentDueDate") ? new Date(form.watch("paymentDueDate")).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : "Select date"}
                      placeholder="Select date"
                      className="w-full cursor-pointer bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-lg shadow-lg border border-gray-200 bg-white" align="start">
                    <Calendar
                      selected={form.watch("paymentDueDate") ? new Date(form.watch("paymentDueDate")) : undefined}
                      onSelect={date => {
                        if (date) {
                          form.setValue("paymentDueDate", date.getTime());
                        }
                      }}
                      className="rounded-lg border border-gray-200 bg-white shadow-md p-2"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
          {/* Current Balance only for non-credit card accounts */}
          {type !== "credit_card" && (
            <div>
              <label className="text-sm mb-2 block">Current Balance</label>
              <Input
                type="number"
                step="0.01"
                value={isNaN(form.watch("balance")) ? "" : form.watch("balance")}
                onChange={e => {
                  const val = e.target.value;
                  form.setValue("balance", val === "" ? NaN : Number(val));
                }}
                className={form.watch("balance") < 0 ? "border-red-500 focus:border-red-500" : ""}
              />
              {submitAttempted && isNaN(form.watch("balance")) && (
                <div className="text-red-500 text-xs mt-1">This block has not been filled</div>
              )}
              {form.watch("balance") < 0 && (
                <div className="text-red-500 text-xs mt-1">Account balance can't be negative</div>
              )}
            </div>
          )}
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
