import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Truck } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("demo@yourfleetai.com");
  const [password, setPassword] = useState("Demo@123");
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await login(email, password); toast.success("Welcome back"); nav("/app"); }
    catch (err) { toast.error(err?.response?.data?.detail || "Login failed"); }
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
          <div>
            <div className="text-[11px] font-mono-tab text-primary uppercase tracking-widest">// signed in fleets</div>
            <h2 className="font-display font-bold text-4xl leading-tight mt-3 tracking-tight">"Cut our fuel bills 14% in three months. The anomaly flags are gold."</h2>
            <div className="mt-4 text-sm text-muted-foreground">— Rakesh S., 42-truck fleet, Nashik</div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-8">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5" data-testid="login-form">
          <div>
            <div className="text-[11px] font-mono-tab text-primary uppercase tracking-widest">/ sign in</div>
            <h1 className="font-display font-bold text-3xl tracking-tight mt-1">Welcome back.</h1>
            <p className="text-sm text-muted-foreground mt-1">Use the demo account or your own.</p>
          </div>
          <div>
            <Label htmlFor="email" className="text-xs">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required data-testid="login-email-input" />
          </div>
          <div>
            <Label htmlFor="password" className="text-xs">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required data-testid="login-password-input" />
          </div>
          <Button type="submit" className="w-full" disabled={loading} data-testid="login-submit-btn">
            {loading ? "Signing in…" : "Sign in"}
          </Button>
          <div className="text-sm text-center text-muted-foreground">
            New to YourFleetAI? <Link to="/signup" className="text-primary hover:underline" data-testid="login-signup-link">Start free trial</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
