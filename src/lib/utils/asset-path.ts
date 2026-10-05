/**
 * Returns a URL path prefixed with the configured Next.js basePath.
 * Essential for assets when deployed to GitHub Pages at /<repo-name>/
 */
export function getAssetPath(path: string): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${cleanPath}`;
}
