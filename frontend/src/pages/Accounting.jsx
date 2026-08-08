import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { PageHeader, StatTile, inr } from "@/components/Shared";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Accounting() {
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [month, setMonth] = useState(defaultMonth);
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/accounting/${month}`).then(r => setData(r.data));
  }, [month]);

  if (!data) return <div className="text-sm text-muted-foreground">Loading…</div>;

  const Row = ({ k, v, bold }) => (
    <TableRow className={bold ? "font-bold border-t border-border" : ""}>
      <TableCell className="text-sm">{k}</TableCell>
      <TableCell className="text-right font-mono-tab">{inr(v)}</TableCell>
    </TableRow>
  );

  return (
    <div>
      <PageHeader
        title="Monthly Accounting"
        subtitle="Full P&L: Trip revenue, contracts, other income vs fuel, maintenance, tolls, salaries."
        testId="accounting-header"
        action={
          <div>
            <Label htmlFor="month" className="text-xs">Month</Label>
            <Input id="month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} data-testid="accounting-month-input" />
          </div>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatTile testId="stat-income" label="Total Income" value={inr(data.income.total)} />
        <StatTile testId="stat-expense" label="Total Expense" value={inr(data.expense.total)} accent="secondary" />
        <StatTile testId="stat-profit" label="Net Profit" value={inr(data.profit)} sub={data.profit >= 0 ? "In the black" : "In the red"} />
        <StatTile testId="stat-margin" label="Margin" value={`${data.income.total ? ((data.profit / data.income.total) * 100).toFixed(1) : 0}%`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="border border-border bg-card rounded-md p-6">
          <div className="text-[11px] font-mono-tab text-primary uppercase tracking-widest mb-3">Income</div>
          <Table>
            <TableBody>
              <Row k="Trip Revenue" v={data.income.trip_revenue} />
              <Row k="Contract Payments" v={data.income.contract_payments} />
              <Row k="Other Income" v={data.income.other_income} />
              <Row k="Total Income" v={data.income.total} bold />
            </TableBody>
          </Table>
        </div>
        <div className="border border-border bg-card rounded-md p-6">
          <div className="text-[11px] font-mono-tab text-primary uppercase tracking-widest mb-3">Expenses</div>
          <Table>
            <TableBody>
              <Row k="Fuel" v={data.expense.fuel} />
              <Row k="Maintenance" v={data.expense.maintenance} />
              <Row k="Toll (FASTag)" v={data.expense.toll} />
              <Row k="Driver Salaries" v={data.expense.driver_salaries} />
              <Row k="Staff Salaries" v={data.expense.staff_salaries} />
              <Row k="Contract Investment" v={data.expense.contract_investment} />
              <Row k="Other Expenses" v={data.expense.other_expenses} />
              <Row k="Total Expense" v={data.expense.total} bold />
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
