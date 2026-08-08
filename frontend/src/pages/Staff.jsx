import React from "react";
import CrudTable, { statusBadge } from "@/components/CrudTable";
import { PageHeader, inr } from "@/components/Shared";

export default function Staff() {
  return (
    <div>
      <PageHeader title="Staff" subtitle="Office & support staff — payroll ready." testId="staff-header" />
      <CrudTable
        endpoint="staff"
        title="Staff"
        testIdPrefix="staff"
        initial={{ status: "active" }}
        fields={[
          { key: "name", label: "Name", required: true },
          { key: "role", label: "Role", required: true },
          { key: "phone", label: "Phone" },
          { key: "salary", label: "Salary (₹)", type: "number" },
          { key: "joining_date", label: "Joining Date", type: "date" },
          { key: "status", label: "Status", type: "select", options: ["active", "inactive"] },
        ]}
        columns={[
          { key: "name", label: "Name" },
          { key: "role", label: "Role" },
          { key: "phone", label: "Phone" },
          { key: "salary", label: "Salary", render: inr },
          { key: "joining_date", label: "Joined" },
          { key: "status", label: "Status", render: statusBadge },
        ]}
      />
    </div>
  );
}
