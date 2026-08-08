import React from "react";
import CrudTable, { statusBadge } from "@/components/CrudTable";
import { PageHeader, inr } from "@/components/Shared";

export default function Drivers() {
  return (
    <div>
      <PageHeader title="Drivers" subtitle="Driver master — licenses, assignments, salaries." testId="drivers-header" />
      <CrudTable
        endpoint="drivers"
        title="Driver"
        testIdPrefix="drivers"
        initial={{ status: "active" }}
        fields={[
          { key: "name", label: "Full Name", required: true },
          { key: "phone", label: "Phone" },
          { key: "license_number", label: "License #" },
          { key: "license_expiry", label: "License Expiry", type: "date" },
          { key: "salary", label: "Monthly Salary (₹)", type: "number" },
          { key: "status", label: "Status", type: "select", options: ["active", "inactive"] },
          { key: "address", label: "Address", type: "textarea", full: true },
        ]}
        columns={[
          { key: "name", label: "Name", render: (v) => <span className="font-medium">{v}</span> },
          { key: "phone", label: "Phone" },
          { key: "license_number", label: "License" },
          { key: "license_expiry", label: "License Expiry" },
          { key: "salary", label: "Salary", render: inr },
          { key: "status", label: "Status", render: statusBadge },
        ]}
      />
    </div>
  );
}
