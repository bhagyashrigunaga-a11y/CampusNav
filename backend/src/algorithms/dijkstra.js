/**
 * CampusNav - Dijkstra's Routing Engine with Accessibility Penalty Mode
 * Implements Algorithm 1 from "CampusNav: Cloud-Based Smart Indoor Campus Navigation and Facility Locator Using AWS"
 * 
 * Authors: Prerana Prakash Talawar, Bhagyshree Laxmikant Gunaga, Bhuvana M G (RV University)
 */

class MinPriorityQueue {
  constructor() {
    this.heap = [];
  }

  push(node, priority, cost = priority) {
    this.heap.push({ node, priority, cost });
    this._bubbleUp(this.heap.length - 1);
  }

  pop() {
    if (this.isEmpty()) return null;
    const min = this.heap[0];
    const end = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = end;
      this._sinkDown(0);
    }
    return min;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  _bubbleUp(index) {
    const element = this.heap[index];
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      const parent = this.heap[parentIndex];
      if (element.priority >= parent.priority) break;
      this.heap[index] = parent;
      this.heap[parentIndex] = element;
      index = parentIndex;
    }
  }

  _sinkDown(index) {
    const length = this.heap.length;
    const element = this.heap[index];

    while (true) {
      let leftChildIndex = 2 * index + 1;
      let rightChildIndex = 2 * index + 2;
      let leftChild, rightChild;
      let swap = null;

      if (leftChildIndex < length) {
        leftChild = this.heap[leftChildIndex];
        if (leftChild.priority < element.priority) {
          swap = leftChildIndex;
        }
      }

      if (rightChildIndex < length) {
        rightChild = this.heap[rightChildIndex];
        if (
          (swap === null && rightChild.priority < element.priority) ||
          (swap !== null && rightChild.priority < leftChild.priority)
        ) {
          swap = rightChildIndex;
        }
      }

      if (swap === null) break;
      this.heap[index] = this.heap[swap];
      this.heap[swap] = element;
      index = swap;
    }
  }
}

/**
 * Builds adjacency list from edges list with accessibility weight adjustments
 * @param {Array} nodes 
 * @param {Array} edges 
 * @param {Boolean} accessible 
 * @param {Number} penaltyM 
 */
function buildAdjacencyList(nodes, edges, accessible = false, penaltyM = 10000) {
  const adj = new Map();
  const nodeMap = new Map();
  const unavailableNodeIds = new Set(
    nodes.filter(n =>
      n.is_available === false || n.is_available === 0 || n.is_available === '0' ||
      n.availability_status === 'unavailable'
    ).map(n => n.id)
  );

  for (const n of nodes) {
    adj.set(n.id, []);
    nodeMap.set(n.id, n);
  }

  for (const edge of edges) {
    if (edge.is_blocked === true || edge.is_blocked === 1 ||
        unavailableNodeIds.has(edge.source_node_id) || unavailableNodeIds.has(edge.target_node_id)) {
      continue;
    }

    let effectiveWeight = Number(edge.weight) || 1;

    // Algorithm 1, lines 2-6:
    // if accessible and e is a staircase then w'(e) <- M {very large penalty}
    const isStairs = edge.type === 'staircase' || edge.type === 'stairs';
    if (accessible && isStairs) {
      effectiveWeight += penaltyM;
    }

    // Add forward direction
    if (adj.has(edge.source_node_id)) {
      adj.get(edge.source_node_id).push({
        targetId: edge.target_node_id,
        weight: effectiveWeight,
        rawWeight: Number(edge.weight) || 1,
        edgeId: edge.id,
        type: edge.type,
        edgeData: edge
      });
    }

    // Add reverse direction if bidirectional
    if (edge.bidirectional !== false && edge.bidirectional !== 0) {
      if (adj.has(edge.target_node_id)) {
        adj.get(edge.target_node_id).push({
          targetId: edge.source_node_id,
          weight: effectiveWeight,
          rawWeight: Number(edge.weight) || 1,
          edgeId: edge.id,
          type: edge.type,
          edgeData: edge
        });
      }
    }
  }

  return { adj, nodeMap };
}

/**
 * Executes Dijkstra's algorithm from source s to destination t
 * Complexity: O((|V| + |E|) log |V|)
 */
