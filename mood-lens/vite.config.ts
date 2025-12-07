import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import mkcert from "vite-plugin-mkcert";

export default defineConfig({
  plugins: [tailwindcss(), mkcert()],
});
