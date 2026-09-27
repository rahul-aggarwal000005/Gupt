import { SetupPage } from "@/views/setup";

export const metadata = {
  title: "Setup Vault",
  description: "Set up your master password to initialize your encrypted vault.",
};

export default function Page() {
  return <SetupPage />;
}
