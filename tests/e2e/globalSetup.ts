import { Client } from "pg";
import { readFileSync } from "fs";
import path from "path";

const ADMIN_URL = "postgresql://bovitrans:bovitrans_pass@localhost:5432/bovitrans";
const E2E_DB   = "bovitrans_e2e";
const E2E_URL  = `postgresql://bovitrans:bovitrans_pass@localhost:5432/${E2E_DB}`;

async function setup() {
  const admin = new Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS ${E2E_DB} WITH (FORCE)`);
  await admin.query(`CREATE DATABASE ${E2E_DB}`);
  await admin.end();

  const db = new Client({ connectionString: E2E_URL });
  await db.connect();
  const sql = readFileSync(path.join(process.cwd(), "docker/e2e-seed.sql"), "utf-8");
  await db.query(sql);
  await db.end();
}

async function teardown() {
  const admin = new Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS ${E2E_DB} WITH (FORCE)`);
  await admin.end();
}

export default setup;
export { teardown };
