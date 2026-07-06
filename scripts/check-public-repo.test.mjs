import { describe, expect, it } from "vitest";
import {
  findForbiddenPublicPaths,
  inspectPublicRepository,
  isForbiddenPublicPath,
  parseGitHubRepo,
  EXPECTED_PUBLIC_DESCRIPTION,
  REQUIRED_PUBLIC_FILES,
  REQUIRED_PUBLIC_TOPICS,
} from "./check-public-repo.mjs";

function jsonResponse(data) {
  return {
    ok: true,
    status: 200,
    json: async () => data,
    text: async () => JSON.stringify(data),
  };
}

describe("public repository gate helpers", () => {
  it("parses supported GitHub repository URL formats", () => {
    const githubOrigin = "https:" + "//github.com";
    const expectedHtmlUrl = `${githubOrigin}/AI-Nikitka93/carebridge-navigator`;

    expect(parseGitHubRepo(`${githubOrigin}/AI-Nikitka93/carebridge-navigator`)).toEqual({
      owner: "AI-Nikitka93",
      repo: "carebridge-navigator",
      htmlUrl: expectedHtmlUrl,
    });

    expect(parseGitHubRepo("git@github.com:AI-Nikitka93/carebridge-navigator.git")).toEqual({
      owner: "AI-Nikitka93",
      repo: "carebridge-navigator",
      htmlUrl: expectedHtmlUrl,
    });
  });

  it("rejects non-GitHub repository URLs", () => {
    const exampleOrigin = "https:" + "//example.com";
    expect(() => parseGitHubRepo(`${exampleOrigin}/AI-Nikitka93/carebridge-navigator`)).toThrow(/github\.com/);
  });

  it("detects files that weaken the README-free PresentMe flow", () => {
    expect(isForbiddenPublicPath("README.md")).toBe(true);
    expect(isForbiddenPublicPath("docs/private-notes.md")).toBe(true);
    expect(isForbiddenPublicPath("carebridge-qa-desktop.png")).toBe(true);
    expect(isForbiddenPublicPath("src/domain/triageEngine.ts")).toBe(false);

    expect(
      findForbiddenPublicPaths([
        "src/main.tsx",
        "README.md",
        "docs/strategy.md",
        "carebridge-export-mobile.png",
      ]),
    ).toEqual(["README.md", "carebridge-export-mobile.png", "docs/strategy.md"]);
  });

  it("accepts a public README-free repository with the expected default-branch commit", async () => {
    const githubOrigin = "https:" + "//github.com";
    const expectedCommit = "abc1234567890";
    const fetchImpl = async (url) => {
      if (url.endsWith("/repos/AI-Nikitka93/carebridge-navigator")) {
        return jsonResponse({
          private: false,
          visibility: "public",
          archived: false,
          default_branch: "main",
          description: EXPECTED_PUBLIC_DESCRIPTION,
          license: {
            spdx_id: "MIT",
          },
          topics: REQUIRED_PUBLIC_TOPICS,
        });
      }

      if (url.includes("/git/trees/main")) {
        return jsonResponse({
          tree: REQUIRED_PUBLIC_FILES.map((path) => ({
            type: "blob",
            path,
          })),
        });
      }

      if (url.endsWith("/commits/main")) {
        return jsonResponse({
          sha: expectedCommit,
        });
      }

      throw new Error(`Unexpected test URL: ${url}`);
    };

    const report = await inspectPublicRepository({
      repoUrl: `${githubOrigin}/AI-Nikitka93/carebridge-navigator`,
      expectedCommit,
      fetchImpl,
    });

    expect(report.errors).toEqual([]);
    expect(report.publicHeadSha).toBe(expectedCommit);
    expect(report.publicFileCount).toBe(REQUIRED_PUBLIC_FILES.length);
  });

  it("rejects a public repository with missing submission description or topics", async () => {
    const githubOrigin = "https:" + "//github.com";
    const expectedCommit = "abc1234567890";
    const fetchImpl = async (url) => {
      if (url.endsWith("/repos/AI-Nikitka93/carebridge-navigator")) {
        return jsonResponse({
          private: false,
          visibility: "public",
          archived: false,
          default_branch: "main",
          description: "Generic health demo",
          license: {
            spdx_id: "NOASSERTION",
          },
          topics: ["react", "typescript"],
        });
      }

      if (url.includes("/git/trees/main")) {
        return jsonResponse({
          tree: REQUIRED_PUBLIC_FILES.map((path) => ({
            type: "blob",
            path,
          })),
        });
      }

      if (url.endsWith("/commits/main")) {
        return jsonResponse({
          sha: expectedCommit,
        });
      }

      throw new Error(`Unexpected test URL: ${url}`);
    };

    const report = await inspectPublicRepository({
      repoUrl: `${githubOrigin}/AI-Nikitka93/carebridge-navigator`,
      expectedCommit,
      fetchImpl,
    });

    expect(report.errors).toContain(
      "Repository description must be: Offline-first SDG 3 care-navigation app for community health workers.",
    );
    expect(report.errors).toContain(
      "Repository is missing required topics: care-navigation, community-health, offline-first, public-health, sdg-3, universal-health-coverage, vite",
    );
  });

  it("rejects a public repository when GitHub does not recognize the MIT license", async () => {
    const githubOrigin = "https:" + "//github.com";
    const expectedCommit = "abc1234567890";
    const fetchImpl = async (url) => {
      if (url.endsWith("/repos/AI-Nikitka93/carebridge-navigator")) {
        return jsonResponse({
          private: false,
          visibility: "public",
          archived: false,
          default_branch: "main",
          description: EXPECTED_PUBLIC_DESCRIPTION,
          license: {
            spdx_id: "NOASSERTION",
          },
          topics: REQUIRED_PUBLIC_TOPICS,
        });
      }

      if (url.includes("/git/trees/main")) {
        return jsonResponse({
          tree: REQUIRED_PUBLIC_FILES.map((path) => ({
            type: "blob",
            path,
          })),
        });
      }

      if (url.endsWith("/commits/main")) {
        return jsonResponse({
          sha: expectedCommit,
        });
      }

      throw new Error(`Unexpected test URL: ${url}`);
    };

    const report = await inspectPublicRepository({
      repoUrl: `${githubOrigin}/AI-Nikitka93/carebridge-navigator`,
      expectedCommit,
      fetchImpl,
    });

    expect(report.errors).toContain("Repository license must be recognized by GitHub as MIT, current SPDX id is NOASSERTION.");
  });
});
