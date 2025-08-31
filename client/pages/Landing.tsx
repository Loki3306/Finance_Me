import { Link } from "react-router-dom";
import { CheckCircle2, CreditCard, ShieldCheck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <header className="container mx-auto flex items-center justify-between px-4 py-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-500 grid place-items-center font-bold">FF</div>
          <span className="font-semibold">FlowFinance</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link to="/sign-in" className="text-slate-200 hover:text-white">Sign in</Link>
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
            <Link to="/sign-up">Get Started</Link>
          </Button>
        </nav>
      </header>

      <main className="container mx-auto px-4">
        <section className="py-16 md:py-24 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
              Track expenses effortlessly with Indian payment methods
            </h1>
            <p className="mt-4 text-slate-300 text-lg">
              Smart budgeting with UPI, Credit Card, and Cash support. Achieve financial goals with intelligent insights and secure authentication.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                <Link to="/sign-up">Get Started</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <Link to="/sign-in">Sign In</Link>
              </Button>
            </div>
            <div className="mt-6 flex items-center gap-3 text-slate-300">
              <ShieldCheck className="text-emerald-400" /> Secure authentication and data protection
            </div>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl backdrop-blur p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-emerald-500/20 p-4">
                <Wallet />
                <h3 className="mt-2 font-semibold">Unified Accounts</h3>
                <p className="text-sm text-slate-200/80">Bank, UPI, and Cash in one place</p>
              </div>
              <div className="rounded-xl bg-emerald-500/20 p-4">
                <CreditCard />
                <h3 className="mt-2 font-semibold">Smart Budgeting</h3>
                <p className="text-sm text-slate-200/80">Budgets with real-time tracking</p>
              </div>
              <div className="rounded-xl bg-emerald-500/20 p-4">
                <CheckCircle2 />
                <h3 className="mt-2 font-semibold">Goals & Insights</h3>
                <p className="text-sm text-slate-200/80">Reach your targets faster</p>
              </div>
              <div className="rounded-xl bg-emerald-500/20 p-4">
                <ShieldCheck />
                <h3 className="mt-2 font-semibold">Privacy First</h3>
                <p className="text-sm text-slate-200/80">Protected and secure</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12">
          <h2 className="text-2xl md:text-3xl font-bold text-center">Loved by users across India</h2>
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-white/10 border border-white/20 p-4">
              <p className="text-slate-200">“FlowFinance makes managing UPI and cards simple. I finally see where my money goes.”</p>
              <div className="mt-3 text-sm text-slate-300">— Aditi, Mumbai</div>
            </div>
            <div className="rounded-xl bg-white/10 border border-white/20 p-4">
              <p className="text-slate-200">“The budgeting and goals changed how I plan monthly expenses.”</p>
              <div className="mt-3 text-sm text-slate-300">— Rohan, Bangalore</div>
            </div>
            <div className="rounded-xl bg-white/10 border border-white/20 p-4">
              <p className="text-slate-200">“Secure, fast, and tailored for Indian payments.”</p>
              <div className="mt-3 text-sm text-slate-300">— Kavya, Delhi</div>
            </div>
          </div>
        </section>
      </main>

      <footer className="container mx-auto px-4 py-8 text-center text-slate-300">
        © {new Date().getFullYear()} FlowFinance
      </footer>
    </div>
  );
}
