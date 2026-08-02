import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Servidor autocontenido: la imagen de producción no lleva node_modules
  // completo ni código fuente (PLAN.md §0.8).
  output: "standalone",
}

export default nextConfig
