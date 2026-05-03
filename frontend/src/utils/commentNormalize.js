import { toIsoUtcString } from './commentDateTime';

export function commentIdKey(id) {
  return id == null ? '' : String(id);
}

export function sameCommentId(a, b) {
  return commentIdKey(a) === commentIdKey(b);
}

/**
 * Canonical comment shape from REST or SignalR (camelCase/PascalCase, id number or string).
 */
export function shapeComment(raw) {
  if (!raw) return null;
  const id = raw.Id ?? raw.id;
  if (id == null) return null;
  const postPid = raw.PostId ?? raw.postId;
  const userPid = raw.UserId ?? raw.userId;
  const content = raw.Content ?? raw.content ?? '';
  const rawTime = raw.CreatedAt ?? raw.createdAt;
  const iso = toIsoUtcString(rawTime);
  const createdAt = iso || (rawTime != null && rawTime !== '' ? String(rawTime) : '');
  const shaped = {
    id,
    postId: postPid,
    userId: userPid,
    content,
    createdAt
  };
  const un = raw.UserName ?? raw.userName;
  if (un != null) shaped.userName = un;
  return shaped;
}

/**
 * Merge one incoming comment; skip if same id already in list (string-safe).
 * Default prepend matches “newest first” used after create.
 */
export function mergeCommentIntoList(prev, incoming, { prepend = true } = {}) {
  const list = prev || [];
  const shaped = shapeComment(incoming);
  if (!shaped) return list;
  const key = commentIdKey(shaped.id);
  if (list.some((item) => commentIdKey(item.id ?? item.Id) === key)) {
    return list;
  }
  return prepend ? [shaped, ...list] : [...list, shaped];
}

/** Remove duplicates (e.g. API + hubs), keep first occurrence, normalize shape when possible */
export function dedupeCommentList(list) {
  if (!list?.length) return [];
  const seen = new Set();
  const out = [];
  for (const raw of list) {
    const shaped = shapeComment(raw);
    const row = shaped || {
      ...raw,
      id: raw.id ?? raw.Id,
      content: raw.content ?? raw.Content,
      userId: raw.userId ?? raw.UserId,
      createdAt:
        toIsoUtcString(raw.createdAt ?? raw.CreatedAt) ||
        raw.createdAt ||
        raw.CreatedAt ||
        ''
    };
    if (row.id == null) continue;
    const key = commentIdKey(row.id);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}
