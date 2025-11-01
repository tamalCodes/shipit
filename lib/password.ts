export type PasswordRequirement = {
  id: string;
  label: string;
  validate: (value: string) => boolean;
};

export type PasswordCheck = {
  id: string;
  label: string;
  met: boolean;
};

export const MIN_PASSWORD_LENGTH = 8;

export const passwordRequirements: PasswordRequirement[] = [
  {
    id: "length",
    label: `At least ${MIN_PASSWORD_LENGTH} characters`,
    validate: (value) => value.length >= MIN_PASSWORD_LENGTH,
  },
  {
    id: "uppercase",
    label: "Contains an uppercase letter",
    validate: (value) => /[A-Z]/.test(value),
  },
  {
    id: "lowercase",
    label: "Contains a lowercase letter",
    validate: (value) => /[a-z]/.test(value),
  },
  {
    id: "number",
    label: "Contains a number",
    validate: (value) => /\d/.test(value),
  },
  {
    id: "symbol",
    label: "Contains a symbol",
    validate: (value) => /[^a-zA-Z0-9]/.test(value),
  },
];

export function evaluatePassword(password: string): PasswordCheck[] {
  return passwordRequirements.map((requirement) => ({
    id: requirement.id,
    label: requirement.label,
    met: requirement.validate(password),
  }));
}

export function isPasswordStrong(password: string): boolean {
  return evaluatePassword(password).every((requirement) => requirement.met);
}
