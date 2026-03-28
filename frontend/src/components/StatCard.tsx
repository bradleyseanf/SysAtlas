import { CCard, CCardBody } from "@coreui/react";

type StatCardProps = {
  label: string;
  value: string | number;
  caption: string;
};

export function StatCard({ label, value, caption }: StatCardProps) {
  return (
    <CCard className="h-100 shadow-sm">
      <CCardBody>
        <p className="mb-2 small fw-semibold text-body-secondary text-uppercase">{label}</p>
        <p className="mb-2 fs-2 fw-semibold">{value}</p>
        <p className="mb-0 text-body-secondary">{caption}</p>
      </CCardBody>
    </CCard>
  );
}
