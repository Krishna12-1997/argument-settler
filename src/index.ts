import { createApp } from './app.js';
import { getEnv } from './config/env.js';

const env = getEnv();
const app = createApp();

app.listen(env.PORT, () => {
  console.log(`⚖️  Argument Settler Courtroom is in session!`);
  console.log(`🌐 Local server running at: http://localhost:${env.PORT}`);
});
