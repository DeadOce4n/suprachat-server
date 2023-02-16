import { configDefaults, defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    coverage: {
      exclude: [
        ...(configDefaults.coverage.exclude as string[]),
        'src/**/test/utils/*'
      ]
    }
  }
})
