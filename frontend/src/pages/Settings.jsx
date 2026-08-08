import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/Shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export default function Settings() {
  const { user, company } = useAuth();
  const [team, setTeam] = useState([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ role: "viewer" });

  const load = () => api.get("/team").then(r => setTeam(r.data));
  useEffect(() => { load(); }, []);

  const invite = async () => {
    try { await api.post("/team/invite", f); toast.success("Team member added"); setOpen(false); setF({ role: "viewer" }); load(); }
    catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Company profile, team, subscription." testId="settings-header" />
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="border border-border bg-card rounded-md p-6">
          <div className="text-[11px] font-mono-tab text-primary uppercase tracking-widest">Workspace</div>
          <div className="mt-3 space-y-2 text-sm">
            <div><span className="text-muted-foreground">Company:</span> {company?.name}</div>
            <div><span className="text-muted-foreground">GSTIN:</span> <span className="font-mono-tab">{company?.gstin || "—"}</span></div>
            <div><span className="text-muted-foreground">Address:</span> {company?.address || "—"}</div>
            <div><span className="text-muted-foreground">Plan:</span> <Badge variant="outline" className="uppercase text-primary border-primary/30">{company?.plan}</Badge></div>
            <div><span className="text-muted-foreground">Trial ends:</span> <span className="font-mono-tab">{company?.trial_ends_at?.slice(0, 10)}</span></div>
          </div>
        </div>

        <div className="border border-border bg-card rounded-md p-6">
          <div className="flex justify-between items-center">
            <div className="text-[11px] font-mono-tab text-primary uppercase tracking-widest">Team</div>
            <Button size="sm" onClick={() => setOpen(true)} data-testid="team-invite-btn"><Plus className="w-3 h-3 mr-1" /> Invite</Button>
          </div>
          <div className="mt-3 space-y-2">
            {team.map(t => (
              <div key={t.id} className="border border-border rounded-sm p-3 flex justify-between items-center" data-testid={`team-member-${t.id}`}>
                <div>
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.email}</div>
                </div>
                <Badge variant="outline" className="uppercase text-[10px]">{t.role}</Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-dashed border-primary/40 bg-primary/5 rounded-md p-6 lg:col-span-2">
          <div className="text-[11px] font-mono-tab text-primary uppercase tracking-widest">Subscription (mocked)</div>
          <div className="font-display font-bold text-2xl mt-2">You're on {company?.plan?.toUpperCase()} plan.</div>
          <p className="text-sm text-muted-foreground mt-1">Payments are disabled in this build. When you're ready to go live, connect Razorpay or Stripe to unlock billing.</p>
          <div className="mt-4 flex gap-2 flex-wrap">
            {["starter", "growth", "pro"].map(p => (
              <Button key={p} variant="outline" size="sm" data-testid={`plan-${p}-btn`}>Switch to {p}</Button>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Invite team member</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Name</Label><Input value={f.name || ""} onChange={(e) => setF({ ...f, name: e.target.value })} data-testid="invite-name-input" /></div>
            <div><Label className="text-xs">Email</Label><Input type="email" value={f.email || ""} onChange={(e) => setF({ ...f, email: e.target.value })} data-testid="invite-email-input" /></div>
            <div><Label className="text-xs">Temp Password</Label><Input type="password" value={f.password || ""} onChange={(e) => setF({ ...f, password: e.target.value })} data-testid="invite-password-input" /></div>
            <div>
              <Label className="text-xs">Role</Label>
              <Select value={f.role} onValueChange={(v) => setF({ ...f, role: v })}>
                <SelectTrigger data-testid="invite-role-select"><SelectValue /></SelectTrigger>
                <SelectContent>{["manager", "accountant", "dispatcher", "driver", "viewer"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={invite} data-testid="invite-submit-btn">Send Invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
