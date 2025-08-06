export type Severity = 'ERROR' | 'WARN';

export interface ValidationIssue {
  code: string;      // e.g. UNIT_MISMATCH, RANGE_OUTLIER
  severity: Severity;
  message: string;
  path: string;      // JSON‑path до поля
}

export function validateUnits(payload: any): ValidationIssue[] { return []; }
export function validateRanges(payload: any): ValidationIssue[] { return []; }
export function validateCompleteness(payload: any): ValidationIssue[] { return []; }
export function validateSourceLevels(payload: any): ValidationIssue[] { return []; }
export function validateAnomalies(payload: any): ValidationIssue[] { return []; }

export function runAllValidations(payload: any): { issues: ValidationIssue[], blocking: boolean } {
  const issues = [
    ...validateCompleteness(payload),
    ...validateUnits(payload),
    ...validateRanges(payload),
    ...validateSourceLevels(payload),
    ...validateAnomalies(payload),
  ];
  const blocking = issues.some(i => i.severity === 'ERROR');
  return { issues, blocking };
}
