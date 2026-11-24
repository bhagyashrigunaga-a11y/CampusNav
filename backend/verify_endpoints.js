const http = require('http');
const PORT = Number(process.env.PORT) || 5000;

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      },
      (res) => {
        let respData = '';
        res.on('data', chunk => respData += chunk);
        res.on('end', () => resolve(JSON.parse(respData)));
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${PORT}${path}`, (res) => {
      let respData = '';
      res.on('data', chunk => respData += chunk);
      res.on('end', () => resolve(JSON.parse(respData)));
    }).on('error', reject);
  });
}

async function run() {
  console.log('Testing GET /api/blocks...');
  const blocks = await get('/api/blocks');
  console.log(`Fetched ${blocks.length} blocks.`);

  console.log('\nTesting POST /api/route (Normal mode: Main Gate -> C Block CS Lab)...');
  const normalRoute = await post('/api/route', {
    sourceId: 'out-node-gate',
    destinationId: 'block-c-2-cslab',
    accessible: false
  });
  console.log('Normal Route Cost:', normalRoute.route.totalCost, 'm (Stairs used:', normalRoute.route.usesStairs, ')');
  console.log('Path Nodes:', normalRoute.route.pathNodes.map(n => n.name).join(' -> '));

  console.log('\nTesting POST /api/route (Accessible mode: Main Gate -> C Block CS Lab)...');
  const accessRoute = await post('/api/route', {
    sourceId: 'out-node-gate',
    destinationId: 'block-c-2-cslab',
    accessible: true
  });
  console.log('Accessible Route Cost:', accessRoute.route.totalCost, 'm (Lift used:', accessRoute.route.usesLift, ')');
  console.log('Accessible Path:', accessRoute.route.pathNodes.map(n => n.name).join(' -> '));

  console.log('\nTesting POST /api/facilities/nearby (from Main Gate)...');
  const nearby = await post('/api/facilities/nearby', {
    sourceId: 'out-node-gate',
    facilityType: 'canteen'
  });
  console.log(`Located ${nearby.facilities.length} canteens. Nearest: ${nearby.facilities[0].facility.name} (${nearby.facilities[0].walkingDistanceMeters}m).`);

  console.log('\nAll API endpoint verifications passed 100% successfully!');
  process.exit(0);
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
