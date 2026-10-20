import { env } from '../config/env.js';
import { createDatabase } from './connection.js';
import { migrate } from './schema.js';
import { seedDemoData } from './seed.js';

const db = createDatabase(env.databasePath);
migrate(db);

const result = seedDemoData(db);

console.log(result.message);

db.close();
