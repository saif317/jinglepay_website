interface ImportMetaEnv {
  // Add other environment variables here as you create them
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    lang: string;
    country: string | null;
    translations: Record<string, any>;
  }
}
