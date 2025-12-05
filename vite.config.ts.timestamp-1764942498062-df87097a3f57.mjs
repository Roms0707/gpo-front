// vite.config.ts
import { defineConfig, loadEnv } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.js";
import { writeFileSync } from "fs";
import { resolve } from "path";
var __vite_injected_original_dirname = "/home/project";
var vite_config_default = defineConfig(() => {
  const env = loadEnv("", process.cwd(), "");
  return {
    plugins: [
      react(),
      // Custom plugin to generate riot.txt
      {
        name: "generate-riot-txt",
        buildStart() {
          const riotKey = env.VITE_RIOT_KEY || env.RIOT_KEY || "";
          const riotFilePath = resolve(__vite_injected_original_dirname, "public", "riot.txt");
          try {
            console.log("\u{1F50D} Environment variables loaded:");
            console.log("\u{1F4CB} VITE_RIOT_KEY:", env.VITE_RIOT_KEY ? "Found" : "Not found");
            console.log("\u{1F4CB} RIOT_KEY:", env.RIOT_KEY ? "Found" : "Not found");
            console.log("\u{1F4CB} All VITE_ vars:", Object.keys(env).filter((key) => key.startsWith("VITE_")));
            if (!riotKey) {
              console.warn("\u26A0\uFE0F  No Riot key found in environment variables");
              console.warn("\u{1F4A1} Make sure VITE_RIOT_KEY is set in your .env file");
            }
            writeFileSync(riotFilePath, riotKey);
            console.log("\u2705 riot.txt generated successfully");
            console.log("\u{1F4DD} Key length:", riotKey.length, "characters");
            console.log("\u{1F511} Key preview:", riotKey ? `${riotKey.substring(0, 8)}...` : "EMPTY");
            console.log("\u{1F4C1} File path:", riotFilePath);
          } catch (error) {
            console.error("\u274C Error generating riot.txt:", error);
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
            vendor: ["react", "react-dom", "react-router-dom"],
            // Supabase chunk
            supabase: ["@supabase/supabase-js"],
            ui: ["lucide-react", "react-hot-toast"]
          }
        }
      },
      // Optimize chunk size
      chunkSizeWarningLimit: 1e3
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ["react", "react-dom", "react-router-dom", "@supabase/supabase-js"]
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuaW1wb3J0IHsgd3JpdGVGaWxlU3luYyB9IGZyb20gJ2ZzJ1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnXG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKCkgPT4ge1xuICAvLyBMb2FkIGVudiBmaWxlIGZyb20gLmVudlxuICBjb25zdCBlbnYgPSBsb2FkRW52KCcnLCBwcm9jZXNzLmN3ZCgpLCAnJylcbiAgXG4gIHJldHVybiB7XG4gICAgcGx1Z2luczogW1xuICAgICAgcmVhY3QoKSxcbiAgICAgIC8vIEN1c3RvbSBwbHVnaW4gdG8gZ2VuZXJhdGUgcmlvdC50eHRcbiAgICAgIHtcbiAgICAgICAgbmFtZTogJ2dlbmVyYXRlLXJpb3QtdHh0JyxcbiAgICAgICAgYnVpbGRTdGFydCgpIHtcbiAgICAgICAgICAvLyBHZXQgdGhlIFJpb3Qga2V5IGZyb20gbG9hZGVkIGVudmlyb25tZW50XG4gICAgICAgICAgY29uc3QgcmlvdEtleSA9IGVudi5WSVRFX1JJT1RfS0VZIHx8IGVudi5SSU9UX0tFWSB8fCAnJztcbiAgICAgICAgICBjb25zdCByaW90RmlsZVBhdGggPSByZXNvbHZlKF9fZGlybmFtZSwgJ3B1YmxpYycsICdyaW90LnR4dCcpO1xuICAgICAgICAgIFxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnXHVEODNEXHVERDBEIEVudmlyb25tZW50IHZhcmlhYmxlcyBsb2FkZWQ6Jyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnXHVEODNEXHVEQ0NCIFZJVEVfUklPVF9LRVk6JywgZW52LlZJVEVfUklPVF9LRVkgPyAnRm91bmQnIDogJ05vdCBmb3VuZCcpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1x1RDgzRFx1RENDQiBSSU9UX0tFWTonLCBlbnYuUklPVF9LRVkgPyAnRm91bmQnIDogJ05vdCBmb3VuZCcpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1x1RDgzRFx1RENDQiBBbGwgVklURV8gdmFyczonLCBPYmplY3Qua2V5cyhlbnYpLmZpbHRlcihrZXkgPT4ga2V5LnN0YXJ0c1dpdGgoJ1ZJVEVfJykpKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKCFyaW90S2V5KSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUud2FybignXHUyNkEwXHVGRTBGICBObyBSaW90IGtleSBmb3VuZCBpbiBlbnZpcm9ubWVudCB2YXJpYWJsZXMnKTtcbiAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdcdUQ4M0RcdURDQTEgTWFrZSBzdXJlIFZJVEVfUklPVF9LRVkgaXMgc2V0IGluIHlvdXIgLmVudiBmaWxlJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHdyaXRlRmlsZVN5bmMocmlvdEZpbGVQYXRoLCByaW90S2V5KTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdcdTI3MDUgcmlvdC50eHQgZ2VuZXJhdGVkIHN1Y2Nlc3NmdWxseScpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1x1RDgzRFx1RENERCBLZXkgbGVuZ3RoOicsIHJpb3RLZXkubGVuZ3RoLCAnY2hhcmFjdGVycycpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1x1RDgzRFx1REQxMSBLZXkgcHJldmlldzonLCByaW90S2V5ID8gYCR7cmlvdEtleS5zdWJzdHJpbmcoMCwgOCl9Li4uYCA6ICdFTVBUWScpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1x1RDgzRFx1RENDMSBGaWxlIHBhdGg6JywgcmlvdEZpbGVQYXRoKTtcbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignXHUyNzRDIEVycm9yIGdlbmVyYXRpbmcgcmlvdC50eHQ6JywgZXJyb3IpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIF0sXG4gICAgYnVpbGQ6IHtcbiAgICAgIC8vIEVuYWJsZSBjb2RlIHNwbGl0dGluZyBhbmQgb3B0aW1pemUgY2h1bmsgc2l6ZVxuICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICAgIC8vIFZlbmRvciBjaHVuayBmb3IgUmVhY3QgYW5kIHJlbGF0ZWQgbGlicmFyaWVzXG4gICAgICAgICAgICB2ZW5kb3I6IFsncmVhY3QnLCAncmVhY3QtZG9tJywgJ3JlYWN0LXJvdXRlci1kb20nXSxcbiAgICAgICAgICAgIC8vIFN1cGFiYXNlIGNodW5rXG4gICAgICAgICAgICBzdXBhYmFzZTogWydAc3VwYWJhc2Uvc3VwYWJhc2UtanMnXSxcbiAgICAgICAgICAgIHVpOiBbJ2x1Y2lkZS1yZWFjdCcsICdyZWFjdC1ob3QtdG9hc3QnXVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIC8vIE9wdGltaXplIGNodW5rIHNpemVcbiAgICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTAwMFxuICAgIH0sXG4gICAgLy8gT3B0aW1pemUgZGVwZW5kZW5jaWVzXG4gICAgb3B0aW1pemVEZXBzOiB7XG4gICAgICBpbmNsdWRlOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdyZWFjdC1yb3V0ZXItZG9tJywgJ0BzdXBhYmFzZS9zdXBhYmFzZS1qcyddXG4gICAgfVxuICB9XG59KSJdLAogICJtYXBwaW5ncyI6ICI7QUFBeU4sU0FBUyxjQUFjLGVBQWU7QUFDL1AsT0FBTyxXQUFXO0FBQ2xCLFNBQVMscUJBQXFCO0FBQzlCLFNBQVMsZUFBZTtBQUh4QixJQUFNLG1DQUFtQztBQU16QyxJQUFPLHNCQUFRLGFBQWEsTUFBTTtBQUVoQyxRQUFNLE1BQU0sUUFBUSxJQUFJLFFBQVEsSUFBSSxHQUFHLEVBQUU7QUFFekMsU0FBTztBQUFBLElBQ0wsU0FBUztBQUFBLE1BQ1AsTUFBTTtBQUFBO0FBQUEsTUFFTjtBQUFBLFFBQ0UsTUFBTTtBQUFBLFFBQ04sYUFBYTtBQUVYLGdCQUFNLFVBQVUsSUFBSSxpQkFBaUIsSUFBSSxZQUFZO0FBQ3JELGdCQUFNLGVBQWUsUUFBUSxrQ0FBVyxVQUFVLFVBQVU7QUFFNUQsY0FBSTtBQUNGLG9CQUFRLElBQUkseUNBQWtDO0FBQzlDLG9CQUFRLElBQUksNEJBQXFCLElBQUksZ0JBQWdCLFVBQVUsV0FBVztBQUMxRSxvQkFBUSxJQUFJLHVCQUFnQixJQUFJLFdBQVcsVUFBVSxXQUFXO0FBQ2hFLG9CQUFRLElBQUksNkJBQXNCLE9BQU8sS0FBSyxHQUFHLEVBQUUsT0FBTyxTQUFPLElBQUksV0FBVyxPQUFPLENBQUMsQ0FBQztBQUV6RixnQkFBSSxDQUFDLFNBQVM7QUFDWixzQkFBUSxLQUFLLDBEQUFnRDtBQUM3RCxzQkFBUSxLQUFLLDREQUFxRDtBQUFBLFlBQ3BFO0FBRUEsMEJBQWMsY0FBYyxPQUFPO0FBQ25DLG9CQUFRLElBQUksd0NBQW1DO0FBQy9DLG9CQUFRLElBQUkseUJBQWtCLFFBQVEsUUFBUSxZQUFZO0FBQzFELG9CQUFRLElBQUksMEJBQW1CLFVBQVUsR0FBRyxRQUFRLFVBQVUsR0FBRyxDQUFDLENBQUMsUUFBUSxPQUFPO0FBQ2xGLG9CQUFRLElBQUksd0JBQWlCLFlBQVk7QUFBQSxVQUMzQyxTQUFTLE9BQU87QUFDZCxvQkFBUSxNQUFNLHFDQUFnQyxLQUFLO0FBQUEsVUFDckQ7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLE9BQU87QUFBQTtBQUFBLE1BRUwsZUFBZTtBQUFBLFFBQ2IsUUFBUTtBQUFBLFVBQ04sY0FBYztBQUFBO0FBQUEsWUFFWixRQUFRLENBQUMsU0FBUyxhQUFhLGtCQUFrQjtBQUFBO0FBQUEsWUFFakQsVUFBVSxDQUFDLHVCQUF1QjtBQUFBLFlBQ2xDLElBQUksQ0FBQyxnQkFBZ0IsaUJBQWlCO0FBQUEsVUFDeEM7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBO0FBQUEsTUFFQSx1QkFBdUI7QUFBQSxJQUN6QjtBQUFBO0FBQUEsSUFFQSxjQUFjO0FBQUEsTUFDWixTQUFTLENBQUMsU0FBUyxhQUFhLG9CQUFvQix1QkFBdUI7QUFBQSxJQUM3RTtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
