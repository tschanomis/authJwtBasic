const { createApp } = require('./app');
const { loadConfig } = require('./config');

const app = createApp(loadConfig());
const server = app.listen(process.env.PORT || 3030, () => {
  console.log(`Listening on port ${server.address().port}`);
});
