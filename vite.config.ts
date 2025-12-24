import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/DevLogApp/",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for React and related libraries
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          // UI components chunk
          "ui-components": [
            "./src/components/DevLogList.tsx",
            "./src/components/Profile.tsx",
            "./src/components/AdminUserManagement.tsx",
            "./src/components/DeveloperDashboard.tsx",
          ],
          // Form components chunk
          "form-components": [
            "./src/components/EntryLogger.tsx",
            "./src/components/EditLogger.tsx",
            "./src/components/Login.tsx",
            "./src/components/Register.tsx",
          ],
          // Other utilities and pages
          utils: ["./src/lib/api.ts"],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
