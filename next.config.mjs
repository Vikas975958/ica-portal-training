const allowedDevOrigins = [
  "localhost",
  "127.0.0.1",
  "192.168.1.168",
  "192.168.1.189",
  process.env.NEXT_DEV_LAN_ORIGIN,
].filter(Boolean);

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins,
};

export default nextConfig;
