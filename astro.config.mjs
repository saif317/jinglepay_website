// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'url';

import sitemap from '@astrojs/sitemap';

import mdx from '@astrojs/mdx';

import expressiveCode from 'astro-expressive-code';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@helpers': fileURLToPath(new URL('./src/helpers', import.meta.url)),
        '@util': fileURLToPath(new URL('./src/util', import.meta.url)),
        '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      },
    },
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
    // Specific redirects as provided by user
    '/homepage/AE/terms-and-conditions/faq/': {
      status: 301,
      destination: '/are/en/terms-and-conditions/faq/',
    },
    '/homepage/AE/terms-and-conditions/privacy-policy/': {
      status: 301,
      destination: '/are/en/terms-and-conditions/privacy-policy/',
    },
    '/homepage/AE/terms-and-conditions/joining-offer/': {
      status: 301,
      destination: '/are/en/terms-and-conditions/joining-offer/',
    },
    '/homepage/AE/terms-and-conditions/jp-tac/': {
      status: 301,
      destination: '/are/en/terms-and-conditions/jp-tac/',
    },
    '/fraud-warnings/': {
      status: 301,
      destination: '/are/en/terms-and-conditions/mg-fraud-warning/',
    },
    '/30aed_campaign_nov22/': {
      status: 301,
      destination: '/are/en/terms-and-conditions/joining-offer/',
    },
    '/address-update-policy/': {
      status: 301,
      destination: '/are/en/terms-and-conditions/address-update-policy/',
    },
    // General paths for the homepage
    '/homepage/AE/terms-and-conditions/': {
      status: 301,
      destination: '/are/en/terms-and-conditions/',
    },
    '/homepage/AE/': {
      status: 301,
      destination: '/are/en/',
    },
    // General catch-all redirect for any homepage links
    '/homepage/AE': {
      status: 301,
      destination: '/are/en/',
    },
  },
});
