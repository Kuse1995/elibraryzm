import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_ebooks",
  title: "Search ebooks",
  description: "Search the approved ebook catalogue by title, author, description or category.",
  inputSchema: {
    query: z.string().trim().max(200).optional().describe("Free-text search over title, author and description."),
    category: z.string().trim().max(100).optional().describe("Filter by category, e.g. 'Free Resources'."),
    limit: z.number().int().min(1).max(50).default(10).describe("Maximum number of results."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, category, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("ebooks")
      .select("id,title,author,description,price,category,featured,cover_url")
      .eq("approval_status", "approved")
      .limit(limit ?? 10);
    if (category) q = q.eq("category", category);
    if (query) q = q.or(`title.ilike.%${query}%,author.ilike.%${query}%,description.ilike.%${query}%`);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const rows = (data ?? []).map((b) => ({ ...b, price_kwacha: b.price }));
    return {
      content: [{ type: "text", text: rows.length ? JSON.stringify(rows, null, 2) : "No ebooks matched." }],
      structuredContent: { ebooks: rows },
    };
  },
});
