-- Apply once to an existing MySQL CampusNav database.
ALTER TABLE faculty
  ADD COLUMN cabin VARCHAR(120) NOT NULL DEFAULT '' AFTER designation,
  ADD COLUMN room_no VARCHAR(30) NOT NULL DEFAULT '' AFTER cabin,
  ADD COLUMN floor VARCHAR(50) NOT NULL DEFAULT '' AFTER room_no;
