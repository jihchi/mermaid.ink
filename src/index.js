const createApp = require('./app');

const PORT = process.env.PORT || 3000;

(async () => {
  const { app } = await createApp();
  await app.listen(PORT);
  console.log(`server listening on ${PORT}`);
})();
