import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async headers() {
    return [
      {
        // Permite que QUALQUER página do NutriPlayer seja embarcada em iframe
        // por origens confiáveis (BH Wolves em localhost e produção)
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            // frame-ancestors substitui X-Frame-Options; aceita a mesma origem
            // e o BH Wolves (localhost:3000 e produção)
            value: "frame-ancestors 'self' http://localhost:3000 http://localhost:3002 https://*.vercel.app https://*.bhwolves.com.br https://*.bsbmanager.com.br https://bh-wolves-chamada.vercel.app https://www.nutriplayer.com https://nutriplayer.com",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
