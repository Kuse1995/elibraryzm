import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "my_library",
  title: "My library",
  description: "List the ebooks the signed-in user owns and can download.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("user_ebook_access")
      .select("created_at, ebooks(id,title,author,category,price,cover_url)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const items = data ?? [];
    return {
      content: [{ type: "text", text: items.length ? JSON.stringify(items, null, 2) : "Your library is empty." }],
      structuredContent: { items },
    };
  },
});
