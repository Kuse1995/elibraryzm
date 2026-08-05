import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "author_sales_summary",
  title: "Author sales summary",
  description: "Sales, platform fees, payouts and available balance for the signed-in author's approved books (Kwacha).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const userId = ctx.getUserId();
    if (!userId) return { content: [{ type: "text", text: "Could not determine the signed-in user." }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase.rpc("calculate_author_earnings", { _author_id: userId });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const summary = Array.isArray(data) ? data[0] : data;
    return {
      content: [{ type: "text", text: JSON.stringify(summary ?? {}, null, 2) }],
      structuredContent: { summary: summary ?? null },
    };
  },
});
