import { configDefaults, defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    coverage: {
      provider: 'v8',
      exclude: [
        ...(configDefaults.coverage.exclude as string[]),
        'src/**/test/utils/*'
      ],
      reporter: ['text', 'cobertura']
    },
    reporters: ['default', 'junit'],
    outputFile: './coverage/junit.xml',
    setupFiles: ['dotenv/config']
  }
})
