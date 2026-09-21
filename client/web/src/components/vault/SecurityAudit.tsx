import { useMemo } from "react";
import { useVaultStore } from "@/lib/store";
import { runSecurityAudit } from "@/lib/audit";
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
    <div className="mb-2 border-none bg-transparent">
      <div className="px-2 pb-3">
        <h3 className="text-lg font-semibold flex items-center text-slate-900 dark:text-white tracking-tight">
          {isSecure ? (
            <ShieldCheck className="w-5 h-5 text-emerald-500 mr-2" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-amber-500 mr-2" />
          )}
          Security Audit
        </h3>
      </div>
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-2">
          <div
            className={`p-4 rounded-xl flex items-center justify-between shadow-sm border ${audit.weakPasswords.length > 0 ? "bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400" : "bg-white/50 dark:bg-neutral-800/30 border-slate-200/50 dark:border-neutral-800/50 text-slate-600 dark:text-slate-400 backdrop-blur-sm"}`}
          >
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-3 opacity-70" />
              <span className="text-sm font-medium">Weak Passwords</span>
            </div>
            <span className="text-lg font-bold">
              {audit.weakPasswords.length}
            </span>
          </div>

          <div
            className={`p-4 rounded-xl flex items-center justify-between shadow-sm border ${audit.reusedPasswords.length > 0 ? "bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400" : "bg-white/50 dark:bg-neutral-800/30 border-slate-200/50 dark:border-neutral-800/50 text-slate-600 dark:text-slate-400 backdrop-blur-sm"}`}
          >
            <div className="flex items-center">
              <ShieldAlert className="w-5 h-5 mr-3 opacity-70" />
              <span className="text-sm font-medium">Reused Passwords</span>
            </div>
            <span className="text-lg font-bold">
              {audit.reusedPasswords.length}
            </span>
          </div>

          <div
            className={`p-4 rounded-xl flex items-center justify-between shadow-sm border ${audit.oldPasswords.length > 0 ? "bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30 text-blue-700 dark:text-blue-400" : "bg-white/50 dark:bg-neutral-800/30 border-slate-200/50 dark:border-neutral-800/50 text-slate-600 dark:text-slate-400 backdrop-blur-sm"}`}
          >
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-3 opacity-70" />
              <span className="text-sm font-medium">
                Old Passwords (&gt;90d)
              </span>
            </div>
            <span className="text-lg font-bold">
              {audit.oldPasswords.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
