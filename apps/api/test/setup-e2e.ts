import * as path from 'path';

import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env.test'), override: true });

// Same patch as src/main.ts — Prisma returns BigInt for some fields, which JSON.stringify
// can't serialize natively. main.ts isn't imported in E2E specs (it calls bootstrap()
// itself), so this has to be replicated here.
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};
