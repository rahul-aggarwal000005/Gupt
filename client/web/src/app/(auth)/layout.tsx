import { GoogleAuthProvider } from "@/components/auth/google-oauth-provider";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GoogleAuthProvider>{children}</GoogleAuthProvider>;
}
