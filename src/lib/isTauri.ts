export const isTauri = () => {
  return typeof window !== 'undefined' && 
    ('__TAURI_INTERNALS__' in window || '__TAURI_IPC__' in window || '__TAURI__' in window);
};
