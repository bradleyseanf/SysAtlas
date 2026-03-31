/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FORCE_STATIC_DEMO?: string;
}

declare module "*.lottie" {
  const src: string;
  export default src;
}
