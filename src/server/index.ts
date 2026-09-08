import { createApiServer } from './api';

const port = Number(process.env.PORT || 3000);
createApiServer().listen(port, () => {
  console.log(`PNG Tourism Platform API listening on :${port}`);
});
