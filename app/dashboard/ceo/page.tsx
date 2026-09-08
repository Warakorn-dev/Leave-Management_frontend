import { redirect } from "next/navigation";

export default function CeoRedirect() {
  redirect("/dashboard/ceo/dashboard");
}
