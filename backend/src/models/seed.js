/**
 * CampusNav Seed Data - RV University Bengaluru Campus
 * Complete implementation based on official RV University Campus Navigation Map:
 * - Blocks: A Block, B Block, C Block, D Block, F Block, E Block, Admin Block, 
 *   Library, Incubation Centre, MM Food, Small/Big Mingoose, Grand Stairs, Ganesha, Main Gate.
 * - 4 Floors per Academic Block (Ground G, 1st, 2nd, 3rd):
 *   G: Main entrance & reception, Classrooms & Lecture halls, Dept office/Help desk, Washrooms/Drinking water, Stairs & Lifts.
 *   1st: Classrooms & Tutorial rooms, Faculty cabins, Department offices, Discussion rooms, Washrooms/Lifts/Stairs.
 *   2nd: Computer labs, Classrooms & Seminar rooms, Faculty offices, Student project spaces, Washrooms/Lifts/Stairs.
 *   3rd: Classrooms & Lecture halls, Advanced laboratories, Faculty cabins, Meeting/Project rooms, Washrooms/Lifts/Stairs.
 */

const db = require('../config/db');

// Helper to generate indoor nodes and edges for an academic block across 4 floors
function generateBlockFloors(blockId, blockName, blockCode, baseOutdoorNodeId) {
  const floors = [
    {
      id: `${blockId}-fl-g`,
      block_id: blockId,
      floor_number: 0,
      name: `${blockName} - Ground Floor (G)`,
      map_image_url: `/assets/maps/${blockId}-g.svg`,
      width: 1000,
      height: 650
    },
    {
      id: `${blockId}-fl-1`,
      block_id: blockId,
      floor_number: 1,
      name: `${blockName} - 1st Floor`,
      map_image_url: `/assets/maps/${blockId}-1.svg`,
      width: 1000,
      height: 650
    },
    {
      id: `${blockId}-fl-2`,
      block_id: blockId,
      floor_number: 2,
      name: `${blockName} - 2nd Floor (Labs)`,
      map_image_url: `/assets/maps/${blockId}-2.svg`,
      width: 1000,
      height: 650
    },
    {
      id: `${blockId}-fl-3`,
      block_id: blockId,
      floor_number: 3,
      name: `${blockName} - 3rd Floor (Advanced Labs)`,
      map_image_url: `/assets/maps/${blockId}-3.svg`,
      width: 1000,
      height: 650
    }
  ];

  const nodes = [
    // --- GROUND FLOOR (G) ---
    {
      id: `${blockId}-g-entr`,
      name: `${blockName} Main Entrance & Reception`,
      code: `${blockCode}-G-RECP`,
      block_id: blockId,
      floor_id: `${blockId}-fl-g`,
      x: 120,
      y: 325,
      type: 'entrance',
      facility_type: null,
      description: `Ground floor main entrance and visitor reception desk for ${blockName}`,
      is_accessible: true
    },
    {
      id: `${blockId}-g-corr`,
      name: `${blockName} Ground Floor Concourse`,
      code: `${blockCode}-G-CORR`,
      block_id: blockId,
      floor_id: `${blockId}-fl-g`,
      x: 320,
      y: 325,
      type: 'corridor_junction',
      facility_type: null,
      description: `Central hallway connecting lecture halls, stairs and elevators`,
      is_accessible: true
    },
    {
      id: `${blockId}-g-lh1`,
      name: `${blockName} Lecture Hall G01`,
      code: `${blockCode}-LH-G01`,
      block_id: blockId,
      floor_id: `${blockId}-fl-g`,
      x: 320,
      y: 130,
      type: 'room',
      facility_type: null,
      description: `120-seat multimedia tiered lecture hall`,
      is_accessible: true
    },
    {
      id: `${blockId}-g-cr1`,
      name: `${blockName} Classroom G02`,
      code: `${blockCode}-CR-G02`,
      block_id: blockId,
      floor_id: `${blockId}-fl-g`,
      x: 600,
      y: 130,
      type: 'room',
      facility_type: null,
      description: `Standard academic classroom`,
      is_accessible: true
    },
    {
      id: `${blockId}-g-dept`,
      name: `${blockName} Department Office & Help Desk`,
      code: `${blockCode}-DEPT-OFF`,
      block_id: blockId,
      floor_id: `${blockId}-fl-g`,
      x: 320,
      y: 520,
      type: 'room',
      facility_type: null,
      description: `Student queries, department staff and help desk`,
      is_accessible: true
    },
    {
      id: `${blockId}-g-wr`,
      name: `${blockName} Washrooms & Drinking Water (G)`,
      code: `${blockCode}-WR-G`,
      block_id: blockId,
      floor_id: `${blockId}-fl-g`,
      x: 600,
      y: 520,
      type: 'facility',
      facility_type: 'washroom',
      description: `Clean accessible washrooms and purified drinking water dispenser`,
      is_accessible: true
    },
    {
      id: `${blockId}-g-stairs`,
      name: `${blockName} Stairs (Ground Floor)`,
      code: `${blockCode}-STR-G`,
      block_id: blockId,
      floor_id: `${blockId}-fl-g`,
      x: 480,
      y: 200,
      type: 'staircase',
      facility_type: null,
      description: `Stairwell connecting all 4 floors`,
      is_accessible: false
    },
    {
      id: `${blockId}-g-lift`,
      name: `${blockName} Elevator / Lift (Ground Floor)`,
      code: `${blockCode}-LFT-G`,
      block_id: blockId,
      floor_id: `${blockId}-fl-g`,
      x: 480,
      y: 450,
      type: 'lift',
      facility_type: null,
      description: `Wheelchair-accessible elevator servicing Floors G, 1, 2, 3`,
      is_accessible: true
    },

    // --- 1ST FLOOR ---
    {
      id: `${blockId}-1-corr`,
      name: `${blockName} 1st Floor Concourse`,
      code: `${blockCode}-1-CORR`,
      block_id: blockId,
      floor_id: `${blockId}-fl-1`,
      x: 320,
      y: 325,
      type: 'corridor_junction',
      facility_type: null,
      description: `First floor corridor connecting tutorial rooms & faculty cabins`,
      is_accessible: true
    },
    {
      id: `${blockId}-1-cr101`,
      name: `${blockName} Classroom 101`,
      code: `${blockCode}-CR-101`,
      block_id: blockId,
      floor_id: `${blockId}-fl-1`,
      x: 320,
      y: 130,
      type: 'room',
      facility_type: null,
      description: `Interactive lecture classroom with smart board`,
      is_accessible: true
    },
    {
      id: `${blockId}-1-tut102`,
      name: `${blockName} Tutorial Room 102`,
      code: `${blockCode}-TUT-102`,
      block_id: blockId,
      floor_id: `${blockId}-fl-1`,
      x: 600,
      y: 130,
      type: 'room',
      facility_type: null,
      description: `Small group tutorial and problem-solving room`,
      is_accessible: true
    },
    {
      id: `${blockId}-1-faculty`,
      name: `${blockName} Faculty Cabins (103)`,
      code: `${blockCode}-FAC-103`,
      block_id: blockId,
      floor_id: `${blockId}-fl-1`,
      x: 320,
      y: 520,
      type: 'room',
      facility_type: null,
      description: `Professor and assistant professor cabins`,
      is_accessible: true
    },
    {
      id: `${blockId}-1-discuss`,
      name: `${blockName} Student Discussion Room (104)`,
      code: `${blockCode}-DISC-104`,
      block_id: blockId,
      floor_id: `${blockId}-fl-1`,
      x: 600,
      y: 520,
      type: 'room',
      facility_type: null,
      description: `Collaborative student study and discussion chamber`,
      is_accessible: true
    },
    {
      id: `${blockId}-1-wr`,
      name: `${blockName} Washrooms (1st Floor)`,
      code: `${blockCode}-WR-1`,
      block_id: blockId,
      floor_id: `${blockId}-fl-1`,
      x: 800,
      y: 520,
      type: 'facility',
      facility_type: 'washroom',
      description: `First floor restrooms and drinking water`,
      is_accessible: true
    },
    {
      id: `${blockId}-1-stairs`,
      name: `${blockName} Stairs (1st Floor Landing)`,
      code: `${blockCode}-STR-1`,
      block_id: blockId,
      floor_id: `${blockId}-fl-1`,
      x: 480,
      y: 200,
      type: 'staircase',
      facility_type: null,
      description: `1st floor stairwell landing`,
      is_accessible: false
    },
    {
      id: `${blockId}-1-lift`,
      name: `${blockName} Elevator (1st Floor Landing)`,
      code: `${blockCode}-LFT-1`,
      block_id: blockId,
      floor_id: `${blockId}-fl-1`,
      x: 480,
      y: 450,
      type: 'lift',
      facility_type: null,
      description: `1st floor elevator landing`,
      is_accessible: true
    },

    // --- 2ND FLOOR ---
    {
      id: `${blockId}-2-corr`,
      name: `${blockName} 2nd Floor Concourse (Labs)`,
      code: `${blockCode}-2-CORR`,
      block_id: blockId,
      floor_id: `${blockId}-fl-2`,
      x: 320,
      y: 325,
      type: 'corridor_junction',
      facility_type: null,
      description: `Second floor computing lab hallway`,
      is_accessible: true
    },
    {
      id: `${blockId}-2-cslab`,
      name: `${blockName} Computer Science Lab (${blockCode}-201)`,
      code: `${blockCode}-LAB-201`,
      block_id: blockId,
      floor_id: `${blockId}-fl-2`,
      x: 320,
      y: 130,
      type: 'room',
      facility_type: null,
      description: `High performance programming, database and software systems lab`,
      is_accessible: true
    },
    {
      id: `${blockId}-2-seminar`,
      name: `${blockName} Seminar & Presentation Room 202`,
      code: `${blockCode}-SEM-202`,
      block_id: blockId,
      floor_id: `${blockId}-fl-2`,
      x: 600,
      y: 130,
      type: 'room',
      facility_type: null,
      description: `Multimedia seminar room for presentations and guest talks`,
      is_accessible: true
    },
    {
      id: `${blockId}-2-facoff`,
      name: `${blockName} Faculty Offices (203)`,
      code: `${blockCode}-FAC-203`,
      block_id: blockId,
      floor_id: `${blockId}-fl-2`,
      x: 320,
      y: 520,
      type: 'room',
      facility_type: null,
      description: `Faculty advisory cabins and consulting rooms`,
      is_accessible: true
    },
    {
      id: `${blockId}-2-project`,
      name: `${blockName} Student Project & Innovation Space 204`,
      code: `${blockCode}-PROJ-204`,
      block_id: blockId,
      floor_id: `${blockId}-fl-2`,
      x: 600,
      y: 520,
      type: 'room',
      facility_type: null,
      description: `Collaborative workspace for Capstone and semester project development`,
      is_accessible: true
    },
    {
      id: `${blockId}-2-wr`,
      name: `${blockName} Washrooms (2nd Floor)`,
      code: `${blockCode}-WR-2`,
      block_id: blockId,
      floor_id: `${blockId}-fl-2`,
      x: 800,
      y: 520,
      type: 'facility',
      facility_type: 'washroom',
      description: `Restrooms and drinking water fountain`,
      is_accessible: true
    },
    {
      id: `${blockId}-2-stairs`,
      name: `${blockName} Stairs (2nd Floor Landing)`,
      code: `${blockCode}-STR-2`,
      block_id: blockId,
      floor_id: `${blockId}-fl-2`,
      x: 480,
      y: 200,
      type: 'staircase',
      facility_type: null,
      description: `2nd floor stairwell landing`,
      is_accessible: false
    },
    {
      id: `${blockId}-2-lift`,
      name: `${blockName} Elevator (2nd Floor Landing)`,
      code: `${blockCode}-LFT-2`,
      block_id: blockId,
      floor_id: `${blockId}-fl-2`,
      x: 480,
      y: 450,
      type: 'lift',
      facility_type: null,
      description: `2nd floor elevator landing`,
      is_accessible: true
    },

    // --- 3RD FLOOR ---
    {
      id: `${blockId}-3-corr`,
      name: `${blockName} 3rd Floor Concourse (Adv. Labs)`,
      code: `${blockCode}-3-CORR`,
      block_id: blockId,
      floor_id: `${blockId}-fl-3`,
      x: 320,
      y: 325,
      type: 'corridor_junction',
      facility_type: null,
      description: `Third floor hallway connecting advanced research laboratories`,
      is_accessible: true
    },
    {
      id: `${blockId}-3-lh`,
      name: `${blockName} Lecture Hall 301`,
      code: `${blockCode}-LH-301`,
      block_id: blockId,
      floor_id: `${blockId}-fl-3`,
      x: 320,
      y: 130,
      type: 'room',
      facility_type: null,
      description: `Spacious lecture hall with acoustic panels and AV projector`,
      is_accessible: true
    },
    {
      id: `${blockId}-3-advlab`,
      name: `${blockName} Advanced AI & Cloud Laboratory 302`,
      code: `${blockCode}-LAB-302`,
      block_id: blockId,
      floor_id: `${blockId}-fl-3`,
      x: 600,
      y: 130,
      type: 'room',
      facility_type: null,
      description: `Advanced research computing lab for AI, Deep Learning and Robotics`,
      is_accessible: true
    },
    {
      id: `${blockId}-3-faculty`,
      name: `${blockName} Senior Faculty Cabins (303)`,
      code: `${blockCode}-FAC-303`,
      block_id: blockId,
      floor_id: `${blockId}-fl-3`,
      x: 320,
      y: 520,
      type: 'room',
      facility_type: null,
      description: `Dean, HOD and senior professor research cabins`,
      is_accessible: true
    },
    {
      id: `${blockId}-3-meet`,
      name: `${blockName} Conference & Meeting Room 304`,
      code: `${blockCode}-CONF-304`,
      block_id: blockId,
      floor_id: `${blockId}-fl-3`,
      x: 600,
      y: 520,
      type: 'room',
      facility_type: null,
      description: `Department meeting and doctoral thesis defense hall`,
      is_accessible: true
    },
    {
      id: `${blockId}-3-wr`,
      name: `${blockName} Washrooms (3rd Floor)`,
      code: `${blockCode}-WR-3`,
      block_id: blockId,
      floor_id: `${blockId}-fl-3`,
      x: 800,
      y: 520,
      type: 'facility',
      facility_type: 'washroom',
      description: `Restrooms and drinking water dispenser`,
      is_accessible: true
    },
    {
      id: `${blockId}-3-stairs`,
      name: `${blockName} Stairs (3rd Floor Landing)`,
      code: `${blockCode}-STR-3`,
      block_id: blockId,
      floor_id: `${blockId}-fl-3`,
      x: 480,
      y: 200,
      type: 'staircase',
      facility_type: null,
      description: `3rd floor stairwell landing`,
      is_accessible: false
    },
    {
      id: `${blockId}-3-lift`,
      name: `${blockName} Elevator (3rd Floor Landing)`,
      code: `${blockCode}-LFT-3`,
      block_id: blockId,
      floor_id: `${blockId}-fl-3`,
      x: 480,
      y: 450,
      type: 'lift',
      facility_type: null,
      description: `3rd floor elevator landing`,
      is_accessible: true
    }
  ];

  const edges = [
    // --- Ground Floor Indoor Connections ---
    { id: `e-${blockId}-entr-corr`, source_node_id: `${blockId}-g-entr`, target_node_id: `${blockId}-g-corr`, weight: 15, type: 'corridor', bidirectional: 1 },
    { id: `e-${blockId}-corr-lh1`, source_node_id: `${blockId}-g-corr`, target_node_id: `${blockId}-g-lh1`, weight: 12, type: 'corridor', bidirectional: 1 },
    { id: `e-${blockId}-corr-cr1`, source_node_id: `${blockId}-g-corr`, target_node_id: `${blockId}-g-cr1`, weight: 16, type: 'corridor', bidirectional: 1 },
    { id: `e-${blockId}-corr-dept`, source_node_id: `${blockId}-g-corr`, target_node_id: `${blockId}-g-dept`, weight: 12, type: 'corridor', bidirectional: 1 },
    { id: `e-${blockId}-corr-wr`, source_node_id: `${blockId}-g-corr`, target_node_id: `${blockId}-g-wr`, weight: 18, type: 'corridor', bidirectional: 1 },
    { id: `e-${blockId}-corr-str-g`, source_node_id: `${blockId}-g-corr`, target_node_id: `${blockId}-g-stairs`, weight: 8, type: 'corridor', bidirectional: 1 },
    { id: `e-${blockId}-corr-lft-g`, source_node_id: `${blockId}-g-corr`, target_node_id: `${blockId}-g-lift`, weight: 10, type: 'corridor', bidirectional: 1 },

    // --- 1st Floor Indoor Connections ---
    { id: `e-${blockId}-1-corr-cr`, source_node_id: `${blockId}-1-corr`, target_node_id: `${blockId}-1-cr101`, weight: 12, type: 'corridor', bidirectional: 1 },
    { id: `e-${blockId}-1-corr-tut`, source_node_id: `${blockId}-1-corr`, target_node_id: `${blockId}-1-tut102`, weight: 16, type: 'corridor', bidirectional: 1 },
    { id: `e-${blockId}-1-corr-fac`, source_node_id: `${blockId}-1-corr`, target_node_id: `${blockId}-1-faculty`, weight: 12, type: 'corridor', bidirectional: 1 },
    { id: `e-${blockId}-1-corr-disc`, source_node_id: `${blockId}-1-corr`, target_node_id: `${blockId}-1-discuss`, weight: 16, type: 'corridor', bidirectional: 1 },
    { id: `e-${blockId}-1-corr-wr`, source_node_id: `${blockId}-1-corr`, target_node_id: `${blockId}-1-wr`, weight: 20, type: 'corridor', bidirectional: 1 },
    { id: `e-${blockId}-1-corr-str`, source_node_id: `${blockId}-1-corr`, target_node_id: `${blockId}-1-stairs`, weight: 8, type: 'corridor', bidirectional: 1 },
    { id: `e-${blockId}-1-corr-lft`, source_node_id: `${blockId}-1-corr`, target_node_id: `${blockId}-1-lift`, weight: 10, type: 'corridor', bidirectional: 1 },

    // --- 2nd Floor Indoor Connections ---
    { id: `e-${blockId}-2-corr-lab`, source_node_id: `${blockId}-2-corr`, target_node_id: `${blockId}-2-cslab`, weight: 14, type: 'corridor', bidirectional: 1 },
    { id: `e-${blockId}-2-corr-sem`, source_node_id: `${blockId}-2-corr`, target_node_id: `${blockId}-2-seminar`, weight: 16, type: 'corridor', bidirectional: 1 },
    { id: `e-${blockId}-2-corr-fac`, source_node_id: `${blockId}-2-corr`, target_node_id: `${blockId}-2-facoff`, weight: 12, type: 'corridor', bidirectional: 1 },
    { id: `e-${blockId}-2-corr-proj`, source_node_id: `${blockId}-2-corr`, target_node_id: `${blockId}-2-project`, weight: 16, type: 'corridor', bidirectional: 1 },
    { id: `e-${blockId}-2-corr-wr`, source_node_id: `${blockId}-2-corr`, target_node_id: `${blockId}-2-wr`, weight: 20, type: 'corridor', bidirectional: 1 },
    { id: `e-${blockId}-2-corr-str`, source_node_id: `${blockId}-2-corr`, target_node_id: `${blockId}-2-stairs`, weight: 8, type: 'corridor', bidirectional: 1 },
    { id: `e-${blockId}-2-corr-lft`, source_node_id: `${blockId}-2-corr`, target_node_id: `${blockId}-2-lift`, weight: 10, type: 'corridor', bidirectional: 1 },

    // --- 3rd Floor Indoor Connections ---
    { id: `e-${blockId}-3-corr-lh`, source_node_id: `${blockId}-3-corr`, target_node_id: `${blockId}-3-lh`, weight: 12, type: 'corridor', bidirectional: 1 },
    { id: `e-${blockId}-3-corr-adv`, source_node_id: `${blockId}-3-corr`, target_node_id: `${blockId}-3-advlab`, weight: 16, type: 'corridor', bidirectional: 1 },
    { id: `e-${blockId}-3-corr-fac`, source_node_id: `${blockId}-3-corr`, target_node_id: `${blockId}-3-faculty`, weight: 12, type: 'corridor', bidirectional: 1 },
    { id: `e-${blockId}-3-corr-meet`, source_node_id: `${blockId}-3-corr`, target_node_id: `${blockId}-3-meet`, weight: 16, type: 'corridor', bidirectional: 1 },
    { id: `e-${blockId}-3-corr-wr`, source_node_id: `${blockId}-3-corr`, target_node_id: `${blockId}-3-wr`, weight: 20, type: 'corridor', bidirectional: 1 },
    { id: `e-${blockId}-3-corr-str`, source_node_id: `${blockId}-3-corr`, target_node_id: `${blockId}-3-stairs`, weight: 8, type: 'corridor', bidirectional: 1 },
    { id: `e-${blockId}-3-corr-lft`, source_node_id: `${blockId}-3-corr`, target_node_id: `${blockId}-3-lift`, weight: 10, type: 'corridor', bidirectional: 1 },

    // --- Vertical Stair Transitions Between Floors ---
    { id: `e-${blockId}-str-g-1`, source_node_id: `${blockId}-g-stairs`, target_node_id: `${blockId}-1-stairs`, weight: 8, type: 'staircase', bidirectional: 1 },
    { id: `e-${blockId}-str-1-2`, source_node_id: `${blockId}-1-stairs`, target_node_id: `${blockId}-2-stairs`, weight: 8, type: 'staircase', bidirectional: 1 },
    { id: `e-${blockId}-str-2-3`, source_node_id: `${blockId}-2-stairs`, target_node_id: `${blockId}-3-stairs`, weight: 8, type: 'staircase', bidirectional: 1 },

    // --- Vertical Elevator (Lift) Transitions Between Floors (Accessible) ---
    { id: `e-${blockId}-lft-g-1`, source_node_id: `${blockId}-g-lift`, target_node_id: `${blockId}-1-lift`, weight: 10, type: 'lift', bidirectional: 1 },
    { id: `e-${blockId}-lft-1-2`, source_node_id: `${blockId}-1-lift`, target_node_id: `${blockId}-2-lift`, weight: 10, type: 'lift', bidirectional: 1 },
    { id: `e-${blockId}-lft-2-3`, source_node_id: `${blockId}-2-lift`, target_node_id: `${blockId}-3-lift`, weight: 10, type: 'lift', bidirectional: 1 },

    // Direct multi-floor elevator jumps
    { id: `e-${blockId}-lft-g-2`, source_node_id: `${blockId}-g-lift`, target_node_id: `${blockId}-2-lift`, weight: 15, type: 'lift', bidirectional: 1 },
    { id: `e-${blockId}-lft-g-3`, source_node_id: `${blockId}-g-lift`, target_node_id: `${blockId}-3-lift`, weight: 20, type: 'lift', bidirectional: 1 },

    // Connection from Outdoor Campus Gateway into this block's Ground Entrance
    { id: `e-outdoor-to-${blockId}`, source_node_id: baseOutdoorNodeId, target_node_id: `${blockId}-g-entr`, weight: 15, type: 'corridor', bidirectional: 1 }
  ];

  return { floors, nodes, edges };
}

