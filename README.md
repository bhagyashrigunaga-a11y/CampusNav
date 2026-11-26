# CampusNav: Cloud-Based Smart Indoor Campus Navigation and Facility Locator Using AWS

**Authors:**
- **Prerana Prakash Talawar** (USN: `1RUA24CSE0333`)
- **Bhagyshri Laxmikant Gunaga** (USN: `1RUA24CSE0084`)
- **Bhuvana M G** (USN: `1RUA24CSE0092`)

*School of Computer Science and Engineering (SoCSE), RV University, Bengaluru, India*

---

## 🌟 Executive Summary

Large educational institutions contain numerous academic blocks, multiple floors, and dozens of classrooms, laboratories, and administrative facilities. New students, faculty, and visitors frequently lose time asking for directions or walking to the wrong block. Outdoor GPS navigation tools fail inside multi-floor buildings, while static campus maps neither compute a navigable route nor indicate nearby amenities.

**CampusNav** solves this challenge through a cloud-hosted, graph-based indoor navigation and facility locator system built on **Amazon Web Services (AWS)**. It models the campus as a weighted graph, provides shortest-route pathfinding with **Dijkstra’s algorithm**, features a dedicated **Accessibility Mode** that penalizes stairs to ensure step-free access for wheelchair users, locates nearby facilities by actual walking distance, and offers a comprehensive web-based **Administrator Dashboard** to update floor plans, rooms, and pathways without changing code.

---

## 🚀 Key Features

