const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { app } = require('electron');
const sqlite = require('sqlite');
const sqlite3 = require('sqlite3').verbose();

class DatabaseService {
  constructor() {
    // Get user data path for storing database
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'grainvault.db');
    
    // Ensure directory exists
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    
    // Initialize database connection as a promise
    this.dbPromise = this.initDatabase(dbPath);
  }
  
  async initDatabase(dbPath) {
    // Open the database
    const db = await sqlite.open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    // Enable foreign keys
    await db.run('PRAGMA foreign_keys = ON');
    
    // Initialize the database
    await this.initialize(db);
    
    return db;
  }
  
  async getDb() {
    return await this.dbPromise;
  }
  
  async initialize(db) {
    // Check if tables exist, if not create them
    const tableCheck = await db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='rolls'"
    );
    
    if (!tableCheck) {
      // Read schema from file
      const schema = fs.readFileSync(
        path.join(__dirname, 'schema.sql'),
        'utf8'
      );
      
      // Execute schema script
      await db.exec(schema);
      
      // Seed default data
      await this.seedDefaultData(db);
      
      // Create default settings
      await this.createDefaultSettings(db);
    }
  }
  
  async seedDefaultData(db) {
    // Add some default film stocks
    const filmStocks = [
      { id: uuidv4(), name: 'Portra 400', is_color: 1, iso: 400 },
      { id: uuidv4(), name: 'HP5 Plus', is_color: 0, iso: 400 },
      { id: uuidv4(), name: 'Portra 160', is_color: 1, iso: 160 },
      { id: uuidv4(), name: 'Ektar 100', is_color: 1, iso: 100 },
      { id: uuidv4(), name: 'CineStill 800T', is_color: 1, iso: 800 },
      { id: uuidv4(), name: 'TMAX 400', is_color: 0, iso: 400 },
      { id: uuidv4(), name: 'Tri-X 400', is_color: 0, iso: 400 }
    ];
    
    const stmt = await db.prepare(
      'INSERT INTO film_stocks (id, name, is_color, iso) VALUES (?, ?, ?, ?)'
    );
    
    for (const stock of filmStocks) {
      await stmt.run(stock.id, stock.name, stock.is_color, stock.iso);
    }
  }
  
  async createDefaultSettings(db) {
    await db.run(
      'INSERT INTO settings (id, theme, default_view, thumbnails_size, cache_limit_mb) VALUES (?, ?, ?, ?, ?)',
      ['app_settings', 'light', 'grid', 200, 500]
    );
  }
  
  // Roll CRUD operations
  async getRolls() {
    const db = await this.getDb();
    return await db.all('SELECT * FROM rolls ORDER BY date_imported DESC');
  }
  
  async getRollById(id) {
    const db = await this.getDb();
    return await db.get('SELECT * FROM rolls WHERE id = ?', [id]);
  }
  
  async addRoll(rollData) {
    const db = await this.getDb();
    const id = uuidv4();
    
    await db.run(`
      INSERT INTO rolls (
        id, name, path, film_stock, camera, lens, iso, 
        date_taken, date_imported, notes, thumbnail_path, image_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      rollData.name,
      rollData.path,
      rollData.filmStock,
      rollData.camera,
      rollData.lens,
      rollData.iso,
      rollData.dateTaken,
      new Date().toISOString(),
      rollData.notes,
      rollData.thumbnailPath,
      rollData.imageCount
    ]);
    
    // Add tags if provided
    if (rollData.tags && Array.isArray(rollData.tags) && rollData.tags.length > 0) {
      for (const tagName of rollData.tags) {
        // Check if tag exists
        let tag = await db.get('SELECT id FROM tags WHERE name = ?', [tagName]);
        let tagId;
        
        if (!tag) {
          // Create new tag
          tagId = uuidv4();
          await db.run('INSERT INTO tags (id, name) VALUES (?, ?)', [tagId, tagName]);
        } else {
          tagId = tag.id;
        }
        
        // Add tag to roll
        await db.run('INSERT INTO roll_tags (roll_id, tag_id) VALUES (?, ?)', [id, tagId]);
      }
    }
    
    return id;
  }
  
  async updateRoll(id, rollData) {
    const db = await this.getDb();
    const result = await db.run(`
      UPDATE rolls SET
        name = ?,
        film_stock = ?,
        camera = ?,
        lens = ?,
        iso = ?,
        date_taken = ?,
        notes = ?,
        thumbnail_path = COALESCE(?, thumbnail_path)
      WHERE id = ?
    `, [
      rollData.name,
      rollData.filmStock,
      rollData.camera,
      rollData.lens,
      rollData.iso,
      rollData.dateTaken,
      rollData.notes,
      rollData.thumbnailPath,
      id
    ]);
    
    return result.changes > 0;
  }
  
  async deleteRoll(id) {
    const db = await this.getDb();
    const result = await db.run('DELETE FROM rolls WHERE id = ?', [id]);
    
    return result.changes > 0;
  }
  
  // Image operations
  async addImage(imageData) {
    const db = await this.getDb();
    const id = uuidv4();
    await db.run(`
      INSERT INTO images (
        id, roll_id, filename, path, index_in_roll,
        width, height, format, file_size, date_modified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      imageData.rollId,
      imageData.filename,
      imageData.path,
      imageData.index,
      imageData.metadata.width,
      imageData.metadata.height,
      imageData.metadata.format,
      imageData.metadata.size,
      imageData.metadata.dateModified
    ]);
    
    return id;
  }
  
  async getImagesByRollId(rollId) {
    const db = await this.getDb();
    return await db.all(
      'SELECT * FROM images WHERE roll_id = ? ORDER BY index_in_roll', 
      [rollId]
    );
  }
  
  async getImageById(id) {
    const db = await this.getDb();
    return await db.get('SELECT * FROM images WHERE id = ?', [id]);
  }
  
  async deleteImagesByRollId(rollId) {
    const db = await this.getDb();
    console.log(`Deleting all images for roll ID: ${rollId}`);
    const result = await db.run('DELETE FROM images WHERE roll_id = ?', [rollId]);
    console.log(`Deleted ${result.changes} images`);
    return result.changes;
  }
  
  // Reference data operations
  async getFilmStocks() {
    const db = await this.getDb();
    return await db.all('SELECT * FROM film_stocks ORDER BY name');
  }
  
  async addFilmStock(name, isColor, iso) {
    const db = await this.getDb();
    const id = uuidv4();
    await db.run(
      'INSERT INTO film_stocks (id, name, is_color, iso) VALUES (?, ?, ?, ?)',
      [id, name, isColor ? 1 : 0, iso]
    );
    
    return id;
  }
  
  async getCameras() {
    const db = await this.getDb();
    return await db.all('SELECT * FROM cameras ORDER BY name');
  }
  
  async addCamera(name) {
    const db = await this.getDb();
    const id = uuidv4();
    await db.run('INSERT INTO cameras (id, name) VALUES (?, ?)', [id, name]);
    return id;
  }
  
  async getLenses() {
    const db = await this.getDb();
    return await db.all('SELECT * FROM lenses ORDER BY name');
  }
  
  async addLens(name) {
    const db = await this.getDb();
    const id = uuidv4();
    await db.run('INSERT INTO lenses (id, name) VALUES (?, ?)', [id, name]);
    return id;
  }
  
  // Tags operations
  async getTags() {
    const db = await this.getDb();
    return await db.all('SELECT * FROM tags ORDER BY name');
  }
  
  async addTag(name) {
    const db = await this.getDb();
    const id = uuidv4();
    await db.run('INSERT INTO tags (id, name) VALUES (?, ?)', [id, name]);
    return id;
  }
  
  async getRollTags(rollId) {
    const db = await this.getDb();
    return await db.all(`
      SELECT t.* FROM tags t
      JOIN roll_tags rt ON rt.tag_id = t.id
      WHERE rt.roll_id = ?
      ORDER BY t.name
    `, [rollId]);
  }
  
  async addRollTag(rollId, tagId) {
    const db = await this.getDb();
    try {
      await db.run(
        'INSERT INTO roll_tags (roll_id, tag_id) VALUES (?, ?)',
        [rollId, tagId]
      );
      return true;
    } catch (err) {
      return false;
    }
  }
  
  async removeRollTag(rollId, tagId) {
    const db = await this.getDb();
    const result = await db.run(
      'DELETE FROM roll_tags WHERE roll_id = ? AND tag_id = ?',
      [rollId, tagId]
    );
    return result.changes > 0;
  }
  
  // Settings operations
  async getSettings() {
    const db = await this.getDb();
    return await db.get('SELECT * FROM settings WHERE id = ?', ['app_settings']);
  }
  
  async updateSettings(settings) {
    const db = await this.getDb();
    await db.run(`
      UPDATE settings SET
        theme = ?,
        default_view = ?,
        thumbnails_size = ?,
        cache_limit_mb = ?
      WHERE id = ?
    `, [
      settings.theme,
      settings.defaultView,
      settings.thumbnailsSize,
      settings.cacheLimitMb,
      'app_settings'
    ]);
    return true;
  }
}

module.exports = new DatabaseService(); 