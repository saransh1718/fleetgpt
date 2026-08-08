import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/Shared";

/**
 * Generic CRUD table.
 * fields = [{key,label,type,options?,required?,step?}]
 * columns = [{key,label,render?(value,row)}]
 */
export default function CrudTable({ endpoint, title, fields, columns, initial = {}, testIdPrefix }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/${endpoint}`);
      setRows(data);
    } catch (e) { toast.error(`Failed to load ${title}`); }
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const startAdd = () => { setEditing(null); setForm({ ...initial }); setOpen(true); };
  const startEdit = (row) => { setEditing(row); setForm({ ...row }); setOpen(true); };

  const submit = async () => {
    try {
      const payload = { ...form };
      // coerce numbers
      fields.forEach((f) => {
        if (f.type === "number" && payload[f.key] !== undefined && payload[f.key] !== "") {
          payload[f.key] = Number(payload[f.key]);
        }
      });
      if (editing) await api.put(`/${endpoint}/${editing.id}`, payload);
      else await api.post(`/${endpoint}`, payload);
      toast.success(editing ? "Updated" : "Created");
      setOpen(false); load();
    } catch (e) { toast.error(e?.response?.data?.detail || "Save failed"); }
  };

  const del = async (row) => {
    if (!window.confirm("Delete this record?")) return;
    await api.delete(`/${endpoint}/${row.id}`);
    toast.success("Deleted");
    load();
  };

  const filtered = q ? rows.filter(r => JSON.stringify(r).toLowerCase().includes(q.toLowerCase())) : rows;

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${title}...`} className="pl-9" data-testid={`${testIdPrefix}-search`} />
        </div>
        <Button onClick={startAdd} data-testid={`${testIdPrefix}-add-btn`}><Plus className="w-4 h-4 mr-2" /> Add {title}</Button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={`No ${title.toLowerCase()} yet`}
          description={`Add your first ${title.toLowerCase()} to get started.`}
          cta={<Button onClick={startAdd} data-testid={`${testIdPrefix}-empty-add-btn`}><Plus className="w-4 h-4 mr-2" /> Add {title}</Button>}
          testId={`${testIdPrefix}-empty`}
        />
      ) : (
        <div className="border border-border rounded-md overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {columns.map((c) => <TableHead key={c.key} className="text-[11px] uppercase tracking-widest font-mono-tab">{c.label}</TableHead>)}
                <TableHead className="w-24 text-right text-[11px] uppercase tracking-widest font-mono-tab">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id} data-testid={`${testIdPrefix}-row-${r.id}`} className="hover:bg-muted/30">
                  {columns.map((c) => (
                    <TableCell key={c.key} className="align-top py-3">
                      {c.render ? c.render(r[c.key], r) : (r[c.key] ?? "—")}
                    </TableCell>
                  ))}
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(r)} data-testid={`${testIdPrefix}-edit-${r.id}`}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => del(r)} data-testid={`${testIdPrefix}-delete-${r.id}`}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit" : "Add"} {title}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map((f) => (
              <div key={f.key} className={f.full ? "sm:col-span-2" : ""}>
                <Label htmlFor={f.key} className="text-xs">{f.label}{f.required && " *"}</Label>
                {f.type === "select" ? (
                  <Select value={form[f.key] ?? ""} onValueChange={(v) => setForm({ ...form, [f.key]: v })}>
                    <SelectTrigger id={f.key} data-testid={`${testIdPrefix}-field-${f.key}`}><SelectValue placeholder={`Select ${f.label}`} /></SelectTrigger>
                    <SelectContent>
                      {f.options.map((o) => (
                        <SelectItem key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>
                          {typeof o === "string" ? o : o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : f.type === "textarea" ? (
                  <Textarea id={f.key} value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} data-testid={`${testIdPrefix}-field-${f.key}`} />
                ) : (
                  <Input id={f.key} type={f.type || "text"} step={f.step} value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} data-testid={`${testIdPrefix}-field-${f.key}`} />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} data-testid={`${testIdPrefix}-cancel-btn`}>Cancel</Button>
            <Button onClick={submit} data-testid={`${testIdPrefix}-save-btn`}>{editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function statusBadge(s) {
  const map = {
    active: "bg-green-500/15 text-green-500 border-green-500/30",
    idle: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
    delivered: "bg-green-500/15 text-green-500 border-green-500/30",
    in_transit: "bg-blue-500/15 text-blue-500 border-blue-500/30",
    planned: "bg-muted text-muted-foreground border-border",
    cancelled: "bg-red-500/15 text-red-500 border-red-500/30",
    paid: "bg-green-500/15 text-green-500 border-green-500/30",
    overdue: "bg-red-500/15 text-red-500 border-red-500/30",
    partial: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
    sent: "bg-blue-500/15 text-blue-500 border-blue-500/30",
    draft: "bg-muted text-muted-foreground border-border",
    in_maintenance: "bg-orange-500/15 text-orange-500 border-orange-500/30",
    retired: "bg-muted text-muted-foreground border-border",
    inactive: "bg-muted text-muted-foreground border-border",
  };
  return <Badge variant="outline" className={`uppercase text-[10px] tracking-wider ${map[s] || ""}`}>{s || "—"}</Badge>;
}
