const db = require('../config/db');
const { findShortestPath } = require('../algorithms/dijkstra');
const awsService = require('../services/awsService');

exports.calculateRoute = async (req, res) => {
  const startTime = Date.now();
  try {
    const { sourceId, destinationId, accessible = false, algorithm = 'dijkstra' } = req.body;

    if (!sourceId || !destinationId) {
      return res.status(400).json({ error: 'Source and destination IDs are required.' });
    }
    if (!['dijkstra', 'astar'].includes(algorithm)) {
      return res.status(400).json({ error: 'algorithm must be either "dijkstra" or "astar".' });
    }

    const nodes = await db.getNodes();
    const edges = await db.getEdges();

    // Compute primary requested route
    const route = findShortestPath(nodes, edges, sourceId, destinationId, {
      accessible: Boolean(accessible),
      algorithm
    });

    if (!route.success) {
      return res.status(404).json({ error: route.error || 'No path could be found between specified locations.' });
    }

    // If normal mode was requested and it uses stairs, also precalculate the accessible route
    // so the frontend can offer an instant toggle or side-by-side comparison (as in Fig. 2)
    let accessibleAlternative = null;
    if (!accessible && route.usesStairs) {
      accessibleAlternative = findShortestPath(nodes, edges, sourceId, destinationId, {
        accessible: true,
        algorithm
      });
    }

    // Log analytics & CloudWatch metrics
    const durationMs = Date.now() - startTime;
    awsService.logMetric('RouteCalculationLatency', durationMs, 'Milliseconds', {
      Accessible: accessible ? 'True' : 'False'
    });
    awsService.logMetric('RouteCalculationsCount', 1, 'Count');

    await db.logAnalytics({
      eventType: 'route_calculation',
      sourceId,
      targetId: destinationId,
      accessibleMode: accessible
    });

    return res.json({
      success: true,
      route,
      accessibleAlternative,
      calculationTimeMs: durationMs
    });
  } catch (error) {
    console.error('Route calculation error:', error);
    return res.status(500).json({ error: 'Internal server error calculating route.' });
  }
};
