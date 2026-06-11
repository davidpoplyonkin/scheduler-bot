import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    svgr(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  define: {
    // This captures the exact time 'npm run build' is executed
    __BUILD_TIME__: JSON.stringify(Date.now()),
  },
})
