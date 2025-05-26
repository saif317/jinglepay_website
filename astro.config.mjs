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

  site: 'https://jinglepay.com/',
  integrations: [sitemap(), expressiveCode(), mdx()],

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ur', 'ar'],
    routing: 'manual',
  },

  redirects: {
    '/homepage': {
      status: 302,
      destination: '/?redirect_fix=1',
    },
    '/homepage/AE/terms-and-conditions/privacy-policy/': {
      status: 301,
      destination: '/are/en/terms-and-conditions/privacy-policy/',
    },
  },
});
