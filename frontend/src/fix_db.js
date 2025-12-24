const db = require('./db');

const queries = [
  "ALTER TABLE menu_items ADD COLUMN is_active BOOLEAN DEFAULT TRUE",
  "ALTER TABLE menu_items MODIFY COLUMN photo LONGTEXT",
  "ALTER TABLE orders ADD COLUMN qr_code VARCHAR(255)"
];

console.log("Applying database fixes...");

function runQueries(index) {
  if (index >= queries.length) {
    console.log("All fixes applied. You can now restart your server.");
    process.exit();
  }

  const sql = queries[index];
  db.query(sql, (err) => {
    if (err) {
      // 1060: Duplicate column name
      if (err.errno === 1060) {
        console.log(`Skipped (Column already exists): ${sql}`);
      } else {
        console.log(`Error executing: ${sql}`);
        console.log(`Message: ${err.message}`);
      }
    } else {
      console.log(`Success: ${sql}`);
    }
    runQueries(index + 1);
  });
}

runQueries(0);