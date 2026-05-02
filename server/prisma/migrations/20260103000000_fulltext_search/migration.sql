-- Índices GIN para full-text search en español sobre productos y usuarios
-- Permiten búsquedas eficientes con ts_query/plainto_tsquery

CREATE INDEX IF NOT EXISTS "Product_fts_idx"
  ON "Product"
  USING GIN (to_tsvector('spanish', name || ' ' || description));

CREATE INDEX IF NOT EXISTS "User_fts_idx"
  ON "User"
  USING GIN (to_tsvector('simple', name || ' ' || username));
