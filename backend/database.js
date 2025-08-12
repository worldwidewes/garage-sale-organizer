const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        const dbPath = path.join(__dirname, '../database/garage_sale.db');
        this.db = new sqlite3.Database(dbPath);
        this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const initSqlPath = path.join(__dirname, '../database/init.sql');
            const initSql = fs.readFileSync(initSqlPath, 'utf8');
            
            this.db.exec(initSql, (err) => {
                if (err) {
                    console.error('Error initializing database:', err);
                    reject(err);
                } else {
                    console.log('Database initialized successfully');
                    resolve();
                }
            });
        });
    }

    // Items operations
    async createItem(item) {
        return new Promise((resolve, reject) => {
            const { id, title, description, price, category } = item;
            const sql = `
                INSERT INTO items (id, title, description, price, category)
                VALUES (?, ?, ?, ?, ?)
            `;
            
            this.db.run(sql, [id, title, description, price, category], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id, changes: this.changes });
                }
            });
        });
    }

    async getItem(id) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM items WHERE id = ?';
            
            this.db.get(sql, [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async getItems(filters = {}) {
        return new Promise((resolve, reject) => {
            let sql = 'SELECT * FROM items WHERE 1=1';
            const params = [];

            if (filters.query) {
                sql += ' AND (title LIKE ? OR description LIKE ?)';
                params.push(`%${filters.query}%`, `%${filters.query}%`);
            }

            if (filters.category) {
                sql += ' AND category = ?';
                params.push(filters.category);
            }

            if (filters.min_price !== undefined) {
                sql += ' AND price >= ?';
                params.push(filters.min_price);
            }

            if (filters.max_price !== undefined) {
                sql += ' AND price <= ?';
                params.push(filters.max_price);
            }

            const sortBy = filters.sort_by || 'created_at';
            const sortOrder = filters.sort_order || 'desc';
            sql += ` ORDER BY ${sortBy} ${sortOrder}`;

            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async updateItem(id, updates) {
        return new Promise((resolve, reject) => {
            const fields = Object.keys(updates);
            const values = Object.values(updates);
            const placeholders = fields.map(field => `${field} = ?`).join(', ');
            
            const sql = `UPDATE items SET ${placeholders}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
            values.push(id);

            this.db.run(sql, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    async deleteItem(id) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM items WHERE id = ?';
            
            this.db.run(sql, [id], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    // Images operations
    async createImage(image) {
        return new Promise((resolve, reject) => {
            const { id, item_id, filename, filepath, ai_analysis } = image;
            const sql = `
                INSERT INTO images (id, item_id, filename, filepath, ai_analysis)
                VALUES (?, ?, ?, ?, ?)
            `;
            
            this.db.run(sql, [id, item_id, filename, filepath, ai_analysis], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id, changes: this.changes });
                }
            });
        });
    }

    async getItemImages(itemId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM images WHERE item_id = ? ORDER BY created_at';
            
            this.db.all(sql, [itemId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async deleteImage(id) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM images WHERE id = ?';
            
            this.db.run(sql, [id], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    // Settings operations
    async getSetting(key) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT value FROM settings WHERE key = ?';
            
            this.db.get(sql, [key], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row ? row.value : null);
                }
            });
        });
    }

    async setSetting(key, value) {
        return new Promise((resolve, reject) => {
            const sql = 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)';
            
            this.db.run(sql, [key, value], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    async getAllSettings() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT key, value FROM settings';
            
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const settings = {};
                    rows.forEach(row => {
                        settings[row.key] = row.value;
                    });
                    resolve(settings);
                }
            });
        });
    }

    close() {
        this.db.close();
    }
}

module.exports = Database;