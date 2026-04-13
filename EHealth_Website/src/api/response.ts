export function unwrap<T>(res: any): T {
  return res?.data?.data ?? res?.data ?? res;
}

export function unwrapList<T>(res: any): { data: T[]; pagination?: any } {
  const raw = res?.data?.data ?? res?.data?.items ?? res?.data ?? [];
  const pagination = res?.data?.pagination ?? res?.pagination;
  return { data: Array.isArray(raw) ? raw : [], pagination };
}

export function extractErrorMessage(error: any): string {
  return error?.response?.data?.message
    ?? error?.response?.data?.error
    ?? error?.message
    ?? "Có lỗi không xác định xảy ra";
}
