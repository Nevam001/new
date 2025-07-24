import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        tracking: 'rastreamento.html',
        obrigado: 'obrigado.html'
      }
    }
  },
  define: {
    global: 'globalThis',
  }
})