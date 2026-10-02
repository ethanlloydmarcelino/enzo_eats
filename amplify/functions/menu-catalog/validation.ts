export const validateMenu = (input: Record<string, unknown>) => {
  const str = (key: string, max: number, required = false) => {
    const value = input[key] ?? ''
    if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim()))
      throw new Error('INVALID_' + key.toUpperCase())
    return value.trim()
  }
  const price = input.price
  if (
    typeof price !== 'number' ||
    !Number.isFinite(price) ||
    price <= 0 ||
    price > 100000 ||
    Math.abs(price * 100 - Math.round(price * 100)) > 0.000001
  )
    throw new Error('INVALID_PRICE')
  if (!['food', 'drink'].includes(String(input.category))) throw new Error('INVALID_CATEGORY')
  if (typeof input.visible !== 'boolean' || typeof input.available !== 'boolean')
    throw new Error('INVALID_VISIBILITY')
  const options = input.options ?? []
  if (
    !Array.isArray(options) ||
    options.length > 20 ||
    options.some((option) => typeof option !== 'string' || !option.trim() || option.length > 60)
  )
    throw new Error('INVALID_OPTIONS')
  const cleaned = options.map((option: string) => option.trim())
  if (
    new Set(cleaned.map((option: string) => option.toLowerCase().replace(/\s+/g, '-'))).size !==
    cleaned.length
  )
    throw new Error('DUPLICATE_OPTIONS')
  return {
    name: str('name', 100, true),
    nameTl: str('nameTl', 100),
    description: str('description', 1200),
    descriptionTl: str('descriptionTl', 1200),
    price,
    category: String(input.category),
    visible: input.visible,
    available: input.available,
    options: cleaned,
    imageAssetId: str('imageAssetId', 100) || null,
  }
}
