import { Client } from "pg";
import { readFileSync } from "fs";
import path from "path";

const ADMIN_URL  = "postgresql://bovitrans:bovitrans_pass@localhost:5432/bovitrans";
const TEST_DB    = "bovitrans_test";
const TEST_URL   = `postgresql://bovitrans:bovitrans_pass@localhost:5432/${TEST_DB}`;

export async function setup() {
  // Connect to the main DB to create/drop the test DB
  const admin = new Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS ${TEST_DB} WITH (FORCE)`);
  await admin.query(`CREATE DATABASE ${TEST_DB}`);
  await admin.end();

  // Apply the full init.sql (schema + triggers) to the test DB
  const test = new Client({ connectionString: TEST_URL });
  await test.connect();
  const sql = readFileSync(path.join(process.cwd(), "docker/init.sql"), "utf-8");
  await test.query(sql);
  await test.end();
}

export async function teardown() {
  const admin = new Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS ${TEST_DB} WITH (FORCE)`);
  await admin.end();
}
