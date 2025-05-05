// base-url-plugin.ts
import type { Plugin } from 'vite';

export function baseUrlPlugin(): Plugin {
  return {
    name: 'base-url-plugin',
    transformIndexHtml(html, { server }) {
      const base = process.env.GITHUB_PAGES === 'true' ? '/ADHDplanner/' : '/';
      return html.replace(/<%= BASE_URL %>/g, base);
    }
  };
}