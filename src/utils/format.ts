export function formatSuccess(message: string): void {
  console.log(`✓ ${message}`);
}

export function formatError(message: string, error?: unknown): void {
  if (error) console.error(`✗ ${message}`, error);
  else console.error(`✗ ${message}`);
}

export function formatInfo(message: string): void {
  console.log(`  ${message}`);
}

export function formatStatus(label: string, value: string | boolean | number): void {
  console.log(`  ${label}: ${value}`);
}
