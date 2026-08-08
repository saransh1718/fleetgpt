import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Truck } from "lucide-react";

export default function Signup() {
  const { signup } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ company_name: "", name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await signup(f); toast.success("Workspace created"); nav("/app"); }
    catch (err) { toast.error(err?.response?.data?.detail || "Signup failed"); }
    setLoading(false);
  };
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex bg-card border-r border-border relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="relative p-12 flex flex-col justify-between w-full">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary grid place-items-center"><Truck className="w-4 h-4 text-primary-foreground" /></div>
            <div className="font-display font-bold text-lg">YourFleetAI</div>
          </Link>
          <div className="space-y-3">
            <div className="text-[11px] font-mono-tab text-primary uppercase tracking-widest">// what you get</div>
            {["All 15 modules unlocked","Multi-user team workspace","AI insights built-in","Public shipment tracking pages"].map(t => (
              <div key={t} className="text-sm text-foreground/90 border-l-2 border-primary pl-3">{t}</div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-8">
        <form onSubmit={submit} className="w-full max-w-sm space-y-4" data-testid="signup-form">
          <div>
            <div className="text-[11px] font-mono-tab text-primary uppercase tracking-widest">/ create workspace</div>
            <h1 className="font-display font-bold text-3xl tracking-tight mt-1">Spin up your workspace.</h1>
          </div>
          <div>
            <Label className="text-xs">Company name</Label>
            <Input value={f.company_name} onChange={(e) => setF({ ...f, company_name: e.target.value })} required data-testid="signup-company-input" />
          </div>
          <div>
            <Label className="text-xs">Your name</Label>
            <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required data-testid="signup-name-input" />
          </div>
          <div>
            <Label className="text-xs">Work email</Label>
            <Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required data-testid="signup-email-input" />
          </div>
          <div>
            <Label className="text-xs">Password</Label>
            <Input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required minLength={6} data-testid="signup-password-input" />
          </div>
          <Button type="submit" className="w-full" disabled={loading} data-testid="signup-submit-btn">
            {loading ? "Creating…" : "Create workspace"}
          </Button>
          <div className="text-sm text-center text-muted-foreground">
            Already have an account? <Link to="/login" className="text-primary hover:underline" data-testid="signup-login-link">Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
