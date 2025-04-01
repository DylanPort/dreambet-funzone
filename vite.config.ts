
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'path'
import { componentTagger } from "lovable-tagger"

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      // Define Babel configuration inline to avoid require cycles
      babel: {
        babelrc: false,
        configFile: false, // Don't use external config file
        presets: [
          ['@babel/preset-env', {
            targets: { 
              browsers: [
                'last 2 versions',
                '> 1%',
                'not dead'
              ]
            }
          }],
          ['@babel/preset-react', {
            runtime: 'automatic'
          }],
          '@babel/preset-typescript'
        ]
      }
    }),
    mode === 'development' && componentTagger(),
    nodePolyfills({
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
      // Whether to polyfill specific globals.
      globals: {
        process: true,
        Buffer: true,
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: "::",
    port: 8080
  }
}))
