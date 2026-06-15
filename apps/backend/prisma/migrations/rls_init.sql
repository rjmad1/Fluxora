-- Enable Row-Level Security
ALTER TABLE "Workspace" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConnectedAccount" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Post" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PostVariant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Asset" ENABLE ROW LEVEL SECURITY;

-- Workspace Isolation Policies
CREATE POLICY workspace_isolation_policy_ws ON "Workspace"
  USING (id = current_setting('app.current_workspace_id'));

CREATE POLICY workspace_isolation_policy_ca ON "ConnectedAccount"
  USING (workspaceId = current_setting('app.current_workspace_id'));

CREATE POLICY workspace_isolation_policy_post ON "Post"
  USING (workspaceId = current_setting('app.current_workspace_id'));

CREATE POLICY workspace_isolation_policy_pv ON "PostVariant"
  USING (postId IN (SELECT id FROM "Post" WHERE workspaceId = current_setting('app.current_workspace_id')));

CREATE POLICY workspace_isolation_policy_asset ON "Asset"
  USING (workspaceId = current_setting('app.current_workspace_id'));
