const db = require('../config/db');
const { findNearbyFacilities } = require('../algorithms/facilityLocator');
const awsService = require('../services/awsService');

exports.getNearbyFacilities = async (req, res) => {
  const startTime = Date.now();
  try {
    const { sourceId, facilityType, limit = 5, accessible = false } = req.body;

    if (!sourceId) {
      return res.status(400).json({ error: 'Current location (sourceId) is required.' });
    }

    const nodes = await db.getNodes();
    const edges = await db.getEdges();

    const result = findNearbyFacilities(nodes, edges, sourceId, {
      facilityType,
      limit: Number(limit) || 5,
      accessible: Boolean(accessible)
    });

    if (!result.success) {
      return res.status(404).json({ error: result.error || 'Failed to locate nearby facilities.' });
    }

    awsService.logMetric('NearbyFacilitySearches', 1, 'Count', {
      FacilityType: facilityType || 'all'
    });

    await db.logAnalytics({
      eventType: 'facility_search',
      sourceId,
      targetId: facilityType || 'all',
      accessibleMode: accessible
    });

    return res.json({
      success: true,
      ...result,
      durationMs: Date.now() - startTime
    });
  } catch (error) {
    console.error('Nearby facilities error:', error);
    return res.status(500).json({ error: 'Internal server error locating facilities.' });
  }
};
