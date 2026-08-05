import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "my_orders",
  title: "My orders",
  description: "List the signed-in user's orders with status, total in Kwacha and any failure reason.",
  inputSchema: {
    status: z.enum(["pending", "completed", "failed"]).optional().describe("Filter by order status."),
    limit: z.number().int().min(1).max(50).default(10),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("orders")
      .select("id,status,total,payment_reference,failure_reason,created_at,items")
      .order("created_at", { ascending: false })
      .limit(limit ?? 10);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const orders = data ?? [];
    return {
      content: [{ type: "text", text: orders.length ? JSON.stringify(orders, null, 2) : "No orders yet." }],
      structuredContent: { orders },
    };
  },
});
