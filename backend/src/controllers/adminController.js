const db = require('../config/db');
const awsService = require('../services/awsService');
const { seedDatabase } = require('../models/seed');

exports.createNode = async (req, res) => {
  try {
    const { name, code, block_id, floor_id, x, y, type, facility_type, description, is_accessible } = req.body;
    const numericX = Number(x);
    const numericY = Number(y);
    const validTypes = new Set(['room', 'corridor_junction', 'entrance', 'staircase', 'lift', 'facility']);
    const validFacilities = new Set(['canteen', 'library', 'washroom', 'emergency_exit', 'drinking_water', 'medical_room']);
    if (typeof name !== 'string' || !name.trim() || !block_id || !floor_id ||
        !Number.isFinite(numericX) || !Number.isFinite(numericY)) {
      return res.status(400).json({ error: 'Missing required node properties (name, block_id, floor_id, x, y).' });
    }
    if (type && !validTypes.has(type)) {
      return res.status(400).json({ error: 'Invalid node type.' });
    }
    if (facility_type && !validFacilities.has(facility_type)) {
      return res.status(400).json({ error: 'Invalid facility type.' });
    }

    const newNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      code: code || '',
      block_id,
      floor_id,
      x: numericX,
      y: numericY,
      type: type || 'room',
      facility_type: facility_type || null,
      description: description || '',
      is_accessible: is_accessible === true || is_accessible === 1 || is_accessible === 'true',
      is_available: true,
      availability_status: 'unknown'
    };

    const saved = await db.createNode(newNode);
    awsService.logMetric('AdminNodeCreated', 1, 'Count');
    res.status(201).json(saved);
  } catch (error) {
    console.error('Create node error:', error);
    res.status(500).json({ error: 'Failed to create node.' });
  }
};

exports.updateNode = async (req, res) => {
  try {
    const { id } = req.params;
    const allowedFields = new Set([
      'name', 'code', 'block_id', 'floor_id', 'x', 'y', 'type',
      'facility_type', 'description', 'is_accessible', 'is_available', 'availability_status'
    ]);
    const updates = Object.fromEntries(
      Object.entries(req.body || {}).filter(([field]) => allowedFields.has(field))
    );
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'At least one valid node field must be provided.' });
    }
    if (typeof updates.name === 'string') updates.name = updates.name.trim();
    if (Object.prototype.hasOwnProperty.call(updates, 'name') && !updates.name) {
      return res.status(400).json({ error: 'Location name cannot be empty.' });
    }
    for (const coordinate of ['x', 'y']) {
      if (Object.prototype.hasOwnProperty.call(updates, coordinate)) {
        const value = Number(updates[coordinate]);
        if (!Number.isFinite(value)) return res.status(400).json({ error: `${coordinate} must be a finite number.` });
        updates[coordinate] = value;
      }
    }
    if (updates.facility_type === '') updates.facility_type = null;
    if (updates.type && !new Set(['room', 'corridor_junction', 'entrance', 'staircase', 'lift', 'facility']).has(updates.type)) {
      return res.status(400).json({ error: 'Invalid node type.' });
    }
    if (updates.facility_type !== undefined && updates.facility_type !== null &&
        !new Set(['canteen', 'library', 'washroom', 'emergency_exit', 'drinking_water', 'medical_room']).has(updates.facility_type)) {
      return res.status(400).json({ error: 'Invalid facility type.' });
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'availability_status')) {
      const validStatuses = new Set(['available', 'occupied', 'reserved', 'unavailable', 'unknown']);
      if (!validStatuses.has(updates.availability_status)) {
        return res.status(400).json({ error: 'availability_status must be available, occupied, reserved, unavailable, or unknown.' });
      }
      updates.is_available = updates.availability_status === 'unavailable' ? 0 : 1;
    } else if (Object.prototype.hasOwnProperty.call(updates, 'is_available')) {
      if (typeof updates.is_available !== 'boolean') {
        return res.status(400).json({ error: 'is_available must be a boolean.' });
      }
      updates.is_available = updates.is_available ? 1 : 0;
      updates.availability_status = updates.is_available ? 'unknown' : 'unavailable';
    }
    const updated = await db.updateNode(id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Node not found.' });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update node.' });
  }
};

