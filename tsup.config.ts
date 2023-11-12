import { defineConfig } from 'tsup';

export default defineConfig({
  loader: {
    '.html': 'copy',
  },
});
