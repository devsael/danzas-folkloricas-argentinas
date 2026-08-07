// ============================================
// DDL COMPARTIDO (SQLite y PostgreSQL)
// ============================================
// Sentencias CREATE TABLE para los dos motores que soporta la app.
// Se usan tanto en init-db.js (crear + sembrar) como en server.js
// (auto-creación de tablas al arrancar, útil en un PostgreSQL nuevo).

const db = require('./db');

const danzas = db.isPostgres
  ? `CREATE TABLE IF NOT EXISTS danzas (
      id SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL UNIQUE,
      region TEXT NOT NULL,
      caracter TEXT DEFAULT 'festiva',
      historia TEXT,
      coreografia TEXT,
      video_url TEXT,
      imagen_url TEXT
    )`
  : `CREATE TABLE IF NOT EXISTS danzas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      region TEXT NOT NULL,
      caracter TEXT DEFAULT 'festiva',
      historia TEXT,
      coreografia TEXT,
      video_url TEXT,
      imagen_url TEXT
    )`;

const eventos = db.isPostgres
  ? `CREATE TABLE IF NOT EXISTS eventos (
      id SERIAL PRIMARY KEY,
      titulo TEXT NOT NULL,
      fecha TEXT NOT NULL,
      lugar TEXT,
      descripcion TEXT
    )`
  : `CREATE TABLE IF NOT EXISTS eventos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      fecha TEXT NOT NULL,
      lugar TEXT,
      descripcion TEXT
    )`;

const comentarios = db.isPostgres
  ? `CREATE TABLE IF NOT EXISTS comentarios (
      id SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL,
      mensaje TEXT NOT NULL,
      fecha TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'pendiente'
    )`
  : `CREATE TABLE IF NOT EXISTS comentarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      mensaje TEXT NOT NULL,
      fecha TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'pendiente'
    )`;

const cursos = db.isPostgres
  ? `CREATE TABLE IF NOT EXISTS cursos (
      id SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      drive_url TEXT NOT NULL,
      creado TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
  : `CREATE TABLE IF NOT EXISTS cursos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      drive_url TEXT NOT NULL,
      creado TEXT NOT NULL DEFAULT (datetime('now'))
    )`;

const codigos = db.isPostgres
  ? `CREATE TABLE IF NOT EXISTS codigos (
      id SERIAL PRIMARY KEY,
      codigo TEXT NOT NULL UNIQUE,
      curso_id INTEGER NOT NULL,
      estado TEXT NOT NULL DEFAULT 'activo',
      nombre_cliente TEXT,
      usado TEXT,
      creado TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
  : `CREATE TABLE IF NOT EXISTS codigos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT NOT NULL UNIQUE,
      curso_id INTEGER NOT NULL,
      estado TEXT NOT NULL DEFAULT 'activo',
      nombre_cliente TEXT,
      usado TEXT,
      creado TEXT NOT NULL DEFAULT (datetime('now'))
    )`;

module.exports = { danzas, eventos, comentarios, cursos, codigos };