exports.deleteNode = async (req, res) => {
  try {
    const { id } = req.params;
    await db.deleteNode(id);
    res.json({ success: true, message: `Node ${id} and connected edges deleted.` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete node.' });
  }
};

exports.createEdge = async (req, res) => {
  try {
    const { source_node_id, target_node_id, weight, type, bidirectional = true } = req.body;
    if (!source_node_id || !target_node_id || weight === undefined) {
      return res.status(400).json({ error: 'Missing source_node_id, target_node_id, or weight.' });
    }
    const numericWeight = Number(weight);
    const validTypes = new Set(['corridor', 'staircase', 'lift', 'ramp']);
    if (source_node_id === target_node_id || !Number.isFinite(numericWeight) || numericWeight <= 0) {
      return res.status(400).json({ error: 'Path endpoints must differ and weight must be a positive number.' });
    }
    if (type && !validTypes.has(type)) {
      return res.status(400).json({ error: 'Invalid path edge type.' });
    }
    const [sourceNode, targetNode] = await Promise.all([
      db.getNodeById(source_node_id),
      db.getNodeById(target_node_id)
    ]);
    if (!sourceNode || !targetNode) {
      return res.status(400).json({ error: 'Both path endpoints must be existing campus locations.' });
    }

    const newEdge = {
      id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      source_node_id,
      target_node_id,
      weight: numericWeight,
      type: type || 'corridor',
      bidirectional: bidirectional ? 1 : 0
    };

    const saved = await db.createEdge(newEdge);
    awsService.logMetric('AdminEdgeCreated', 1, 'Count');
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create edge.' });
  }
};

exports.updateEdge = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_blocked } = req.body;
    if (typeof is_blocked !== 'boolean') {
      return res.status(400).json({ error: 'is_blocked must be a boolean.' });
    }

    const updated = await db.updateEdge(id, { is_blocked: is_blocked ? 1 : 0 });
    if (!updated) return res.status(404).json({ error: 'Path edge not found.' });

    awsService.logMetric(is_blocked ? 'AdminPathBlocked' : 'AdminPathUnblocked', 1, 'Count');
    return res.json(updated);
  } catch (error) {
    console.error('Update edge status error:', error);
    return res.status(500).json({ error: 'Failed to update path status.' });
  }
};

exports.updateBlockAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_available } = req.body || {};
    if (typeof is_available !== 'boolean') {
      return res.status(400).json({ error: 'is_available must be a boolean.' });
    }

    const updatedNodes = await db.updateBlockAvailability(id, is_available);
    if (updatedNodes === 0) return res.status(404).json({ error: 'No campus locations found for this building.' });
    awsService.logMetric(is_available ? 'AdminBuildingReopened' : 'AdminBuildingUnavailable', 1, 'Count');
    return res.json({ success: true, block_id: id, is_available, updatedNodes });
  } catch (error) {
    console.error('Update building availability error:', error);
    return res.status(500).json({ error: 'Failed to update building availability.' });
  }
};

exports.deleteEdge = async (req, res) => {
  try {
    const { id } = req.params;
    await db.deleteEdge(id);
    res.json({ success: true, message: `Edge ${id} deleted.` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete edge.' });
  }
};

exports.uploadFloorPlan = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No floor plan file uploaded.' });
    }

    const { floorId } = req.body;
    const uploadResult = await awsService.uploadFloorPlan(req.file.buffer, req.file.originalname, req.file.mimetype);

    if (floorId) {
      await db.updateFloor(floorId, { map_image_url: uploadResult.url });
    }

    res.json({
      success: true,
      file: uploadResult,
      message: 'Floor plan successfully uploaded.'
    });
  } catch (error) {
    console.error('Floor plan upload error:', error);
    res.status(500).json({ error: 'Failed to upload floor plan.' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const stats = await db.getAnalyticsSummary();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve stats.' });
  }
};

exports.resetToDefault = async (req, res) => {
  try {
    await seedDatabase();
    res.json({ success: true, message: 'Campus graph reset to RV University SoCSE default paper model.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset database.' });
  }
};
