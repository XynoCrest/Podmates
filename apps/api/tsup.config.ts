import { defineConfig } from 'tsup'

// Workspace packages ship TypeScript source, so they are bundled into dist;
// npm dependencies stay external and are installed in the image.
export default defineConfig({
  entry: ['src/index.ts', 'src/scripts/settle.ts'],
  format: ['esm'],
  target: 'node22',
  platform: 'node',
  clean: true,
  noExternal: [/^@podmates\//],
})
