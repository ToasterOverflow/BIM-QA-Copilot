import type { NextConfig } from "next";

const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const isGithubPagesBuild = process.env.GITHUB_ACTIONS === "true" && repoName;

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  ...(isGithubPagesBuild
    ? {
        basePath: `/${repoName}`,
        assetPrefix: `/${repoName}/`,
      }
    : {}),
};

export default nextConfig;
