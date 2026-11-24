-- Apply once to an existing MySQL CampusNav database.
ALTER TABLE nodes
  ADD COLUMN is_available TINYINT(1) NOT NULL DEFAULT 1;

ALTER TABLE nodes
  ADD COLUMN availability_status ENUM('available', 'occupied', 'reserved', 'unavailable', 'unknown') NOT NULL DEFAULT 'unknown';

ALTER TABLE edges
  ADD COLUMN is_blocked TINYINT(1) NOT NULL DEFAULT 0;

CREATE TABLE faculty (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  department VARCHAR(120) NOT NULL,
  designation VARCHAR(120) NOT NULL,
  office_node_id VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (office_node_id) REFERENCES nodes(id) ON DELETE SET NULL
);
