/**
 * CampusNav Database Interface
 * Supports both AWS RDS MySQL and local JSON/file database for zero-config local development.
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const DB_TYPE = process.env.DB_TYPE || (process.env.DB_HOST ? 'mysql' : 'local');
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const LOCAL_DB_FILE = path.join(DATA_DIR, 'campusnav_db.json');

let mysqlPool = null;

if (DB_TYPE === 'mysql') {
  console.log(`[Database] Initializing AWS RDS MySQL Connection Pool (${process.env.DB_HOST}:${process.env.DB_PORT || 3306})...`);
  mysqlPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'campusnav',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
} else {
  console.log(`[Database] Initializing Local Data Store at ${LOCAL_DB_FILE}`);
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// In-memory cache for local file store
let localStore = null;

function loadLocalStore() {
  if (localStore) return localStore;
  if (fs.existsSync(LOCAL_DB_FILE)) {
    try {
      const content = fs.readFileSync(LOCAL_DB_FILE, 'utf-8');
      localStore = JSON.parse(content);
      if (!Array.isArray(localStore.faculty)) localStore.faculty = [];
      return localStore;
    } catch (e) {
      console.error('[Database] Error reading local db file, initializing empty store:', e.message);
    }
  }

  localStore = {
    blocks: [],
    floors: [],
    nodes: [],
    edges: [],
    faculty: [],
    users: [],
    analytics: []
  };
  saveLocalStore();
  return localStore;
}

function saveLocalStore() {
  if (!localStore) return;
  fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(localStore, null, 2), 'utf-8');
}

const db = {
  type: DB_TYPE,

  async getBlocks() {
    if (mysqlPool) {
      const [rows] = await mysqlPool.query('SELECT * FROM blocks ORDER BY name ASC');
      return rows;
    }
    const store = loadLocalStore();
    return [...store.blocks].sort((a, b) => a.name.localeCompare(b.name));
  },

  async getBlockById(id) {
    if (mysqlPool) {
      const [rows] = await mysqlPool.query('SELECT * FROM blocks WHERE id = ?', [id]);
      return rows[0] || null;
    }
    const store = loadLocalStore();
    return store.blocks.find(b => b.id === id) || null;
  },

  async createBlock(block) {
    if (mysqlPool) {
      await mysqlPool.query(
        'INSERT INTO blocks (id, name, code, description) VALUES (?, ?, ?, ?)',
        [block.id, block.name, block.code, block.description || '']
      );
      return block;
    }
    const store = loadLocalStore();
    store.blocks.push(block);
    saveLocalStore();
    return block;
  },

  async getFloors(blockId = null) {
    if (mysqlPool) {
      const sql = blockId 
        ? 'SELECT * FROM floors WHERE block_id = ? ORDER BY floor_number ASC'
        : 'SELECT * FROM floors ORDER BY floor_number ASC';
      const [rows] = await mysqlPool.query(sql, blockId ? [blockId] : []);
      return rows;
    }
    const store = loadLocalStore();
    let floors = store.floors;
    if (blockId) {
      floors = floors.filter(f => f.block_id === blockId);
    }
    return [...floors].sort((a, b) => a.floor_number - b.floor_number);
  },

  async getFloorById(id) {
    if (mysqlPool) {
      const [rows] = await mysqlPool.query('SELECT * FROM floors WHERE id = ?', [id]);
      return rows[0] || null;
    }
    const store = loadLocalStore();
    return store.floors.find(f => f.id === id) || null;
  },

  async createFloor(floor) {
    if (mysqlPool) {
      await mysqlPool.query(
        'INSERT INTO floors (id, block_id, floor_number, name, map_image_url, width, height) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [floor.id, floor.block_id, floor.floor_number, floor.name, floor.map_image_url || '', floor.width || 1000, floor.height || 650]
      );
      return floor;
    }
    const store = loadLocalStore();
    store.floors.push(floor);
    saveLocalStore();
    return floor;
  },

  async updateFloor(id, updates) {
    if (mysqlPool) {
      const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
      const values = [...Object.values(updates), id];
      await mysqlPool.query(`UPDATE floors SET ${fields} WHERE id = ?`, values);
      return this.getFloorById(id);
    }
    const store = loadLocalStore();
    const idx = store.floors.findIndex(f => f.id === id);
    if (idx !== -1) {
      store.floors[idx] = { ...store.floors[idx], ...updates };
      saveLocalStore();
      return store.floors[idx];
    }
    return null;
  },

  async getNodes(floorId = null, blockId = null) {
    if (mysqlPool) {
      let sql = 'SELECT * FROM nodes WHERE 1=1';
      const params = [];
      if (floorId) {
        sql += ' AND floor_id = ?';
        params.push(floorId);
      }
      if (blockId) {
        sql += ' AND block_id = ?';
        params.push(blockId);
      }
      sql += ' ORDER BY name ASC';
      const [rows] = await mysqlPool.query(sql, params);
      return rows;
    }
    const store = loadLocalStore();
    let nodes = store.nodes;
    if (floorId) nodes = nodes.filter(n => n.floor_id === floorId);
    if (blockId) nodes = nodes.filter(n => n.block_id === blockId);
    return nodes;
  },

  async getNodeById(id) {
    if (mysqlPool) {
      const [rows] = await mysqlPool.query('SELECT * FROM nodes WHERE id = ?', [id]);
      return rows[0] || null;
    }
    const store = loadLocalStore();
    return store.nodes.find(n => n.id === id) || null;
  },

  async getFaculty(query = '') {
    const term = String(query || '').trim();
    if (mysqlPool) {
      if (!term) {
        const [rows] = await mysqlPool.query(
          'SELECT f.*, n.name AS office_name FROM faculty f LEFT JOIN nodes n ON n.id = f.office_node_id ORDER BY f.name ASC'
        );
        return rows;
      }
      const like = `%${term}%`;
      const [rows] = await mysqlPool.query(
        'SELECT f.*, n.name AS office_name FROM faculty f LEFT JOIN nodes n ON n.id = f.office_node_id WHERE f.name LIKE ? OR f.department LIKE ? OR f.designation LIKE ? OR f.cabin LIKE ? OR f.room_no LIKE ? OR f.floor LIKE ? ORDER BY f.name ASC',
        [like, like, like, like, like, like]
      );
      return rows;
    }

    const store = loadLocalStore();
    const needle = term.toLowerCase();
    return store.faculty
      .filter(person => !needle ||
        [person.name, person.department, person.designation, person.cabin, person.room_no, person.floor].some(value =>
          String(value || '').toLowerCase().includes(needle)
        ))
      .map(person => ({
        ...person,
        office_name: store.nodes.find(node => node.id === person.office_node_id)?.name || null
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  async createFaculty(person) {
    if (mysqlPool) {
      await mysqlPool.query(
        'INSERT INTO faculty (id, name, department, designation, cabin, room_no, floor, office_node_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [person.id, person.name, person.department, person.designation, person.cabin, person.room_no, person.floor, person.office_node_id || null]
      );
      return person;
    }
    const store = loadLocalStore();
    store.faculty.push(person);
    saveLocalStore();
    return person;
  },

  async updateFaculty(id, updates) {
    if (mysqlPool) {
      const fields = Object.keys(updates).map(field => `\`${field}\` = ?`).join(', ');
      await mysqlPool.query(`UPDATE faculty SET ${fields} WHERE id = ?`, [...Object.values(updates), id]);
      return (await this.getFaculty()).find(person => person.id === id) || null;
    }
    const store = loadLocalStore();
    const index = store.faculty.findIndex(person => person.id === id);
    if (index < 0) return null;
    store.faculty[index] = { ...store.faculty[index], ...updates };
    saveLocalStore();
    return store.faculty[index];
  },

  async deleteFaculty(id) {
    if (mysqlPool) {
      const [result] = await mysqlPool.query('DELETE FROM faculty WHERE id = ?', [id]);
      return result.affectedRows > 0;
    }
    const store = loadLocalStore();
    const before = store.faculty.length;
    store.faculty = store.faculty.filter(person => person.id !== id);
    if (store.faculty.length === before) return false;
    saveLocalStore();
    return true;
  },

  async createNode(node) {
    if (mysqlPool) {
      await mysqlPool.query(
        'INSERT INTO nodes (id, name, code, block_id, floor_id, x, y, type, facility_type, description, is_accessible) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [node.id, node.name, node.code || '', node.block_id, node.floor_id, node.x, node.y, node.type, node.facility_type || null, node.description || '', node.is_accessible ? 1 : 0]
      );
      return node;
    }
    const store = loadLocalStore();
    store.nodes.push(node);
    saveLocalStore();
    return node;
  },

  async updateNode(id, updates) {
    if (mysqlPool) {
      const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
      const values = [...Object.values(updates), id];
      await mysqlPool.query(`UPDATE nodes SET ${fields} WHERE id = ?`, values);
      return this.getNodeById(id);
    }
    const store = loadLocalStore();
    const idx = store.nodes.findIndex(n => n.id === id);
    if (idx !== -1) {
      store.nodes[idx] = { ...store.nodes[idx], ...updates };
      saveLocalStore();
      return store.nodes[idx];
    }
    return null;
  },

  async updateBlockAvailability(blockId, isAvailable) {
    const status = isAvailable ? 'available' : 'unavailable';
    if (mysqlPool) {
      const [result] = await mysqlPool.query(
        'UPDATE nodes SET is_available = ?, availability_status = ? WHERE block_id = ?',
        [isAvailable ? 1 : 0, status, blockId]
      );
      return result.affectedRows;
    }
    const store = loadLocalStore();
    let updatedCount = 0;
    store.nodes = store.nodes.map(node => {
      if (node.block_id !== blockId) return node;
      updatedCount += 1;
      return { ...node, is_available: isAvailable, availability_status: status };
    });
    saveLocalStore();
    return updatedCount;
  },

  async updateEdge(id, updates) {
    if (mysqlPool) {
      const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
      const values = [...Object.values(updates), id];
      await mysqlPool.query(`UPDATE edges SET ${fields} WHERE id = ?`, values);
      const [rows] = await mysqlPool.query('SELECT * FROM edges WHERE id = ?', [id]);
      return rows[0] || null;
    }
    const store = loadLocalStore();
    const idx = store.edges.findIndex(edge => edge.id === id);
    if (idx !== -1) {
      store.edges[idx] = { ...store.edges[idx], ...updates };
      saveLocalStore();
      return store.edges[idx];
    }
    return null;
  },

  async deleteNode(id) {
    if (mysqlPool) {
      await mysqlPool.query('DELETE FROM edges WHERE source_node_id = ? OR target_node_id = ?', [id, id]);
      await mysqlPool.query('DELETE FROM nodes WHERE id = ?', [id]);
      return true;
    }
    const store = loadLocalStore();
    store.nodes = store.nodes.filter(n => n.id !== id);
    store.edges = store.edges.filter(e => e.source_node_id !== id && e.target_node_id !== id);
    store.faculty = store.faculty.map(person =>
      person.office_node_id === id ? { ...person, office_node_id: null } : person
    );
    saveLocalStore();
    return true;
  },

  async getEdges(floorId = null) {
    if (mysqlPool) {
      const [rows] = await mysqlPool.query('SELECT * FROM edges');
      return rows;
    }
    const store = loadLocalStore();
    return store.edges;
  },

  async createEdge(edge) {
    if (mysqlPool) {
      await mysqlPool.query(
        'INSERT INTO edges (id, source_node_id, target_node_id, weight, type, bidirectional) VALUES (?, ?, ?, ?, ?, ?)',
        [edge.id, edge.source_node_id, edge.target_node_id, edge.weight, edge.type, edge.bidirectional ? 1 : 0]
      );
      return edge;
    }
    const store = loadLocalStore();
    store.edges.push(edge);
    saveLocalStore();
    return edge;
  },

  async deleteEdge(id) {
    if (mysqlPool) {
      await mysqlPool.query('DELETE FROM edges WHERE id = ?', [id]);
      return true;
    }
    const store = loadLocalStore();
    store.edges = store.edges.filter(e => e.id !== id);
    saveLocalStore();
    return true;
  },

  async logAnalytics(entry) {
    const record = {
      id: entry.id || `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      eventType: entry.eventType || 'route_search',
      sourceId: entry.sourceId || null,
      targetId: entry.targetId || null,
      accessibleMode: entry.accessibleMode ? 1 : 0,
      timestamp: new Date().toISOString()
    };
    if (mysqlPool) {
      try {
        await mysqlPool.query(
          'INSERT INTO analytics (id, event_type, source_id, target_id, accessible_mode, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          [record.id, record.eventType, record.sourceId, record.targetId, record.accessibleMode, record.timestamp]
        );
      } catch (err) {
        console.error('Analytics log error:', err.message);
      }
      return;
    }
    const store = loadLocalStore();
    store.analytics.push(record);
    if (store.analytics.length > 500) {
      store.analytics = store.analytics.slice(-500); // keep recent
    }
    saveLocalStore();
  },

  async getAnalyticsSummary() {
    if (mysqlPool) {
      const [[{ totalSearches }]] = await mysqlPool.query('SELECT COUNT(*) as totalSearches FROM analytics');
      const [[{ accessibleSearches }]] = await mysqlPool.query('SELECT COUNT(*) as accessibleSearches FROM analytics WHERE accessible_mode = 1');
      return { totalSearches, accessibleSearches };
    }
    const store = loadLocalStore();
    const total = store.analytics.length;
    const accessible = store.analytics.filter(a => a.accessibleMode).length;
    return {
      totalSearches: total,
      accessibleSearches: accessible,
      totalNodes: store.nodes.length,
      totalEdges: store.edges.length,
      recentSearches: store.analytics.slice(-10).reverse()
    };
  },

  // Direct replace for seeding
  async resetAll(seedData) {
    if (mysqlPool) {
      await mysqlPool.query('SET FOREIGN_KEY_CHECKS = 0');
      await mysqlPool.query('TRUNCATE TABLE edges');
      await mysqlPool.query('TRUNCATE TABLE nodes');
      await mysqlPool.query('TRUNCATE TABLE floors');
      await mysqlPool.query('TRUNCATE TABLE blocks');
      await mysqlPool.query('SET FOREIGN_KEY_CHECKS = 1');
      for (const b of seedData.blocks) await this.createBlock(b);
      for (const f of seedData.floors) await this.createFloor(f);
      for (const n of seedData.nodes) await this.createNode(n);
      for (const e of seedData.edges) await this.createEdge(e);
      return true;
    }
    const existingFaculty = [...(loadLocalStore().faculty || [])];
    localStore = {
      blocks: [...seedData.blocks],
      floors: [...seedData.floors],
      nodes: [...seedData.nodes],
      edges: [...seedData.edges],
      faculty: existingFaculty,
      users: [...(seedData.users || [])],
      analytics: []
    };
    saveLocalStore();
    return true;
  }
};

module.exports = db;
