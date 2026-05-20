import { Alert, type AlertVariant } from "@/components/ui/alert";

type ActionFeedbackProps = {
  status: "idle" | "success" | "warning" | "error";
  message: string | null;
};

function statusToVariant(status: ActionFeedbackProps["status"]): AlertVariant | null {
  if (status === "success") return "success";
  if (status === "warning") return "warning";
  if (status === "error") return "danger";
  return null;
}

export function ActionFeedback({ status, message }: ActionFeedbackProps) {
  const variant = statusToVariant(status);
  if (!variant || !message) return null;
  return <Alert variant={variant}>{message}</Alert>;
}