function findShortestPath(nodes, edges, sourceId, destinationId, options = {}) {
  const { accessible = false, penaltyM = 10000, algorithm = 'dijkstra' } = options;
  const routeAlgorithm = algorithm === 'astar' ? 'astar' : 'dijkstra';

  if (sourceId === destinationId) {
    const node = nodes.find(n => n.id === sourceId);
    if (!node) {
      return { success: false, error: 'Source or destination node not found in campus graph.' };
    }
    if (node.is_available === false || node.is_available === 0 || node.is_available === '0' ||
        node.availability_status === 'unavailable') {
      return { success: false, error: 'This location is currently unavailable.' };
    }
    return {
      success: true,
      path: [node],
      pathNodes: [node],
      edges: [],
      totalCost: 0,
      walkingTimeSeconds: 0,
      isAccessible: true,
      usesStairs: false,
      usesLift: false,
      instructions: [{ step: 1, text: `You are already at ${node ? node.name : 'destination'}.` }]
    };
  }

  const { adj, nodeMap } = buildAdjacencyList(nodes, edges, accessible, penaltyM);

  if (!nodeMap.has(sourceId) || !nodeMap.has(destinationId)) {
    return {
      success: false,
      error: 'Source or destination node not found in campus graph.'
    };
  }

  const unavailableSource = nodeMap.get(sourceId);
  const unavailableDestination = nodeMap.get(destinationId);
  if (unavailableSource && (unavailableSource.is_available === false ||
      unavailableSource.is_available === 0 || unavailableSource.is_available === '0' ||
      unavailableSource.availability_status === 'unavailable')) {
    return { success: false, error: 'The starting location is currently unavailable.' };
  }
  if (unavailableDestination && (unavailableDestination.is_available === false ||
      unavailableDestination.is_available === 0 || unavailableDestination.is_available === '0' ||
      unavailableDestination.availability_status === 'unavailable')) {
    return { success: false, error: 'This location is currently unavailable.' };
  }

  const distances = new Map();
  const rawDistances = new Map();
  const previous = new Map(); // stores { node: prevNodeId, edge: edgeObj }
  const pq = new MinPriorityQueue();
  const heuristic = routeAlgorithm === 'astar'
    ? createAdmissibleHeuristic(nodes, edges, destinationId)
    : () => 0;

  for (const n of nodes) {
    distances.set(n.id, Infinity);
    rawDistances.set(n.id, Infinity);
  }

  distances.set(sourceId, 0);
  rawDistances.set(sourceId, 0);
  pq.push(sourceId, heuristic(sourceId), 0);

  let destinationSettled = false;

  while (!pq.isEmpty()) {
    const { node: u, cost: currentDist } = pq.pop();

    if (u === destinationId) {
      destinationSettled = true;
      break;
    }

    if (currentDist > distances.get(u)) continue;

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
        pq.push(v, alt + heuristic(v), alt);
      }
    }
  }

  if (!destinationSettled && distances.get(destinationId) === Infinity) {
    return {
      success: false,
      error: 'No traversable route found between source and destination.'
    };
  }

  // Reconstruct path from t to s via predecessor links
  const pathNodeIds = [];
  const pathEdges = [];
  let curr = destinationId;
  let usesStairs = false;
  let usesLift = false;
  let usesRamp = false;

  while (curr !== sourceId) {
    pathNodeIds.unshift(curr);
    const prevInfo = previous.get(curr);
    if (!prevInfo) break;
    pathEdges.unshift(prevInfo.edge);
    if (prevInfo.edge.type === 'staircase' || prevInfo.edge.type === 'stairs') {
      usesStairs = true;
    }
    if (prevInfo.edge.type === 'lift') {
      usesLift = true;
    }
    if (prevInfo.edge.type === 'ramp') {
      usesRamp = true;
    }
    curr = prevInfo.nodeId;
  }
  pathNodeIds.unshift(sourceId);

  const pathNodes = pathNodeIds.map(id => nodeMap.get(id)).filter(Boolean);
  const totalCost = rawDistances.get(destinationId);
  // Average indoor walking speed is ~1.2 meters per second
  const walkingTimeSeconds = Math.round(totalCost / 1.2);

  // Generate turn-by-turn guidance
  const instructions = generateTurnByTurn(pathNodes, pathEdges);

  return {
    success: true,
    totalCost,
    walkingTimeSeconds,
    accessibleModeApplied: accessible,
    isAccessible: !usesStairs,
    usesStairs,
    usesLift,
    usesRamp,
    algorithm: routeAlgorithm,
    pathNodeIds,
    pathNodes,
    pathEdges,
    instructions
  };
}

