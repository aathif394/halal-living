#!/usr/bin/env node
// The supplied credential is used only by this local command, never written to the site.
import { writeFile } from "node:fs/promises";
import { monthlyTraffic } from "../lib/traffic.ts";

process.env.CLOUDFLARE_ANALYTICS_TOKEN ||= process.env.CLOUDFLARE_API_TOKEN;
if (!process.env.CLOUDFLARE_ANALYTICS_TOKEN) throw new Error("Provide an analytics-capable Cloudflare token through the environment.");
const traffic = await monthlyTraffic();
if (!traffic || traffic.mode !== "live") throw new Error("Cloudflare did not return fresh measurements; existing snapshot preserved.");
await writeFile(new URL("../data/traffic.json", import.meta.url), JSON.stringify({ ...traffic, mode: "snapshot" }, null, 2) + "\n");
console.log(JSON.stringify({ counts: traffic.counts, measuredAt: traffic.updatedAt }));
