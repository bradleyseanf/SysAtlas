import { CButton, CCard, CCardBody } from "@coreui/react";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
};

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <CCard className="shadow-sm border-2" style={{ borderStyle: "dashed" }}>
      <CCardBody className="px-4 py-5 text-center">
        <p className="mb-3 small fw-semibold text-body-secondary text-uppercase">No Data Available</p>
        <h2 className="h4 mb-3">{title}</h2>
        <p className="mx-auto mb-0 text-body-secondary" style={{ maxWidth: "42rem" }}>
          {description}
        </p>
        <div className="mt-4">
          <CButton onClick={onAction}>{actionLabel}</CButton>
        </div>
      </CCardBody>
    </CCard>
  );
}
