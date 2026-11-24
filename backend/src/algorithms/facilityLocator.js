/**
 * CampusNav - Nearby Facility Search Engine
 * Implements Section IV.E from "CampusNav: Cloud-Based Smart Indoor Campus Navigation and Facility Locator Using AWS"
 * 
 * Executes single-source Dijkstra from user's location to return closest facilities
 * ordered strictly by graph walking cost (not Euclidean straight-line distance).
 */

const { buildAdjacencyList, MinPriorityQueue } = require('./dijkstra');

function findNearbyFacilities(nodes, edges, sourceId, options = {}) {
  const {
    facilityType = null, // e.g. 'canteen', 'library', 'washroom', 'emergency_exit'
    limit = 5,
    accessible = false,
    penaltyM = 10000
  } = options;

  const sourceNode = nodes.find(n => n.id === sourceId);
  if (!sourceNode) {
    return {
      success: false,
      error: 'Current location node not found.'
    };
  }

  const { adj, nodeMap } = buildAdjacencyList(nodes, edges, accessible, penaltyM);

  const distances = new Map();
  const rawDistances = new Map();
  const previous = new Map();
  const pq = new MinPriorityQueue();

  for (const n of nodes) {
    distances.set(n.id, Infinity);
    rawDistances.set(n.id, Infinity);
  }

  distances.set(sourceId, 0);
  rawDistances.set(sourceId, 0);
  pq.push(sourceId, 0);

  const settledFacilities = [];

  while (!pq.isEmpty()) {
    const { node: u, priority: currentDist } = pq.pop();

    if (currentDist > distances.get(u)) continue;

    const currentNode = nodeMap.get(u);

    // Check if this node matches facility criteria (and is not the source itself)
    if (u !== sourceId && isMatchingFacility(currentNode, facilityType)) {
      const walkingCost = rawDistances.get(u);
      
      // Reconstruct route
      const pathNodeIds = [];
      let curr = u;
      while (curr !== sourceId) {
        pathNodeIds.unshift(curr);
        const prevInfo = previous.get(curr);
        if (!prevInfo) break;
        curr = prevInfo.nodeId;
      }
      pathNodeIds.unshift(sourceId);

      settledFacilities.push({
        facility: currentNode,
        walkingDistanceMeters: walkingCost,
        walkingTimeMinutes: Math.ceil(walkingCost / 1.2 / 60),
        walkingTimeSeconds: Math.round(walkingCost / 1.2),
        pathNodeIds,
        floorId: currentNode.floor_id,
        isSameFloor: currentNode.floor_id === sourceNode.floor_id
      });

      if (settledFacilities.length >= limit) {
        break; // Settled required number of nearest facilities
      }
    }

    const neighbors = adj.get(u) || [];
    for (const neighbor of neighbors) {
      const v = neighbor.targetId;
      const alt = currentDist + neighbor.weight;

      if (alt < distances.get(v)) {
        distances.set(v, alt);
        rawDistances.set(v, (rawDistances.get(u) || 0) + neighbor.rawWeight);
        previous.set(v, {
          nodeId: u,
          edge: neighbor
        });
        pq.push(v, alt);
      }
    }
  }

  return {
    success: true,
    source: sourceNode,
    facilityType,
    accessibleMode: accessible,
    count: settledFacilities.length,
    facilities: settledFacilities
  };
}

function isMatchingFacility(node, targetType) {
  if (!node) return false;
  if (!targetType || targetType === 'all') {
    return Boolean(node.facility_type || node.type === 'facility');
  }

  const normTarget = targetType.toLowerCase().trim();
  const nodeType = (node.facility_type || node.type || '').toLowerCase().trim();

  // Match variants like 'washroom', 'restroom', 'toilet'
  if (normTarget === 'washroom' || normTarget === 'restroom') {
    return ['washroom', 'restroom', 'toilet'].includes(nodeType);
  }

  // Match emergency exits
  if (normTarget === 'emergency' || normTarget === 'emergency_exit') {
    return ['emergency', 'emergency_exit', 'fire_exit'].includes(nodeType);
  }

  return nodeType === normTarget || (node.name && node.name.toLowerCase().includes(normTarget));
}

module.exports = {
  findNearbyFacilities
};
