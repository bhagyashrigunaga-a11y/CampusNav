const db = require('../config/db');

function validateFacultyFields(fields, partial = false) {
  const updates = {};
  for (const field of ['name', 'department', 'designation']) {
    if (!partial || Object.prototype.hasOwnProperty.call(fields, field)) {
      if (typeof fields[field] !== 'string' || !fields[field].trim()) {
        return { error: `${field} is required.` };
      }
      updates[field] = fields[field].trim();
    }
  }
  for (const field of ['cabin', 'room_no', 'floor']) {
    if (Object.prototype.hasOwnProperty.call(fields, field)) {
      if (typeof fields[field] !== 'string') {
        return { error: `${field} must be a string.` };
      }
      updates[field] = fields[field].trim();
    } else if (!partial) {
      updates[field] = '';
    }
  }
  if (Object.prototype.hasOwnProperty.call(fields, 'office_node_id')) {
    updates.office_node_id = fields.office_node_id || null;
  } else if (!partial) {
    updates.office_node_id = null;
  }
  return { updates };
}

exports.list = async (req, res) => {
  try {
    const query = String(req.query.q || '').trim().slice(0, 100);
    return res.json(await db.getFaculty(query));
  } catch (error) {
    console.error('Faculty directory error:', error);
    return res.status(500).json({ error: 'Failed to load faculty directory.' });
  }
};

exports.create = async (req, res) => {
  try {
    const { error, updates } = validateFacultyFields(req.body || {});
    if (error) return res.status(400).json({ error });
    if (updates.office_node_id && !(await db.getNodeById(updates.office_node_id))) {
      return res.status(400).json({ error: 'Office location must reference an existing campus location.' });
    }
    const person = {
      id: `faculty-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ...updates
    };
    return res.status(201).json(await db.createFaculty(person));
  } catch (error) {
    console.error('Create faculty record error:', error);
    return res.status(500).json({ error: 'Failed to create faculty record.' });
  }
};

exports.update = async (req, res) => {
  try {
    const { error, updates } = validateFacultyFields(req.body || {}, true);
    if (error) return res.status(400).json({ error });
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'At least one faculty field is required.' });
    }
    if (updates.office_node_id && !(await db.getNodeById(updates.office_node_id))) {
      return res.status(400).json({ error: 'Office location must reference an existing campus location.' });
    }
    const updated = await db.updateFaculty(req.params.id, updates);
    if (!updated) return res.status(404).json({ error: 'Faculty record not found.' });
    return res.json(updated);
  } catch (error) {
    console.error('Update faculty record error:', error);
    return res.status(500).json({ error: 'Failed to update faculty record.' });
  }
};

exports.remove = async (req, res) => {
  try {
    const deleted = await db.deleteFaculty(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Faculty record not found.' });
    return res.json({ success: true });
  } catch (error) {
    console.error('Delete faculty record error:', error);
    return res.status(500).json({ error: 'Failed to delete faculty record.' });
  }
};
