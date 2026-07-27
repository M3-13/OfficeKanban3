export function useNotifications() {
  return {
    success: (_msg: string) => {},
    error: (_msg: string) => {},
    info: (_msg: string) => {},
  };
}
