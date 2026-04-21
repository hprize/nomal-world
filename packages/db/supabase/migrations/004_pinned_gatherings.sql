-- Add pinning support to gatherings
ALTER TABLE gatherings
  ADD COLUMN is_pinned BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN pin_order INTEGER NOT NULL DEFAULT 0;