// 1. Campus Blocks & Buildings
const campusBlocks = [
  { id: 'block-a', name: 'A Block', code: 'BLK-A', description: 'Academic Block A - Classrooms, Faculty & Labs' },
  { id: 'block-b', name: 'B Block', code: 'BLK-B', description: 'Academic Block B - Classrooms, Faculty & Labs' },
  { id: 'block-c', name: 'C Block', code: 'BLK-C', description: 'C Block - School of Computer Science & Engineering (SoCSE)' },
  { id: 'block-d', name: 'D Block', code: 'BLK-D', description: 'Academic Block D - Classrooms, Labs & Project Spaces' },
  { id: 'block-f', name: 'F Block', code: 'BLK-F', description: 'Academic Block F - Classrooms, Faculty & Advanced Labs' },
  { id: 'block-e', name: 'E Block', code: 'BLK-E', description: 'Block E - Academic Departments & Lecture Halls' },
  { id: 'block-admin', name: 'Admin Block', code: 'ADM', description: 'Central Administration, Admissions & Accounts' },
  { id: 'block-lib', name: 'Central Library', code: 'LIB', description: 'Multi-Floor Central University Library & Digital Repository' },
  { id: 'block-incub', name: 'Incubation Centre', code: 'INCUB', description: 'Centre for Entrepreneurship & Startup Incubation' },
  { id: 'block-amenities', name: 'Food & Student Amenities', code: 'FOOD', description: 'MM Food, Mingoose, Ganesha Plaza & Grand Stairs' }
];

