import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { PageHeader, StatTile, inr } from "@/components/Shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { statusBadge } from "@/components/CrudTable";

export default function Invoices() {
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [aging, setAging] = useState({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ items: [{ description: "", quantity: 1, rate: 0, amount: 0 }], gst_rate: 5, interstate: false });

  const load = () => {
    api.get("/invoices").then(r => setRows(r.data));
    api.get("/invoices/aging/report").then(r => setAging(r.data));
  };
  useEffect(() => {
    load();
    api.get("/customers").then(r => setCustomers(r.data));
  }, []);

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { description: "", quantity: 1, rate: 0, amount: 0 }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, k, v) => {
    setForm(f => {
      const items = [...f.items];
      items[i] = { ...items[i], [k]: v };
      if (k === "quantity" || k === "rate") items[i].amount = Number(items[i].quantity || 0) * Number(items[i].rate || 0);
      return { ...f, items };
    });
  };
  const subtotal = form.items.reduce((s, i) => s + Number(i.amount || 0), 0);

  const submit = async () => {
    try {
      const payload = { ...form, customer_id: form.customer_id, issue_date: form.issue_date, due_date: form.due_date, gst_rate: Number(form.gst_rate), interstate: !!form.interstate };
      await api.post("/invoices", payload);
      toast.success("Invoice created");
      setOpen(false); setForm({ items: [{ description: "", quantity: 1, rate: 0, amount: 0 }], gst_rate: 5, interstate: false });
      load();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };

  const del = async (id) => {
    if (!window.confirm("Delete?")) return;
    await api.delete(`/invoices/${id}`);
    load();
  };

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="GST-compliant invoicing with receivables aging."
        testId="invoices-header"
        action={<Button onClick={() => setOpen(true)} data-testid="invoice-create-btn"><Plus className="w-4 h-4 mr-2" /> New Invoice</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {["current", "30", "60", "90", "90+"].map(k => (
          <StatTile key={k} testId={`aging-${k}`} label={k === "current" ? "Current" : `${k} days`} value={inr(aging[k] || 0)} />
        ))}
      </div>

      <div className="border border-border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead><TableHead>Customer</TableHead><TableHead>Issue</TableHead>
              <TableHead>Due</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.id} data-testid={`invoice-row-${r.id}`}>
                <TableCell className="font-mono-tab text-primary text-xs">{r.invoice_number}</TableCell>
                <TableCell>{customers.find(c => c.id === r.customer_id)?.name || "—"}</TableCell>
                <TableCell>{r.issue_date}</TableCell>
                <TableCell>{r.due_date}</TableCell>
                <TableCell className="font-mono-tab">{inr(r.total)}</TableCell>
                <TableCell>{statusBadge(r.status)}</TableCell>
                <TableCell><Button size="icon" variant="ghost" onClick={() => del(r.id)} data-testid={`invoice-delete-${r.id}`}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No invoices yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Invoice</DialogTitle><DialogDescription>Add line items — GST computes automatically based on interstate flag.</DialogDescription></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Customer</Label>
              <Select value={form.customer_id ?? ""} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
                <SelectTrigger data-testid="invoice-customer-select"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">GST Rate (%)</Label>
              <Input type="number" value={form.gst_rate} onChange={(e) => setForm({ ...form, gst_rate: e.target.value })} data-testid="invoice-gst-input" />
            </div>
            <div>
              <Label className="text-xs">Issue Date</Label>
              <Input type="date" value={form.issue_date ?? ""} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} data-testid="invoice-issue-input" />
            </div>
            <div>
              <Label className="text-xs">Due Date</Label>
              <Input type="date" value={form.due_date ?? ""} onChange={(e) => setForm({ ...form, due_date: e.target.value })} data-testid="invoice-due-input" />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="inter" checked={!!form.interstate} onChange={(e) => setForm({ ...form, interstate: e.target.checked })} data-testid="invoice-interstate-checkbox" />
              <Label htmlFor="inter" className="text-xs">Inter-state (IGST)</Label>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-[11px] font-mono-tab uppercase tracking-widest text-muted-foreground mb-2">Items</div>
            {form.items.map((it, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 mb-2">
                <Input className="col-span-6" placeholder="Description" value={it.description} onChange={(e) => updateItem(i, "description", e.target.value)} data-testid={`invoice-item-desc-${i}`} />
                <Input className="col-span-2" type="number" placeholder="Qty" value={it.quantity} onChange={(e) => updateItem(i, "quantity", e.target.value)} data-testid={`invoice-item-qty-${i}`} />
                <Input className="col-span-2" type="number" placeholder="Rate" value={it.rate} onChange={(e) => updateItem(i, "rate", e.target.value)} data-testid={`invoice-item-rate-${i}`} />
                <div className="col-span-1 flex items-center justify-end font-mono-tab text-sm">{inr(it.amount)}</div>
                <Button size="icon" variant="ghost" onClick={() => removeItem(i)} className="col-span-1" data-testid={`invoice-item-del-${i}`}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            ))}
            <Button variant="outline" onClick={addItem} size="sm" data-testid="invoice-add-item-btn"><Plus className="w-3 h-3 mr-1" /> Add line</Button>
            <div className="mt-3 text-right font-mono-tab">Subtotal: {inr(subtotal)}</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} data-testid="invoice-save-btn">Create Invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
