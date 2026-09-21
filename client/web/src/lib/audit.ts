import { VaultItem, LoginItem } from './store';

export interface AuditResult {
  totalLogins: number;
  weakPasswords: LoginItem[];
  reusedPasswords: LoginItem[];
  oldPasswords: LoginItem[];
}

const isWeakPassword = (password: string): boolean => {
  if (password.length < 8) return true;
  
  let strength = 0;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  
  return strength < 3;
};

export const runSecurityAudit = (items: VaultItem[]): AuditResult => {
  const logins = items.filter((item): item is LoginItem => item.type === 'login' && !!item.password);
  
  const weakPasswords: LoginItem[] = [];
  const oldPasswords: LoginItem[] = [];
  
  // Track password frequencies for reuse detection
  const passwordCounts = new Map<string, number>();
  
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  logins.forEach(login => {
    const pwd = login.password!;
    
    // Check weak
    if (isWeakPassword(pwd)) {
      weakPasswords.push(login);
    }
    
    // Check old
    const updated = new Date(login.updatedAt);
    if (updated < ninetyDaysAgo) {
      oldPasswords.push(login);
    }
    
    // Count for reuse
    passwordCounts.set(pwd, (passwordCounts.get(pwd) || 0) + 1);
  });

  // Find reused
  const reusedPasswords = logins.filter(login => passwordCounts.get(login.password!)! > 1);

  return {
    totalLogins: logins.length,
    weakPasswords,
    reusedPasswords,
    oldPasswords,
  };
};