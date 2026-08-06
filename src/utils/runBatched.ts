const MAX_RENAME_CONCURRENCY = 30;
const MIN_RENAME_CONCURRENCY = 1;
const DEFAULT_RENAME_CONCURRENCY = 6;

export async function runbatched<T>(
  tasks: (() => T | PromiseLike<T>)[],
  limit: number = DEFAULT_RENAME_CONCURRENCY,
) {
  limit = Math.min(
    Math.max(MIN_RENAME_CONCURRENCY, limit),
    MAX_RENAME_CONCURRENCY,
  );

  const result: Promise<T>[] = [];
  const executing = new Set<Promise<T>>();

  for (const task of tasks) {
    const p = Promise.resolve().then(task);
    result.push(p);
    executing.add(p);

    p.finally(() => executing.delete(p));

    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }

  return Promise.all(result);
}
