import { Suspense } from "react";
import { UnlockPage } from "@/views/unlock";

export const metadata = {
  title: "Unlock Vault",
  description: "Enter your master password to unlock your vault.",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <UnlockPage />
    </Suspense>
  );
}
