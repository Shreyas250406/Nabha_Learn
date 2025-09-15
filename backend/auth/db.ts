import { SQLDatabase } from 'encore.dev/storage/sqldb';

export const authDB = new SQLDatabase("nabha_learn", {
  migrations: "./migrations",
});
