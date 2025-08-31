import { SignUp } from "@clerk/clerk-react";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 px-4">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Join FlowFinance</h2>
          <p className="text-slate-300">Start your financial journey today</p>
        </div>
        <SignUp
          appearance={{
            elements: {
              formButtonPrimary: "bg-emerald-600 hover:bg-emerald-700",
              card: "bg-white/10 backdrop-blur-lg border border-white/20",
              headerTitle: "text-white",
              headerSubtitle: "text-slate-300",
            },
          }}
          afterSignUpUrl="/onboarding"
        />
      </div>
    </div>
  );
}