// Generate 4 floors for each of A, B, C, D, F Blocks
const blockA = generateBlockFloors('block-a', 'A Block', 'A', 'out-node-block-a');
const blockB = generateBlockFloors('block-b', 'B Block', 'B', 'out-node-block-b');
const blockC = generateBlockFloors('block-c', 'C Block', 'C', 'out-node-block-c');
const blockD = generateBlockFloors('block-d', 'D Block', 'D', 'out-node-block-d');
const blockF = generateBlockFloors('block-f', 'F Block', 'F', 'out-node-block-f');

// Floor list for Campus Overview Map
const campusOverviewFloor = {
  id: 'floor-campus',
  block_id: 'block-amenities',
  floor_number: 0,
  name: 'RV University Campus Master Overview',
  map_image_url: '/assets/maps/rvu_campus_map.jpg',
  width: 1000,
  height: 650
};

// 2. Outdoor Campus Landmarks & Walkway Graph Nodes (normalized to layout of uploaded image)
const outdoorNodes = [
  {
    id: 'out-node-gate',
    name: 'Main Campus Gate (Security Check)',
    code: 'GATE-MAIN',
    block_id: 'block-amenities',
    floor_id: 'floor-campus',
    x: 540,
    y: 890,
    type: 'entrance',
    facility_type: null,
    description: 'RV University main entrance gate & security check post on Mysuru Road',
    is_accessible: true
  },
  {
    id: 'out-node-walkway-south',
    name: 'Central South Walkway',
    code: 'WALK-S',
    block_id: 'block-amenities',
    floor_id: 'floor-campus',
    x: 520,
    y: 770,
    type: 'corridor_junction',
    facility_type: null,
    description: 'Walkway junction connecting Main Gate, Food Courts and Admin Block',
    is_accessible: true
  },
  {
    id: 'out-node-small-mingoose',
    name: 'Small Mingoose (Cafeteria & Stationery)',
    code: 'FAC-SM-MINGOOSE',
    block_id: 'block-amenities',
    floor_id: 'floor-campus',
    x: 560,
    y: 670,
    type: 'facility',
    facility_type: 'canteen',
    description: 'Student cafeteria, quick snacks, tea and campus stationery store',
    is_accessible: true
  },
  {
    id: 'out-node-mm-food-south',
    name: 'MM Food Court (South)',
    code: 'FAC-MM-FOOD-S',
    block_id: 'block-amenities',
    floor_id: 'floor-campus',
    x: 630,
    y: 760,
    type: 'facility',
    facility_type: 'canteen',
    description: 'Multi-cuisine campus dining court and refreshments',
    is_accessible: true
  },
  {
    id: 'out-node-admin',
    name: 'Admin Block (Admissions & Registrar)',
    code: 'ADM-MAIN',
    block_id: 'block-admin',
    floor_id: 'floor-campus',
    x: 700,
    y: 680,
    type: 'room',
    facility_type: null,
    description: 'Vice Chancellor, Registrar, Admissions, Examinations and Accounts',
    is_accessible: true
  },
  {
    id: 'out-node-grand-stairs',
    name: 'Grand Stairs (Central Connecting Steps)',
    code: 'STR-GRAND',
    block_id: 'block-amenities',
    floor_id: 'floor-campus',
    x: 500,
    y: 470,
    type: 'staircase',
    facility_type: null,
    description: 'Grand connecting stone staircase leading from lower campus up to academic terrace',
    is_accessible: false
  },
  {
    id: 'out-node-grand-ramp',
    name: 'Accessible Ramp (Grand Stairs Alternative)',
    code: 'RMP-GRAND',
    block_id: 'block-amenities',
    floor_id: 'floor-campus',
    x: 440,
    y: 470,
    type: 'ramp',
    facility_type: null,
    description: 'Gradual incline step-free ramp bypassing the Grand Stairs for wheelchairs',
    is_accessible: true
  },
  {
    id: 'out-node-ganesha',
    name: 'Ganesha Temple & Central Plaza',
    code: 'PLZ-GANESHA',
    block_id: 'block-amenities',
    floor_id: 'floor-campus',
    x: 500,
    y: 350,
    type: 'corridor_junction',
    facility_type: null,
    description: 'Central landmark plaza connecting Blocks A, C, D and E',
    is_accessible: true
  },
  {
    id: 'out-node-block-a',
    name: 'A Block (Campus Portal)',
    code: 'BLK-A-PORTAL',
    block_id: 'block-a',
    floor_id: 'floor-campus',
    x: 360,
    y: 360,
    type: 'corridor_junction',
    facility_type: null,
    description: 'Entrance plaza to A Block (Floors G, 1, 2, 3)',
    is_accessible: true
  },
  {
    id: 'out-node-block-b',
    name: 'B Block (Campus Portal)',
    code: 'BLK-B-PORTAL',
    block_id: 'block-b',
    floor_id: 'floor-campus',
    x: 320,
    y: 210,
    type: 'corridor_junction',
    facility_type: null,
    description: 'Entrance plaza to B Block (Floors G, 1, 2, 3)',
    is_accessible: true
  },
  {
    id: 'out-node-block-c',
    name: 'C Block - SoCSE Engineering (Campus Portal)',
    code: 'BLK-C-PORTAL',
    block_id: 'block-c',
    floor_id: 'floor-campus',
    x: 500,
    y: 210,
    type: 'corridor_junction',
    facility_type: null,
    description: 'Entrance plaza to C Block (School of Computer Science & Engineering)',
    is_accessible: true
  },
  {
    id: 'out-node-block-d',
    name: 'D Block (Campus Portal)',
    code: 'BLK-D-PORTAL',
    block_id: 'block-d',
    floor_id: 'floor-campus',
    x: 650,
    y: 360,
    type: 'corridor_junction',
    facility_type: null,
    description: 'Entrance plaza to D Block (Floors G, 1, 2, 3)',
    is_accessible: true
  },
  {
    id: 'out-node-block-e',
    name: 'E Block (Campus Portal)',
    code: 'BLK-E-PORTAL',
    block_id: 'block-e',
    floor_id: 'floor-campus',
    x: 680,
    y: 470,
    type: 'corridor_junction',
    facility_type: null,
    description: 'Entrance plaza to E Block academic departments',
    is_accessible: true
  },
  {
    id: 'out-node-block-f',
    name: 'F Block (Campus Portal)',
    code: 'BLK-F-PORTAL',
    block_id: 'block-f',
    floor_id: 'floor-campus',
    x: 670,
    y: 160,
    type: 'corridor_junction',
    facility_type: null,
    description: 'Entrance plaza to F Block (Floors G, 1, 2, 3)',
    is_accessible: true
  },
  {
    id: 'out-node-incub',
    name: 'Incubation Centre (Startups & Innovation)',
    code: 'INCUB-CTR',
    block_id: 'block-incub',
    floor_id: 'floor-campus',
    x: 110,
    y: 220,
    type: 'room',
    facility_type: null,
    description: 'RV University Incubation & Innovation Foundation',
    is_accessible: true
  },
  {
    id: 'out-node-mm-food-east',
    name: 'MM Food Court (East)',
    code: 'FAC-MM-FOOD-E',
    block_id: 'block-amenities',
    floor_id: 'floor-campus',
    x: 770,
    y: 570,
    type: 'facility',
    facility_type: 'canteen',
    description: 'Dining court, juices, bakery and breakfast meals',
    is_accessible: true
  },
  {
    id: 'out-node-big-mingoose',
    name: 'Big Mingoose (Student Dining & Lounge)',
    code: 'FAC-BIG-MINGOOSE',
    block_id: 'block-amenities',
    floor_id: 'floor-campus',
    x: 900,
    y: 590,
    type: 'facility',
    facility_type: 'canteen',
    description: 'Spacious dining lounge, student community area and refreshments',
    is_accessible: true
  },
  {
    id: 'out-node-library',
    name: 'Central University Library & Reading Hall',
    code: 'LIB-CENTRAL',
    block_id: 'block-lib',
    floor_id: 'floor-campus',
    x: 900,
    y: 470,
    type: 'facility',
    facility_type: 'library',
    description: 'State-of-the-art multi-tier Central Library, digital catalog and study cubicles',
    is_accessible: true
  }
];

