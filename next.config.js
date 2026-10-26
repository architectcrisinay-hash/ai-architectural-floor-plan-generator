/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Produces .next/standalone: a self-contained server bundle with only the
  // runtime files needed, which is what we embed into the Windows .exe.
  output: "standalone",
  images: {
    // No next/image usage in this app, and unoptimized avoids bundling sharp.
    // That matters here: the Linux build traces sharp-linux-x64 / libvips .so
    // files, which cannot load on Windows and would add ~28MB of dead weight.
    unoptimized: true
  }
};

module.exports = nextConfig;
