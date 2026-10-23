import { createApp } from "./app.js";
import { getEnv } from "./config/env.js";

const env = getEnv();
const app = createApp();

app.listen(env.PORT, () => {
  console.log(`Local server running at: http://localhost:${env.PORT}`);
});
