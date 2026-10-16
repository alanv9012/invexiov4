import { redirect } from "next/navigation";

export default function SignupPage() {
  redirect("/login?message=Accounts%20are%20invitation-only");
}
