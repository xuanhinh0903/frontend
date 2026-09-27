const priceFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const changeFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: 'exceptZero',
})

export function formatPrice(value: number) {
  return priceFormatter.format(value)
}

export function formatChange(value: number) {
  return changeFormatter.format(value)
}
