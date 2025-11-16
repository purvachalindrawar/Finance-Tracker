import http from 'http';
import { createApp } from './app.js';
import { initSocket } from './socket/index.js';
import { startRecurringJob } from './jobs/recurring.js';

const app = createApp();
const server = http.createServer(app);
initSocket(server);
startRecurringJob();

const port = Number(process.env.PORT || 4000);
server.listen(port, () => {
  console.log(`API on http://localhost:${port}`);
});
