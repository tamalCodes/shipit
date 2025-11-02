export const GENERIC_EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "aol.com",
  "icloud.com",
  "hotmail.com",
  "protonmail.com",
  "mail.com",
  "yandex.com",
  "gmx.com",
  "live.com",
  "zoho.com",
  "comcast.net",
  "att.net",
  "verizon.net",
  "fastmail.com",
  "rediffmail.com",
  "mail.ru",
  "qq.com",
  "sina.com",
];

export function extractEmailDomain(email: string): string | null {
  const parts = email.trim().toLowerCase().split("@");
  if (parts.length !== 2) {
    return null;
  }
  return parts[1] ?? null;
}

export function isGenericEmail(email: string): boolean {
  const domain = extractEmailDomain(email);

  if (!domain) {
    return true;
  }

  return GENERIC_EMAIL_DOMAINS.includes(domain);
}
