import app from "./app.js";
import { env } from "./config/env.js";
import { validateRuntimeConfig } from "./config/validateRuntime.js";

validateRuntimeConfig();

app.listen(env.port, () => {
  console.log(`Express backend starter listening on ${env.publicBaseUrl}/api`);
  console.log(`Data store provider: ${env.dataStoreProvider}`);
  console.log(`Media storage provider: ${env.mediaStorageProvider}`);
});
