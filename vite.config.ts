import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: [
      "class-variance-authority",
      "@radix-ui/react-slot",
      "@radix-ui/react-dialog",
      "@radix-ui/react-popover",
      "@radix-ui/react-select",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-tabs",
      "@radix-ui/react-separator",
      "@radix-ui/react-label",
      "react-day-picker",
      "date-fns",
      "decimal.js",
      "nepali-date-converter",
      "framer-motion",
      "recharts",
      "zustand",
      "react-hot-toast",
      "dexie",
      "dexie-react-hooks",
      "uuid",
      "clsx",
      "tailwind-merge",
      "lucide-react",
    ],
  },
})
