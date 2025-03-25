// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

import mdx from '@astrojs/mdx';

import expressiveCode from 'astro-expressive-code';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },

  site: 'https://jinglepay.com/PK',
  integrations: [sitemap(), expressiveCode(), mdx()],

  i18n: {
    defaultLocale: 'pak-en',
    locales: ['pak-en', 'pak-ur', 'uae-en', 'uae-ar'],
    routing: 'manual',
  },
});
