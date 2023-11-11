import errors from 'errors';

import { app } from './app';

app.listen(process.env.CLIENT_PORT, () => {
  console.log(`Client listening on port ${process.env.CLIENT_PORT}`);
});

errors();
