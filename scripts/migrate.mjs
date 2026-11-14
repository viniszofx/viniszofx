// Aplica as migrations do Drizzle antes do build (Vercel/produção), com o DATABASE_URL do ambiente.
// Sem DATABASE_URL (ex.: build local sem banco) só avisa e segue.
import "dotenv/config";
import { spawnSync } from "node:child_process";

if (!process.env.DATABASE_URL || process.env.SKIP_DB_MIGRATE === "1") {
  console.log("[migrate] DATABASE_URL ausente ou SKIP_DB_MIGRATE=1: migrations não aplicadas.");
  process.exit(0);
}
const result = spawnSync(process.execPath, ["node_modules/drizzle-kit/bin.cjs", "migrate"], { stdio: "inherit" });
process.exit(result.status ?? 1);