function createAdmissibleHeuristic(nodes, edges, destinationId) {
  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  const destination = nodeMap.get(destinationId);
  if (!destination) return () => 0;
  const destinationX = Number(destination.x);
  const destinationY = Number(destination.y);
  if (!Number.isFinite(destinationX) || !Number.isFinite(destinationY)) return () => 0;

  let minimumCostPerMapUnit = Infinity;
  for (const edge of edges) {
    if (edge.is_blocked === true || edge.is_blocked === 1) continue;
    const from = nodeMap.get(edge.source_node_id);
    const to = nodeMap.get(edge.target_node_id);
    if (!from || !to) continue;
    const fromX = Number(from.x);
    const fromY = Number(from.y);
    const toX = Number(to.x);
    const toY = Number(to.y);
    if (![fromX, fromY, toX, toY].every(Number.isFinite)) continue;
    const distance = Math.hypot(fromX - toX, fromY - toY);
    const weight = Number(edge.weight);
    if (distance > 0 && Number.isFinite(weight) && weight >= 0) {
      minimumCostPerMapUnit = Math.min(minimumCostPerMapUnit, weight / distance);
    }
  }

  if (!Number.isFinite(minimumCostPerMapUnit)) return () => 0;
  return (nodeId) => {
    const node = nodeMap.get(nodeId);
    if (!node || node.floor_id !== destination.floor_id) return 0;
    const x = Number(node.x);
    const y = Number(node.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return 0;
    return Math.hypot(x - destinationX, y - destinationY) * minimumCostPerMapUnit;
  };
}

/**
 * Produces clear human-readable turn-by-turn directions
 */
function generateTurnByTurn(pathNodes, pathEdges) {
  if (pathNodes.length === 0) return [];
  const instructions = [];

  const start = pathNodes[0];
  instructions.push({
    step: 1,
    action: 'start',
    icon: 'map-pin',
    floor: start.floor_id,
    text: `Start at ${start.name} (${start.type})`
  });

  for (let i = 0; i < pathEdges.length; i++) {
    const edge = pathEdges[i];
    const fromNode = pathNodes[i];
    const toNode = pathNodes[i + 1];
    const stepNum = instructions.length + 1;

    if (edge.type === 'lift') {
      instructions.push({
        step: stepNum,
        action: 'lift',
        icon: 'lift',
        floor: toNode.floor_id,
        text: `Take ${fromNode.name} to ${toNode.name} (Floor transition)`
      });
    } else if (edge.type === 'staircase' || edge.type === 'stairs') {
      instructions.push({
        step: stepNum,
        action: 'stairs',
        icon: 'stairs',
        floor: toNode.floor_id,
        text: `Use ${fromNode.name} to reach ${toNode.name} (Cost: ${edge.rawWeight}m)`
      });
    } else if (edge.type === 'ramp') {
      instructions.push({
        step: stepNum,
        action: 'ramp',
        icon: 'ramp',
        floor: toNode.floor_id,
        text: `Follow ramp from ${fromNode.name} to ${toNode.name}`
      });
    } else {
      const previousNode = pathNodes[i - 1];
      let direction = 'Continue';
      if (previousNode && previousNode.floor_id === fromNode.floor_id &&
          toNode.floor_id === fromNode.floor_id) {
        direction = getTurnDirection(previousNode, fromNode, toNode);
      }
      instructions.push({
        step: stepNum,
        action: 'walk',
        icon: 'walk',
        floor: fromNode.floor_id,
        text: `${direction} for ${edge.rawWeight}m along the corridor towards ${toNode.name}`
      });
    }
  }

  const end = pathNodes[pathNodes.length - 1];
  instructions.push({
    step: instructions.length + 1,
    action: 'arrive',
    icon: 'flag',
    floor: end.floor_id,
    text: `You have arrived at your destination: ${end.name}`
  });

  return instructions;
}

function getTurnDirection(previousNode, currentNode, nextNode) {
  const incomingX = Number(currentNode.x) - Number(previousNode.x);
  const incomingY = Number(currentNode.y) - Number(previousNode.y);
  const outgoingX = Number(nextNode.x) - Number(currentNode.x);
  const outgoingY = Number(nextNode.y) - Number(currentNode.y);
  const angle = Math.atan2(
    incomingX * outgoingY - incomingY * outgoingX,
    incomingX * outgoingX + incomingY * outgoingY
  ) * 180 / Math.PI;

  if (!Number.isFinite(angle) || Math.abs(angle) < 30) return 'Continue straight';
  if (Math.abs(angle) > 150) return 'Turn around';
  return angle > 0 ? 'Turn right' : 'Turn left';
}

module.exports = {
  findShortestPath,
  findAStarPath: (nodes, edges, sourceId, destinationId, options = {}) =>
    findShortestPath(nodes, edges, sourceId, destinationId, { ...options, algorithm: 'astar' }),
  buildAdjacencyList,
  MinPriorityQueue
};
