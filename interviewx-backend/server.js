import { createApp } from "./src/app.js";
import { connectDB } from "./src/config/db.js";
import { env } from "./src/config/env.js";

async function main() {
  await connectDB();
  const app = createApp();

  app.listen(env.port, () => {
    console.log(`InterviewX API listening on port ${env.port} (${env.nodeEnv})`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
