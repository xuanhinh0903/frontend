const SYMBOL_PATTERN = /^[A-Z0-9.]{1,10}$/

export function normalizeSymbol(input: string): string | null {
  const symbol = input.trim().toUpperCase()
  return SYMBOL_PATTERN.test(symbol) ? symbol : null
}