// 3. Outdoor Inter-Building Traversable Walkway Edges
const outdoorEdges = [
  // Gate to Lower Walkway
  { id: 'e-out-gate-walkway', source_node_id: 'out-node-gate', target_node_id: 'out-node-walkway-south', weight: 40, type: 'outdoor_walkway', bidirectional: 1 },
  { id: 'e-out-walkway-mmfood-s', source_node_id: 'out-node-walkway-south', target_node_id: 'out-node-mm-food-south', weight: 25, type: 'outdoor_walkway', bidirectional: 1 },
  { id: 'e-out-walkway-small-ming', source_node_id: 'out-node-walkway-south', target_node_id: 'out-node-small-mingoose', weight: 30, type: 'outdoor_walkway', bidirectional: 1 },
  { id: 'e-out-walkway-admin', source_node_id: 'out-node-walkway-south', target_node_id: 'out-node-admin', weight: 45, type: 'outdoor_walkway', bidirectional: 1 },

  // Towards Grand Stairs & Ramp
  { id: 'e-out-small-ming-stairs', source_node_id: 'out-node-small-mingoose', target_node_id: 'out-node-grand-stairs', weight: 40, type: 'outdoor_walkway', bidirectional: 1 },
  { id: 'e-out-small-ming-ramp', source_node_id: 'out-node-small-mingoose', target_node_id: 'out-node-grand-ramp', weight: 42, type: 'outdoor_walkway', bidirectional: 1 },

  // Grand Stairs & Ramp to Ganesha Plaza
  { id: 'e-out-grand-stairs-ganesha', source_node_id: 'out-node-grand-stairs', target_node_id: 'out-node-ganesha', weight: 25, type: 'staircase', bidirectional: 1 },
  { id: 'e-out-grand-ramp-ganesha', source_node_id: 'out-node-grand-ramp', target_node_id: 'out-node-ganesha', weight: 32, type: 'ramp', bidirectional: 1 },

  // Ganesha Plaza to Academic Blocks
  { id: 'e-out-ganesha-block-a', source_node_id: 'out-node-ganesha', target_node_id: 'out-node-block-a', weight: 30, type: 'outdoor_walkway', bidirectional: 1 },
  { id: 'e-out-ganesha-block-c', source_node_id: 'out-node-ganesha', target_node_id: 'out-node-block-c', weight: 30, type: 'outdoor_walkway', bidirectional: 1 },
  { id: 'e-out-ganesha-block-d', source_node_id: 'out-node-ganesha', target_node_id: 'out-node-block-d', weight: 35, type: 'outdoor_walkway', bidirectional: 1 },
  { id: 'e-out-grandstairs-block-e', source_node_id: 'out-node-grand-stairs', target_node_id: 'out-node-block-e', weight: 35, type: 'outdoor_walkway', bidirectional: 1 },

  // Northern Walkway connecting Incubation, B, C, F Blocks
  { id: 'e-out-incub-block-b', source_node_id: 'out-node-incub', target_node_id: 'out-node-block-b', weight: 50, type: 'outdoor_walkway', bidirectional: 1 },
  { id: 'e-out-block-a-block-b', source_node_id: 'out-node-block-a', target_node_id: 'out-node-block-b', weight: 35, type: 'outdoor_walkway', bidirectional: 1 },
  { id: 'e-out-block-b-block-c', source_node_id: 'out-node-block-b', target_node_id: 'out-node-block-c', weight: 40, type: 'outdoor_walkway', bidirectional: 1 },
  { id: 'e-out-block-c-block-f', source_node_id: 'out-node-block-c', target_node_id: 'out-node-block-f', weight: 45, type: 'outdoor_walkway', bidirectional: 1 },
  { id: 'e-out-block-d-block-f', source_node_id: 'out-node-block-d', target_node_id: 'out-node-block-f', weight: 45, type: 'outdoor_walkway', bidirectional: 1 },

  // Eastern Walkway connecting D/E Block, MM Food East, Big Mingoose and Central Library
  { id: 'e-out-block-e-mmfood-e', source_node_id: 'out-node-block-e', target_node_id: 'out-node-mm-food-east', weight: 30, type: 'outdoor_walkway', bidirectional: 1 },
  { id: 'e-out-admin-mmfood-e', source_node_id: 'out-node-admin', target_node_id: 'out-node-mm-food-east', weight: 35, type: 'outdoor_walkway', bidirectional: 1 },
  { id: 'e-out-mmfood-e-big-ming', source_node_id: 'out-node-mm-food-east', target_node_id: 'out-node-big-mingoose', weight: 30, type: 'outdoor_walkway', bidirectional: 1 },
  { id: 'e-out-big-ming-library', source_node_id: 'out-node-big-mingoose', target_node_id: 'out-node-library', weight: 25, type: 'outdoor_walkway', bidirectional: 1 },
  { id: 'e-out-block-d-library', source_node_id: 'out-node-block-d', target_node_id: 'out-node-library', weight: 55, type: 'outdoor_walkway', bidirectional: 1 }
];

