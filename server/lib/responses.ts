export function success<T>(data: T) {
  return { success: true as const, data };
}

export function failure(code: string, msg: string) {
  return { success: false as const, error: { code, msg } };
}
