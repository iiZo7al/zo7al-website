CREATE TABLE IF NOT EXISTS space_runs (
  id uuid PRIMARY KEY,
  token_hash text NOT NULL,
  client_hash text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  name varchar(20),
  score integer CHECK (score >= 0),
  stars integer CHECK (stars >= 0)
);
CREATE INDEX IF NOT EXISTS space_runs_ranking ON space_runs (score DESC, stars DESC, completed_at ASC) WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS space_runs_client_started ON space_runs (client_hash, started_at DESC);
