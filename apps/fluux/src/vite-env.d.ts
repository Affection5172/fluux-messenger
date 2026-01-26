/// <reference types="vite/client" />

// Build-time injected constants
declare const __APP_VERSION__: string
declare const __GIT_COMMIT__: string

// Environment variables (VITE_* prefix)
interface ImportMetaEnv {
  readonly VITE_SHOW_LOGO?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
