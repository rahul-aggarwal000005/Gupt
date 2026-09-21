import { useMemo } from "react";
import { useVaultStore } from "@/lib/store";
import { runSecurityAudit } from "@/lib/audit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, ShieldCheck, AlertTriangle, Clock } from "lucide-react";

export function SecurityAudit() {
  const vaultData = useVaultStore((state) => state.vaultData);

  const audit = useMemo(() => {
    if (!vaultData) return null;
    return runSecurityAudit(vaultData.items);
  }, [vaultData]);

  if (!audit || audit.totalLogins === 0) {
    return null;
  }

  const isSecure =
    audit.weakPasswords.length === 0 && audit.reusedPasswords.length === 0;

  return (
    <Card className="mb-6 border-neutral-200 dark:border-neutral-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          {isSecure ? (
            <ShieldCheck className="w-5 h-5 text-green-500 mr-2" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-amber-500 mr-2" />
          )}
          Security Audit
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className={`p-3 rounded-lg flex items-center justify-between ${audit.weakPasswords.length > 0 ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400" : "bg-neutral-50 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400"}`}
          >
            <div className="flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Weak Passwords</span>
            </div>
            <span className="font-bold">{audit.weakPasswords.length}</span>
          </div>

          <div
            className={`p-3 rounded-lg flex items-center justify-between ${audit.reusedPasswords.length > 0 ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400" : "bg-neutral-50 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400"}`}
          >
            <div className="flex items-center">
              <ShieldAlert className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Reused Passwords</span>
            </div>
            <span className="font-bold">{audit.reusedPasswords.length}</span>
          </div>

          <div
            className={`p-3 rounded-lg flex items-center justify-between ${audit.oldPasswords.length > 0 ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" : "bg-neutral-50 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400"}`}
          >
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">
                Old Passwords (&gt;90d)
              </span>
            </div>
            <span className="font-bold">{audit.oldPasswords.length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