1. **Shortest Route Computation (Dijkstra's Algorithm):**
   - High-performance priority-queue implementation running in $\mathcal{O}((|V| + |E|) \log |V|)$.
   - Real-time walking distance, estimated travel time, and turn-by-turn navigation instructions.
2. **Accessible Route Mode (Algorithm 1 from Paper):**
   - Penalizes staircase edges with a large cost $M$ ($w'(e) \leftarrow M$).
   - Automatically guides users requiring step-free navigation to elevators/lifts and ramps.
   - Side-by-side comparison with the quickest route (as shown in Figure 2 of the paper: Quickest via Stairs B = 66, Accessible via Lift 2 = 75).
3. **Interactive Walking Simulator Engine:**
   - Real-time animated simulation mode where a walker/wheelchair avatar traverses the computed path node-by-node.
   - Automatic floor switching as the simulated user ascends via lifts or stairs.
4. **Academic Routing Benchmark & Comparative Table:**
   - Head-to-head parameter table comparing Standard Route vs Accessible Mode Route vs $\Delta$ variance (distance, walking time, vertical transit facility, latency, theoretical complexity bounds).
5. **Campus Facility Distance Matrix & Directory Table:**
   - Searchable, filterable directory comparing true Dijkstra graph walking distance against straight-line Euclidean distance from the user's location.
6. **Graph Topology & Edge Weight Inspector:**
   - Mathematical graph inspector displaying vertices $|V| = 22$ and edges $|E| = 26$ with base weights $w(e)$ and dynamic penalty weights $w'(e)$.
7. **Interactive AWS Free-Tier & Cost Calculator (Table II):**
   - Live prototype-scale vs production-scale usage calculator tracking EC2, RDS MySQL, S3, Lambda, API Gateway, and CloudWatch Free-Tier quotas.
8. **Interactive Multi-Floor SVG Map Canvas:**
   - Multi-floor switching (Ground Floor, 1st Floor, 2nd Floor).
   - Animated directional pulse and glowing path highlighting.
   - Zoom in/out, pan, and click-to-select starting points and destinations.
9. **Administrator Management Layer:**
   - Add, edit, or delete rooms, corridor junctions, staircases, lifts, and facilities.
   - Connect nodes with weighted traversable edges.
   - Upload new architectural floor plans to Amazon S3.
   - Real-time CloudWatch metrics and query analytics.
6. **Cost-Aware AWS Architecture (Free-Tier Optimized):**
   - Amazon EC2 (stateful in-memory graph route engine).
   - Amazon RDS for MySQL (relational schemas).
   - Amazon S3 (floor plan images; RDS stores only object URLs).
   - AWS Lambda & API Gateway (serverless lightweight search).
   - Amazon CloudWatch & AWS IAM (monitoring and least-privilege security).

---

## 🏗️ System Architecture (Figure 1 & Table I)

```
       +---------------------------------------------+
       |   Users (Students, Faculty, Visitors)       |
       +---------------------------------------------+
                              |
                              v
       +---------------------------------------------+
       |   Amazon EC2 (Web App / API / Dijkstra)     |
       +---------------------------------------------+
           |                  |                   |
           v                  v                   v
   +--------------+   +---------------+   +---------------+
   | API Gateway  |   | Amazon RDS    |   |  Amazon S3    |
   | & AWS Lambda |   |    (MySQL)    |   |  (Floor Plans)|
   | (Search API) |   | (Rooms/Routes)|   +---------------+
   +--------------+   +---------------+
           |                  |                   |
           +------------------+-------------------+
                              |
                              v
       +---------------------------------------------+
       |   AWS IAM & Amazon CloudWatch Monitoring    |
       +---------------------------------------------+
```

| AWS Service | Function in CampusNav | Prototype Usage & Cost Impact |
| :--- | :--- | :--- |
| **Amazon EC2** | Hosts web app and Dijkstra route engine; caches graph in RAM. | 1 $\times$ `t3.micro` instance (AWS Free Tier: 750 hrs/month). |
| **Amazon RDS (MySQL)** | Stores blocks, floors, locations, graph edges, and user accounts. | 1 $\times$ `db.t3.micro` instance, 20 GB storage (AWS Free Tier). |
| **Amazon S3** | Stores floor-plan images and architectural SVGs. | $< 1$ GB storage (Free Tier allowance). |
| **AWS Lambda & API Gateway** | Serverless endpoints for lightweight search and notifications. | 10K–50K calls (within 1M free monthly requests). |
| **AWS IAM** | Enforces least-privilege access without hardcoded credentials. | Free. |
| **Amazon VPC** | Isolates RDS in private subnets with security group restrictions. | Generally free (without NAT Gateway). |
| **Amazon CloudWatch** | Collects operational logs, route calculation latency, and alarms. | Free log allowance ($< 5$ GB/month). |

---

## 📐 Mathematical Model & Dijkstra Algorithm

### 1. Graph Model
The campus is represented as a directed/bidirectional weighted graph $G = (V, E, w)$:
- $V$: Vertices representing rooms, corridor junctions, entrances, staircases, lifts, ramps, and facilities.
- $E$: Edges representing traversable walking paths.
- $w(e)$: Walking cost in meters or travel time in seconds.

### 2. Algorithm 1: Route Computation with Accessibility Mode
```
Require: Graph G = (V, E, w), source s, destination t, flag accessible
Ensure: Minimum-cost path P from s to t
1: for each edge e in E do
2:    if accessible and e is a staircase then
3:       w'(e) <- M  {very large penalty}
4:    else
5:       w'(e) <- w(e)
6:    end if
7: end for
8: Run Dijkstra on (V, E, w') from s
9: return path to t via predecessor links
```

### 3. Worked Example (Section IV.D / Figure 2):
```
Entrance ----(30)----> Block C ----(8)----> Stairs B ----(8)----> Corr B ----(20)----> CS Lab 2
   |                     |                                          ^
   |                     +-------(10)-----> Lift 2 -------(15)------+
   |                                      (Accessible)
```
- **Quickest Route (Standard Mode):**
  $\text{Entrance} \to \text{Block C} \to \text{Stairs B} \to \text{Corr B} \to \text{CS Lab 2}$  
  $\text{Total Cost} = 30 + 8 + 8 + 20 = \mathbf{66}$
- **Accessible Route (Accessibility Mode Enabled):**
  Stairs are penalized with $M$. Dijkstra naturally selects:  
  $\text{Entrance} \to \text{Block C} \to \text{Lift 2} \to \text{Corr B} \to \text{CS Lab 2}$  
  $\text{Total Cost} = 30 + 10 + 15 + 20 = \mathbf{75}$  
  *(Step-free and wheelchair-accessible)*.

---

## 📂 Project Directory Structure

```
CAMPUS NAV/
├── backend/
│   ├── src/
│   │   ├── algorithms/
│   │   │   ├── dijkstra.js            # Dijkstra min-heap engine & turn-by-turn generator
│   │   │   └── facilityLocator.js     # Single-source Dijkstra facility search
│   │   ├── config/
│   │   │   ├── aws.js                 # AWS S3 and CloudWatch service integration
│   │   │   └── db.js                  # Dual DB driver: AWS RDS MySQL + zero-setup local store
│   │   ├── controllers/
│   │   │   ├── adminController.js     # Node/Edge CRUD, map upload, usage stats
│   │   │   ├── authController.js      # Role-based auth (admin, student, visitor)
│   │   │   ├── facilityController.js  # Nearby facility search API
│   │   │   ├── mapController.js       # Blocks, floors, nodes, edges & search
│   │   │   └── routeController.js     # Route computation & side-by-side comparison
│   │   ├── models/
│   │   │   └── seed.js                # RV University SoCSE campus seed data (Fig. 2)
│   │   ├── routes/
│   │   │   └── api.js                 # Express API router
│   │   ├── lambda.js                  # AWS Lambda serverless handler
│   │   └── server.js                  # Express server for EC2 / local execution
│   ├── data/
│   │   └── campusnav_db.json          # Pre-seeded local graph database
│   ├── schema.sql                     # Production MySQL schema for Amazon RDS
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminDashboard.jsx     # Node/Edge editor & CloudWatch analytics
│   │   │   ├── AwsArchitectureModal.jsx # Visual 5-layer AWS architecture viewer
│   │   │   ├── CampusMap.jsx          # Interactive multi-floor SVG map canvas
│   │   │   ├── FacilityLocatorPanel.jsx # Nearby amenities panel
│   │   │   ├── Navbar.jsx             # Top bar with Fig. 2 demo & accessibility switch
│   │   │   └── RouteSearchPanel.jsx   # Search inputs, turn-by-turn guidance
│   │   ├── services/
│   │   │   └── api.js                 # Client API layer
│   │   ├── App.jsx                    # Root React component
│   │   ├── index.css                  # Tailwind styles & animations
│   │   └── main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── aws/
│   └── cloudformation.yml             # Full CloudFormation template (VPC, EC2, RDS, S3, IAM)
├── package.json                       # Root script orchestrator
└── README.md                          # Documentation
```

---

## ⚡ Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 2. Run the Application
The project includes a unified production build that serves both the frontend web app and the backend API from a single server on port `5000`:

```bash
# Start the unified CampusNav application
npm start
```

Now open your web browser and navigate to:
👉 **`http://localhost:5000/`**

### 3. Alternative: Running in Split Dev Mode
If you wish to edit frontend code with instant Vite Hot Module Replacement (HMR):

- **Terminal 1 (Backend API):**
  ```bash
  npm run dev:backend
  ```
  *Runs Express on `http://localhost:5000`*

- **Terminal 2 (Frontend Dev Server):**
  ```bash
  npm run dev:frontend
  ```
  *Runs Vite on `http://localhost:3000` with automated proxy to backend*

### 4. Resetting Campus Graph to Paper Baseline
To restore the database back to the RV University School of Computer Science default model:
```bash
npm run seed
```

### 5. Administrator setup
Administrator APIs are protected. Configure the local administrator before opening the Admin Portal:

```powershell
Copy-Item backend\.env.example backend\.env
node -p "require('crypto').randomBytes(32).toString('hex')"
```

Set `ADMIN_USERNAME`, a unique `ADMIN_PASSWORD`, and the generated value as `ADMIN_TOKEN_SECRET` in `backend\.env`. The same environment file is loaded by both `run.bat` and `npm start`. Do not commit `backend\.env` or use development credentials on a public server. Administrator sessions expire after eight hours; production deployments must use HTTPS.

Open **Admin Login** in the top navigation and sign in with the server-configured administrator credentials to reach the Admin Portal. It can:
- Block/reopen individual graph edges and update classroom/location availability.
- Mark all locations in a building unavailable or reopen the building.
- Generate printable PNG QR codes for existing location IDs.
- Maintain verified faculty/staff records with cabin, room number, floor, and optional linked campus office; admins can add, edit, and delete records.

For an existing MySQL database, apply `backend/migrations/001_dynamic_route_status.sql` once before using the new route/status fields, then `backend/migrations/002_faculty_location_details.sql` for faculty cabin, room number, and floor fields, and `backend/migrations/003_floor_plan_object_key.sql` before uploading floor plans. The last migration adds persistent S3 object-key storage so expiring signed URLs are generated when floors are fetched rather than saved in MySQL. Fresh databases receive these fields from `backend/schema.sql`. Back up the database before applying migrations.

### 6. Navigation additions and requirements
- Dijkstra remains the default. A* can be selected in the route panel; it uses an admissible coordinate heuristic and falls back to a zero heuristic where map coordinates cannot safely guide the search.
- Blocked paths and locations marked unavailable are excluded from route calculation. After an administrator changes conditions, the current route is recalculated.
- Route instructions can be stepped through; selecting a step switches the indoor map to that floor and highlights the current segment.
- The indoor walking tracker estimates steps and distance from device motion, and shows approximate calories burned using the entered body weight. Calorie values are estimates, not medical measurements.
- Voice search and spoken instructions use browser speech APIs and require microphone permission/browser support.
- QR scanning uses the device camera and the browser `BarcodeDetector` API. It requires camera permission and a secure context (localhost or HTTPS). Admin-generated codes contain the location ID; print and place the labels at the corresponding real locations. Manual starting-location selection remains available.
- The map's **Save offline** control caches the campus overview image and current blocks/floors/nodes/edges. The production app shell and static assets are cached by a service worker; offline route calculation uses cached graph data when available, otherwise the bundled fallback data.
- The project currently includes the RVU campus overview image, but not verified floor-plan images for each building/floor. Do not treat generated sample graph coordinates or sample timetable entries as official campus data. Supply approved floor plans and records before using them for real-world directions or live occupancy.
- Floor-plan uploads use the AWS SDK when `CAMPUSNAV_S3_BUCKET` is configured and fall back to local `/uploads` storage if S3 is unavailable. The server's AWS credential provider chain (preferably an instance role) must have the required S3 permissions. CloudWatch metric publishing errors are logged without converting a successful image upload into a failure.

### 7. Verification
From the project directory:

```bash
node backend/test_dijkstra.js
node backend/verify_endpoints.js
npm run build:frontend
```

### 8. Deployment status and AWS verification

The following AWS resources were verified read-only in region `ap-south-1`:

- S3 bucket `campusnav-floorplans-rvu-2026-716716271138-ap-south-1-an` exists and is in `ap-south-1`.
- Public S3 access is blocked.
- Existing floor-plan objects, including `rvu.jpg` and `rvu_map.jpeg`, are readable through authenticated AWS CLI/S3 access.
- CloudWatch namespace `CampusNav` contains `FloorPlanUploadSuccess`.
- EC2 instance `i-0347f760a8aa9d266` was reported running as `t3.micro`.
- RDS MySQL instance `campusnav-mysql` was reported available as MySQL 8.4.11, `db.t4g.micro`, private/non-public, with 20 GB storage.

The local project environment is configured with `DB_TYPE=local`; therefore it is not currently connected to RDS. RDS configuration variables remain optional and must be supplied only through secure EC2/production environment configuration. Do not store RDS or administrator credentials in source code or the frontend.

The EC2 public health endpoint could not be reached during verification. Before production use, verify Node.js startup, application directory contents, security-group port exposure, reverse proxy configuration, and the `/api/health` endpoint on the deployed instance.

The existing CloudFormation template was validated. Because templates can create billable resources, do not deploy it until the RDS password and SSH source CIDR are supplied and a deployment approval is recorded.

---

## ☁️ Deploying to Amazon Web Services (AWS)

### 1. One-Click CloudFormation Deployment
Deploy the provided `aws/cloudformation.yml` template using the AWS Management Console or AWS CLI:

```bash
aws cloudformation create-stack \
  --stack-name campusnav-infrastructure \
  --template-body file://aws/cloudformation.yml \
  --capabilities CAPABILITY_IAM \
  --region ap-south-1
```

This stack automatically provisions:
- **VPC** with public and private subnets across multiple availability zones.
- **Amazon EC2 Instance (`t3.micro`)** with pre-configured IAM role and security group.
- **Amazon RDS for MySQL (`db.t3.micro`)** in private subnets accessible only from EC2.
- **Amazon S3 Bucket** configured for floor-plan images.
- **Amazon CloudWatch Log Group** with 7-day retention for cost minimization.

### 2. Configure Environment Variables for AWS RDS & S3
On your EC2 instance or in `backend/.env`:

```env
PORT=5000
NODE_ENV=production

# Amazon RDS MySQL Configuration
DB_TYPE=mysql
DB_HOST=campusnav-mysql-db.xxxxxx.ap-south-1.rds.amazonaws.com
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=YourSecurePassword
DB_NAME=campusnav

# Amazon S3 & CloudWatch Configuration
AWS_REGION=ap-south-1
CAMPUSNAV_S3_BUCKET=campusnav-floorplans-xxxxxx-ap-south-1
```

Import the database schema into RDS:
```bash
mysql -h <RDS_ENDPOINT> -u admin -p campusnav < backend/schema.sql
node backend/src/models/seed.js
```

---

## 📡 REST API Reference

### 1. Route Calculation
- **Endpoint:** `POST /api/route`
- **Request Body:**
  ```json
  {
    "sourceId": "node-entr",
    "destinationId": "node-cs-lab-2",
    "accessible": false
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "route": {
      "totalCost": 66,
      "walkingTimeSeconds": 55,
      "isAccessible": false,
      "usesStairs": true,
      "usesLift": false,
      "pathNodeIds": ["node-entr", "node-block-c", "node-stairs-b-g", "node-corr-b", "node-cs-lab-2"],
      "instructions": [
        { "step": 1, "action": "start", "text": "Start at Main Campus Entrance (entrance)" },
        { "step": 2, "action": "walk", "text": "Walk 30m along corridor towards Block C Main Corridor" },
        { "step": 3, "action": "stairs", "text": "Use Stairs B to reach Corridor B" },
        { "step": 4, "action": "walk", "text": "Walk 20m along corridor towards CS Lab 2" },
        { "step": 5, "action": "arrive", "text": "You have arrived at your destination: CS Lab 2" }
      ]
    },
    "accessibleAlternative": {
      "totalCost": 75,
      "walkingTimeSeconds": 63,
      "usesStairs": false,
      "usesLift": true
    }
  }
  ```

### 2. Nearby Facility Search
- **Endpoint:** `POST /api/facilities/nearby`
- **Request Body:**
  ```json
  {
    "sourceId": "node-entr",
    "facilityType": "washroom",
    "limit": 3
  }
  ```

### 3. Autocomplete Location Search
- **Endpoint:** `GET /api/search?q=CS+Lab`

### 4. Admin Graph Management
- `POST /api/admin/nodes` – Create a new room, junction, staircase, or lift.
- `PUT /api/admin/nodes/:id` – Update node attributes or coordinates.
- `DELETE /api/admin/nodes/:id` – Delete node and associated edges.
- `POST /api/admin/edges` – Connect two nodes with a weighted path.
- `POST /api/admin/upload-map` – Upload floor plan file to Amazon S3.
- `GET /api/admin/stats` – CloudWatch search count and graph metrics.

---

## 🎯 Verification & Testing

To run the automated verification test suite verifying both standard and accessible Dijkstra routes matching Figure 2:

```bash
cd backend
node test_dijkstra.js
node verify_endpoints.js
```

---

## 🎓 Academic Reference & Citation

If you use or reference this codebase for research or academic projects, please cite:

```bibtex
@article{talawar2026campusnav,
  title={CampusNav: Cloud-Based Smart Indoor Campus Navigation and Facility Locator Using AWS},
  author={Talawar, Prerana Prakash and Gunaga, Bhagyshree Laxmikant and M G, Bhuvana},
  journal={School of Computer Science and Engineering (SoCSE), RV University},
  year={2026},
  address={Bengaluru, India}
}
```
