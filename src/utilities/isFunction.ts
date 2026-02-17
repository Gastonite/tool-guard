


// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type -- Zod custom validator for runtime JS validation
export const isFunction = (value: unknown): value is Function => typeof value === 'function'
