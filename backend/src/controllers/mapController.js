const db = require('../config/db');
const QRCode = require('qrcode');

exports.getLocationQr = async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^[a-zA-Z0-9._-]{1,100}$/.test(id)) {
      return res.status(400).json({ error: 'Invalid campus location ID.' });
    }

    const node = await db.getNodeById(id);
    if (!node) return res.status(404).json({ error: 'Campus location not found.' });

    const image = await QRCode.toBuffer(`CAMPUSNAV:LOCATION:${node.id}`, {
      type: 'png',
      errorCorrectionLevel: 'M',
      width: 360,
      margin: 2
    });
    res.type('png');
    res.set('Content-Disposition', `inline; filename="campusnav-${id}.png"`);
    return res.send(image);
  } catch (error) {
    console.error('Location QR generation error:', error);
    return res.status(500).json({ error: 'Failed to generate location QR code.' });
  }
};

exports.getBlocks = async (req, res) => {
  try {
    const blocks = await db.getBlocks();
    res.json(blocks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch campus blocks.' });
  }
};

exports.getFloors = async (req, res) => {
  try {
    const { blockId } = req.query;
    const floors = await db.getFloors(blockId);
    res.json(floors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch floors.' });
  }
};

exports.getNodes = async (req, res) => {
  try {
    const { floorId, blockId } = req.query;
    const nodes = await db.getNodes(floorId, blockId);
    res.json(nodes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch nodes.' });
  }
};

exports.getEdges = async (req, res) => {
  try {
    const { floorId } = req.query;
    const edges = await db.getEdges(floorId);
    res.json(edges);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch graph edges.' });
  }
};

exports.searchLocations = async (req, res) => {
  try {
    const { q, type } = req.query;
    const nodes = await db.getNodes();

    if (!q || q.trim() === '') {
      return res.json(nodes.slice(0, 20));
    }

    const query = q.toLowerCase().trim();
    const results = nodes.filter(node => {
      const matchName = node.name.toLowerCase().includes(query);
      const matchCode = (node.code || '').toLowerCase().includes(query);
      const matchDesc = (node.description || '').toLowerCase().includes(query);
      const matchFac = (node.facility_type || '').toLowerCase().includes(query);
      const matchType = (node.type || '').toLowerCase().includes(query);

      const matchesQuery = matchName || matchCode || matchDesc || matchFac || matchType;
      if (type) {
        return matchesQuery && (node.type === type || node.facility_type === type);
      }
      return matchesQuery;
    });

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search locations.' });
  }
};
