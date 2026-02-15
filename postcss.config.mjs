const config = {
  plugins: {
    // Tailwind v4 pulls in lightningcss native binaries. This repo currently
    // doesn't use Tailwind utility classes, so we keep PostCSS enabled but
    // disable Tailwind to keep `next build` deterministic in CI.
  },
};

export default config;