// Combine all datasets
const initialData = {
  blocks: campusBlocks,
  floors: [
    campusOverviewFloor,
    ...blockA.floors,
    ...blockB.floors,
    ...blockC.floors,
    ...blockD.floors,
    ...blockF.floors
  ],
  nodes: [
    ...outdoorNodes,
    ...blockA.nodes,
    ...blockB.nodes,
    ...blockC.nodes,
    ...blockD.nodes,
    ...blockF.nodes
  ],
  edges: [
    ...outdoorEdges,
    ...blockA.edges,
    ...blockB.edges,
    ...blockC.edges,
    ...blockD.edges,
    ...blockF.edges
  ],
  users: [
    { id: 'usr-admin', username: 'admin', email: 'admin@rvu.edu.in', role: 'admin', name: 'Campus Administrator' },
    { id: 'usr-student', username: 'student', email: 'student@rvu.edu.in', role: 'student', name: 'RVU Student' }
  ]
};

async function seedDatabase() {
  console.log('[Seed] Seeding RV University Bengaluru Master Campus Data...');
  await db.resetAll(initialData);
  console.log(`[Seed] Successfully seeded:
  - ${initialData.blocks.length} Campus Blocks & Landmarks
  - ${initialData.floors.length} Total Floors
  - ${initialData.nodes.length} Vertices (Outdoor Landmarks & Indoor Rooms/Labs/Facilities)
  - ${initialData.edges.length} Traversable Edges (Walkways, Corridors, Stairs & Elevators)`);
}

if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('[Seed] RV University Campus Database Seed Complete.');
      process.exit(0);
    })
    .catch(err => {
      console.error('[Seed] Error:', err);
      process.exit(1);
    });
}

module.exports = {
  initialData,
  seedDatabase
};
