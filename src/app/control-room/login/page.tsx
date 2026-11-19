import type { Metadata } from "next";
import { LoginForm } from "@/components/control-room/shell/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return <LoginForm />;
}
