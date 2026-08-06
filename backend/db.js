// ============================================
// CAPA DE BASE DE DATOS
// ============================================
// Usa PostgreSQL cuando existe la variable de entorno DATABASE_URL
// (por ejemplo en Render). Si no, usa SQLite local (danzas.db) para desarrollo.
//
// Toda consulta usa parámetros (?) para prevenir SQL injection. En PostgreSQL
// los placeholders se convierten automáticamente a $1, $2, ... ($n).
// ============================================

const path = require('path');

const isPostgres = !!process.env.DATABASE_URL;

let db;

if (isPostgres) {
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  // Convierte placeholders ? a $1, $2, ... (solo fuera de cadenas)
  const sqlToPg = (sql) => {
    let i = 0;
    return sql.replace(/\?/g, () => `$${++i}`);
  };

  db = {
    isPostgres: true,

    async run(sql, params = []) {
      let query = sqlToPg(sql);
      if (/\bINSERT\b/i.test(query) && !/RETURNING/i.test(query)) {
        query += ' RETURNING id';
      }
      const result = await pool.query(query, params);
      return { lastID: result.rows[0] ? result.rows[0].id : null, changes: result.rowCount };
    },

    async all(sql, params = []) {
      const result = await pool.query(sqlToPg(sql), params);
      return result.rows;
    },

    async get(sql, params = []) {
      const result = await pool.query(sqlToPg(sql), params);
      return result.rows[0];
    },

    async close() {
      await pool.end();
    }
  };
} else {
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = path.join(__dirname, 'danzas.db');
  const sqlite = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error al conectar con SQLite:', err);
    } else {
      console.log('✓ Conectado a SQLite en:', dbPath);
    }
  });

  db = {
    isPostgres: false,

    run(sql, params = []) {
      return new Promise((resolve, reject) => {
        sqlite.run(sql, params, function (err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID, changes: this.changes });
        });
      });
    },

    all(sql, params = []) {
      return new Promise((resolve, reject) => {
        sqlite.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    },

    get(sql, params = []) {
      return new Promise((resolve, reject) => {
        sqlite.get(sql, params, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    },

    close() {
      return new Promise((resolve) => sqlite.close(resolve));
    }
  };
}

module.exports = db;
