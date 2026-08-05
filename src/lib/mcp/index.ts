import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchEbooks from "./tools/search-ebooks";
import getEbook from "./tools/get-ebook";
import myLibrary from "./tools/my-library";
import myOrders from "./tools/my-orders";
import authorSales from "./tools/author-sales";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "the-christian-ebook-shelf",
  title: "The Christian Ebook Shelf",
  version: "0.1.0",
  instructions:
    "Tools for E Library, a Zambian Christian ebook shop. Prices are in Zambian Kwacha (K). Use search_ebooks and get_ebook to explore the catalogue, my_library and my_orders for the signed-in customer's purchases, and author_sales_summary for an author's earnings.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchEbooks, getEbook, myLibrary, myOrders, authorSales],
});
