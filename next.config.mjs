/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't try to bundle Node.js built-in modules on the client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        dns: false,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        buffer: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        child_process: false,
        'node:buffer': false,
        'node:diagnostics_channel': false,
        'node:events': false,
        'node:stream': false,
        'node:string_decoder': false,
        'node:timers': false,
        'node:url': false,
        'node:util': false,
      };
    }
    return config;
  },
};
export default nextConfig;
