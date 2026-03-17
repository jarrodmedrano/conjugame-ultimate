CREATE TABLE location_timelines (
  id SERIAL PRIMARY KEY,
  location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  timeline_id INTEGER NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(location_id, timeline_id)
);

CREATE INDEX idx_location_timelines_location_id ON location_timelines(location_id);
CREATE INDEX idx_location_timelines_timeline_id ON location_timelines(timeline_id);
