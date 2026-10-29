import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base './' = chemins relatifs : le même build marche sur GitHub Pages
// (https://user.github.io/repo/) et sur Netlify, grâce au HashRouter.
// Pour forcer un chemin absolu : BASE_PATH=/mon-repo/ npm run build
export default defineConfig({
  base: process.env.BASE_PATH || './',
  plugins: [react(), tailwindcss()],
})
