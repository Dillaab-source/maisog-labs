// Build/server-only entry point. Never import this from a client component.
import { siteContent } from "../../data/site.js";
import { projectPublishedContent } from "./public.mjs";

export async function getPublicContent() {
  return projectPublishedContent(siteContent);
}
