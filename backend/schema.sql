-- =========================================================================
-- CampusNav: Cloud-Based Smart Indoor Campus Navigation and Facility Locator
-- Amazon RDS (MySQL) Database Schema
-- Authors: Prerana Prakash Talawar, Bhagyshree Laxmikant Gunaga, Bhuvana M G
-- School of Computer Science and Engineering (SoCSE), RV University
-- =========================================================================

CREATE DATABASE IF NOT EXISTS campusnav;
USE campusnav;

-- 1. Campus Blocks
CREATE TABLE IF NOT EXISTS blocks (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Floor Levels (S3 URL stored for map images)
CREATE TABLE IF NOT EXISTS floors (
    id VARCHAR(50) PRIMARY KEY,
    block_id VARCHAR(50) NOT NULL,
    floor_number INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    map_image_url VARCHAR(255) DEFAULT '', -- Amazon S3 Object URL
    width INT DEFAULT 1000,
    height INT DEFAULT 650,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (block_id) REFERENCES blocks(id) ON DELETE CASCADE
);

-- 3. Campus Graph Vertices (Rooms, Corridors, Stairs, Lifts, Facilities)
CREATE TABLE IF NOT EXISTS nodes (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(30) DEFAULT '',
    block_id VARCHAR(50) NOT NULL,
    floor_id VARCHAR(50) NOT NULL,
    x FLOAT NOT NULL,
    y FLOAT NOT NULL,
    type ENUM('room', 'corridor_junction', 'entrance', 'staircase', 'lift', 'ramp', 'facility') NOT NULL DEFAULT 'room',
    facility_type ENUM('canteen', 'library', 'washroom', 'emergency_exit', 'drinking_water', 'medical_room') NULL,
    description TEXT,
    is_accessible TINYINT(1) DEFAULT 1,
    is_available TINYINT(1) NOT NULL DEFAULT 1,
    availability_status ENUM('available', 'occupied', 'reserved', 'unavailable', 'unknown') NOT NULL DEFAULT 'unknown',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (block_id) REFERENCES blocks(id) ON DELETE CASCADE,
    FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE CASCADE
);

-- 4. Campus Graph Edges (Corridors, Staircases, Lifts, Ramps)
CREATE TABLE IF NOT EXISTS edges (
    id VARCHAR(50) PRIMARY KEY,
    source_node_id VARCHAR(50) NOT NULL,
    target_node_id VARCHAR(50) NOT NULL,
    weight FLOAT NOT NULL, -- Walking cost in meters or seconds
    type ENUM('corridor', 'staircase', 'lift', 'ramp') NOT NULL DEFAULT 'corridor',
    bidirectional TINYINT(1) DEFAULT 1,
    is_blocked TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_node_id) REFERENCES nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (target_node_id) REFERENCES nodes(id) ON DELETE CASCADE
);

-- 5. User Roles (Admins, Students, Faculty, Visitors)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'student', 'faculty', 'visitor') NOT NULL DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Faculty directory (campus-provided records only)
CREATE TABLE IF NOT EXISTS faculty (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    department VARCHAR(120) NOT NULL,
    designation VARCHAR(120) NOT NULL,
    cabin VARCHAR(120) NOT NULL DEFAULT '',
    room_no VARCHAR(30) NOT NULL DEFAULT '',
    floor VARCHAR(50) NOT NULL DEFAULT '',
    office_node_id VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (office_node_id) REFERENCES nodes(id) ON DELETE SET NULL
);

-- 7. Route & Search Analytics (Logged for CloudWatch & Admin Dashboard)
CREATE TABLE IF NOT EXISTS analytics (
    id VARCHAR(50) PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    source_id VARCHAR(50) NULL,
    target_id VARCHAR(50) NULL,
    accessible_mode TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Dijkstra and autocomplete search performance
CREATE INDEX idx_nodes_floor ON nodes(floor_id);
CREATE INDEX idx_nodes_block ON nodes(block_id);
CREATE INDEX idx_nodes_type ON nodes(type);
CREATE INDEX idx_nodes_facility ON nodes(facility_type);
CREATE INDEX idx_edges_source ON edges(source_node_id);
CREATE INDEX idx_edges_target ON edges(target_node_id);
