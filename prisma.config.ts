// If you aren't ready to move to Prisma 6, you don't need a prisma.config.ts file at all.
//  Simply delete it and let Prisma use your .env file automatically:

// Ensure your .env.development has:
// DATABASE_URL="postgresql://catalyst_user:dev_password_123@127.0.0.1:5432/catalyst_dev?schema=public"

import "dotenv/config";

import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use 127.0.0.1 to avoid Mac localhost issues
    url: "postgresql://catalyst_user:dev_password_123@127.0.0.1:5432/catalyst_dev?schema=public",
  },
});
