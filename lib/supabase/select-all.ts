/**
 * PostgREST caps every response at `max_rows` (1 000 by default on Supabase):
 * a larger result set is silently truncated. This helper reads consecutive
 * `.range()` pages until a short page arrives.
 *
 * `page` must rebuild the query on each call (a PostgREST builder runs once)
 * and apply a deterministic `.order(...)`, otherwise rows can be skipped or
 * repeated between pages.
 */
export const POSTGREST_PAGE_SIZE = 1_000;

type PageResult<Row> = { data: Row[] | null; error: unknown };

export async function selectAllPages<Row>(
  page: (from: number, to: number) => PromiseLike<PageResult<Row>>,
  pageSize = POSTGREST_PAGE_SIZE,
  maxPages = 50,
): Promise<{ data: Row[]; error: unknown }> {
  const rows: Row[] = [];
  for (let index = 0; index < maxPages; index += 1) {
    const from = index * pageSize;
    const { data, error } = await page(from, from + pageSize - 1);
    if (error) return { data: rows, error };
    const batch = data ?? [];
    rows.push(...batch);
    if (batch.length < pageSize) return { data: rows, error: null };
  }
  return { data: rows, error: new Error(`Result set larger than ${maxPages * pageSize} rows`) };
}
