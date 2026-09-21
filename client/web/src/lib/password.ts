export interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+~`|}{[]:;?><,./-=';

export const generatePassword = (options: PasswordOptions): string => {
  let charset = '';
  if (options.uppercase) charset += UPPERCASE;
  if (options.lowercase) charset += LOWERCASE;
  if (options.numbers) charset += NUMBERS;
  if (options.symbols) charset += SYMBOLS;

  if (charset === '') {
    // Fallback if user unchecks all options
    charset = LOWERCASE + NUMBERS;
  }

  const randomValues = new Uint32Array(options.length);
  crypto.getRandomValues(randomValues);

  let password = '';
  for (let i = 0; i < options.length; i++) {
    password += charset[randomValues[i] % charset.length];
  }

  return password;
};