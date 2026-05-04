import type { Database } from "./sqlite";

export class FormatUrlError extends Error {}

export function normalizeFormatUrl(input: string): string {
  const trimmed = input.trim();
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new FormatUrlError("URL の形式が正しくありません");
  }
  if (url.protocol !== "https:") {
    throw new FormatUrlError("https:// の URL を指定してください");
  }
  if (url.hostname === "raw.githubusercontent.com") {
    return `https://raw.githubusercontent.com${url.pathname}`;
  }
  if (url.hostname === "github.com") {
    const m = url.pathname.match(
      /^\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/,
    );
    if (!m) {
      throw new FormatUrlError("GitHub の blob URL が正しくありません");
    }
    const [, owner, repo, ref, path] = m;
    return `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${path}`;
  }
  throw new FormatUrlError("GitHub の URL のみ受け付けます");
}

export async function fetchFormatSql(rawUrl: string): Promise<string> {
  const res = await fetch(rawUrl);
  if (!res.ok) {
    throw new FormatUrlError(`取得に失敗しました (HTTP ${res.status})`);
  }
  return res.text();
}

export function applyFormatSql(db: Database, sql: string): void {
  db.exec("BEGIN");
  try {
    db.exec(sql);
    db.exec("COMMIT");
  } catch (e) {
    try {
      db.exec("ROLLBACK");
    } catch {
      // best effort: surface the original error
    }
    throw e;
  }
}

export function formatUrlDisplayName(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    const segments = u.pathname.split("/").filter(Boolean);
    return segments[segments.length - 1] ?? rawUrl;
  } catch {
    return rawUrl;
  }
}
