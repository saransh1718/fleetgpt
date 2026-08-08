import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/Shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
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
      <PageHeader title="Settings" subtitle="Company profile and team." testId="settings-header" />
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="border border-border bg-card rounded-md p-6">
          <div className="text-[11px] font-mono-tab text-primary uppercase tracking-widest">Workspace</div>
          <div className="mt-3 space-y-2 text-sm">
            <div><span className="text-muted-foreground">Company:</span> {company?.name}</div>
            <div><span className="text-muted-foreground">GSTIN:</span> <span className="font-mono-tab">{company?.gstin || "—"}</span></div>
            <div><span className="text-muted-foreground">Address:</span> {company?.address || "—"}</div>
            <div><span className="text-muted-foreground">Phone:</span> <span className="font-mono-tab">{company?.phone || "—"}</span></div>
            <div><span className="text-muted-foreground">Signed in as:</span> {user?.name} · <Badge variant="outline" className="uppercase text-[10px] ml-1">{user?.role}</Badge></div>
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
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Invite team member</DialogTitle><DialogDescription>They'll be able to sign in with the temp password you set here.</DialogDescription></DialogHeader>
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
