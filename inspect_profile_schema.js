const pool = require("./src/config/db");

async function inspectProfile() {
  try {
    console.log("\n=== PROFILE TABLE STRUCTURE ===");

    const [columns] = await pool.query("DESCRIBE profile");

    console.table(
      columns.map((column) => ({
        Field: column.Field,
        Type: column.Type,
        Null: column.Null,
        Key: column.Key,
        Default: column.Default,
      }))
    );

    console.log("\n=== SAMPLE PROFILE DATA ===");

    const [rows] = await pool.query(`
      SELECT *
      FROM profile
      LIMIT 3
    `);

    console.dir(rows, { depth: null });

  } catch (error) {
    console.error("Profile schema inspection failed:");
    console.error(error);
  } finally {
    await pool.end();
  }
}

inspectProfile();