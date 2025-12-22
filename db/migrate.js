import shift from 'postgres-shift';
import postgres from 'postgres';
import { fileURLToPath } from 'node:url';

shift({
  sql: postgres(),
  path: fileURLToPath(new URL('migrations', import.meta.url)),
  before: ({ migration_id, name }) => {
    console.log('Migrating', migration_id, name);
  },
})
  .then(() => console.log('All good'))
  .catch((err) => {
    console.error('Failed', err);
    process.exit(1);
  });
