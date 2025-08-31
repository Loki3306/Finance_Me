import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "@/lib/api";

const providers = ["HDFC", "SBI", "ICICI", "Axis", "Paytm", "PhonePe", "GPay"];

export default function OnboardingPage() {
  const { user } = useUser();
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const [accountName, setAccountName] = useState("Primary Bank Account");
  const [accountType, setAccountType] = useState<"cash" | "upi" | "bank" | "credit_card">("bank");
  const [provider, setProvider] = useState("");
  const [balance, setBalance] = useState<string>("");
  const [upiId, setUpiId] = useState("");
  const [creditLimit, setCreditLimit] = useState<string>("");
  const [paymentDueDate, setPaymentDueDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upiValid = !upiId || /^[\w.-]+@[\w.-]+$/.test(upiId);
  const balanceNum = Number(balance || 0);
  const creditLimitNum = Number(creditLimit || 0);
  const paymentDueNum = paymentDueDate ? Number(paymentDueDate) : undefined;

  async function complete() {
    setError(null);
    setLoading(true);
    try {
      const payload: any = {
        name: accountName || "Primary Bank Account",
        type: accountType,
        balance: isNaN(balanceNum) ? 0 : balanceNum,
      };
      if (provider) payload.subType = provider;
      if (accountType === "upi") payload.upiId = upiId;
      if (accountType === "credit_card") {
        payload.creditLimit = isNaN(creditLimitNum) ? undefined : creditLimitNum;
        if (paymentDueNum != null) payload.paymentDueDate = paymentDueNum;
      }
      const res = await apiFetch("/api/accounts", { method: "POST", body: JSON.stringify(payload) });
      if (!res.ok) throw new Error("Failed to create account");
      setStep(4);
      setTimeout(() => navigate("/dashboard"), 900);
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 text-sm text-slate-300">Step {Math.min(step,3)} of 3</div>
        <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Welcome{user?.firstName ? ", " + user.firstName : ""}!</h2>
              <p className="text-slate-300">FlowFinance helps you track expenses across UPI, Credit Cards, and Cash with smart budgeting and insights.</p>
              <div className="pt-2">
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setStep(2)}>Continue</Button>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Create your first account</h2>
              <div>
                <label className="text-sm">Account Name</label>
                <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">Account Type</label>
                  <Select value={accountType} onValueChange={(v: any) => setAccountType(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="bank">Bank</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm">Bank/Provider</label>
                  <Select value={provider} onValueChange={(v: any) => setProvider(v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {providers.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {accountType === "upi" && (
                <div>
                  <label className="text-sm">UPI ID</label>
                  <Input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="user@bank" />
                  {!upiValid && <div className="text-red-300 text-sm mt-1">Enter a valid UPI ID</div>}
                </div>
              )}
              {accountType === "credit_card" && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm">Credit Limit</label>
                    <Input type="number" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm">Payment Due Date</label>
                    <Input type="number" min={1} max={31} value={paymentDueDate} onChange={(e) => setPaymentDueDate(e.target.value)} />
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm">Current Balance (₹)</label>
                <Input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} />
              </div>
              {error && <div className="text-red-300 text-sm">{error}</div>}
              <div className="pt-2 flex items-center gap-2">
                <Button variant="outline" className="border-white/30" onClick={() => setStep(1)}>Back</Button>
                <Button disabled={(accountType === "upi" && !upiValid) || loading} className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setStep(3)}>Continue</Button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Quick preferences</h2>
              <p className="text-slate-300">You're all set. We'll finalize your setup and take you to the dashboard.</p>
              {error && <div className="text-red-300 text-sm">{error}</div>}
              <div className="pt-2 flex items-center gap-2">
                <Button variant="outline" className="border-white/30" onClick={() => setStep(2)}>Back</Button>
                <Button disabled={loading} className="bg-emerald-600 hover:bg-emerald-700" onClick={complete}>{loading ? "Creating..." : "Finish"}</Button>
              </div>
            </div>
          )}
          {step === 4 && (
            <div className="space-y-4 text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/20 grid place-items-center border border-emerald-300/30">
                <div className="h-8 w-8 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <h2 className="text-2xl font-bold">You're ready!</h2>
              <p className="text-slate-300">Redirecting to your dashboard...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
