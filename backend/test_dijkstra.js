const assert = require('assert');
const db = require('./src/config/db');
const { findShortestPath, findAStarPath } = require('./src/algorithms/dijkstra');
const { findNearbyFacilities } = require('./src/algorithms/facilityLocator');

async function test() {
  const nodes = await db.getNodes();
  const edges = await db.getEdges();
  const sourceId = 'out-node-gate';
  const destinationId = 'block-c-2-cslab';

  console.log('--- Standard route (Main Gate -> C Block CS Lab) ---');
  const quickResult = findShortestPath(nodes, edges, sourceId, destinationId);
  assert.strictEqual(quickResult.success, true, quickResult.error);
  assert.strictEqual(quickResult.totalCost, 241);
  assert.strictEqual(quickResult.pathNodes[0].id, sourceId);
  assert.strictEqual(quickResult.pathNodes.at(-1).id, destinationId);
  console.log(`Dijkstra route found: ${quickResult.totalCost}m`);

  console.log('\n--- Accessible route ---');
  const accessibleResult = findShortestPath(nodes, edges, sourceId, destinationId, { accessible: true });
  assert.strictEqual(accessibleResult.success, true, accessibleResult.error);
  assert.strictEqual(accessibleResult.usesStairs, false);
  assert.strictEqual(accessibleResult.usesLift, true);
  console.log(`Accessible route found: ${accessibleResult.totalCost}m`);

  console.log('\n--- A* parity and blocked-edge avoidance ---');
  const fixtureNodes = [
    { id: 's', floor_id: 'g', x: 0, y: 0 },
    { id: 'a', floor_id: 'g', x: 1, y: 0 },
    { id: 'b', floor_id: 'g', x: 0, y: 1 },
    { id: 't', floor_id: 'g', x: 1, y: 1 }
  ];
  const fixtureEdges = [
    { id: 'sa', source_node_id: 's', target_node_id: 'a', weight: 1, type: 'corridor', bidirectional: true },
    { id: 'at', source_node_id: 'a', target_node_id: 't', weight: 1, type: 'corridor', bidirectional: true, is_blocked: true },
    { id: 'sb', source_node_id: 's', target_node_id: 'b', weight: 2, type: 'corridor', bidirectional: true },
    { id: 'bt', source_node_id: 'b', target_node_id: 't', weight: 2, type: 'corridor', bidirectional: true }
  ];
  const shortest = findShortestPath(fixtureNodes, fixtureEdges, 's', 't');
  const astar = findAStarPath(fixtureNodes, fixtureEdges, 's', 't');
  assert.strictEqual(shortest.totalCost, 4);
  assert.strictEqual(astar.totalCost, shortest.totalCost);
  assert.deepStrictEqual(astar.pathNodeIds, ['s', 'b', 't']);
  console.log(`A* found the same valid cost (${astar.totalCost}) while avoiding the blocked edge.`);

  console.log('\n--- Nearby facility lookup ---');
  const facilities = findNearbyFacilities(nodes, edges, sourceId);
  assert.strictEqual(facilities.success, true);
  assert.ok(facilities.count > 0);
  console.log(`Found ${facilities.count} nearby facilities.`);
}

test().catch(error => {
  console.error('Algorithm verification failed:', error);
  process.exitCode = 1;
});
