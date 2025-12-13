import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync } from 'fs'
import { resolve } from 'path'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(() => {
  // Load env file from .env
  const env = loadEnv('', process.cwd(), '')
  
  return {
    plugins: [
      react(),
      // Custom plugin to generate riot.txt
      {
        name: 'generate-riot-txt',
        buildStart() {
          // Get the Riot key from loaded environment
          const riotKey = env.VITE_RIOT_KEY || env.RIOT_KEY || '';
          const riotFilePath = resolve(__dirname, 'public', 'riot.txt');
          
          try {
            console.log('🔍 Environment variables loaded:');
            console.log('📋 VITE_RIOT_KEY:', env.VITE_RIOT_KEY ? 'Found' : 'Not found');
            console.log('📋 RIOT_KEY:', env.RIOT_KEY ? 'Found' : 'Not found');
            console.log('📋 All VITE_ vars:', Object.keys(env).filter(key => key.startsWith('VITE_')));
            
            if (!riotKey) {
              console.warn('⚠️  No Riot key found in environment variables');
              console.warn('💡 Make sure VITE_RIOT_KEY is set in your .env file');
            }
            
            writeFileSync(riotFilePath, riotKey);
            console.log('✅ riot.txt generated successfully');
            console.log('📝 Key length:', riotKey.length, 'characters');
            console.log('🔑 Key preview:', riotKey ? `${riotKey.substring(0, 8)}...` : 'EMPTY');
            console.log('📁 File path:', riotFilePath);
          } catch (error) {
            console.error('❌ Error generating riot.txt:', error);
          }
        }
      }
    ],
    build: {
      // Enable code splitting and optimize chunk size
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunk for React and related libraries
            vendor: ['react', 'react-dom', 'react-router-dom'],
            // Supabase chunk
            supabase: ['@supabase/supabase-js'],
            ui: ['lucide-react', 'react-hot-toast']
          }
        }
      },
      // Optimize chunk size
      chunkSizeWarningLimit: 1000
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js']
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
})