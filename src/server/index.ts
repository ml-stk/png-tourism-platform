import { createApiServer } from './api';
import { handleIndustryApi } from './industry-api';
import { handleVisitorEngagementApi } from './visitor-engagement-api';

const port = Number(process.env.PORT || 3000);
const server = createApiServer();
const existingHandler = server.listeners('request')[0] as (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) => void;
server.removeListener('request', existingHandler);
server.on('request', async (req, res) => {
  if (await handleIndustryApi(req, res)) return;
  if (await handleVisitorEngagementApi(req, res)) return;
  existingHandler(req, res);
});
server.listen(port, () => {
  console.log(`PNG Tourism Platform API listening on :${port}`);
});
