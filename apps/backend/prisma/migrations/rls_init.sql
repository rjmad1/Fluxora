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
  USING ("workspaceId" = current_setting('app.current_workspace_id'));

CREATE POLICY workspace_isolation_policy_post ON "Post"
  USING ("workspaceId" = current_setting('app.current_workspace_id'));

CREATE POLICY workspace_isolation_policy_pv ON "PostVariant"
  USING ("postId" IN (SELECT id FROM "Post" WHERE "workspaceId" = current_setting('app.current_workspace_id')));

CREATE POLICY workspace_isolation_policy_asset ON "Asset"
  USING ("workspaceId" = current_setting('app.current_workspace_id'));

-- Enable Row-Level Security on New Tables
ALTER TABLE "UserProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserPersona" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserGoal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserInterest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserExpertise" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserBrandProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserVoiceProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserDigitalTwin" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "KnowledgeGraphNode" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "KnowledgeGraphEdge" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserLearningProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserContentDNA" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserGrowthMetrics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserRecommendation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PersonalHistory" ENABLE ROW LEVEL SECURITY;

-- Workspace Isolation Policies for New Tables
CREATE POLICY workspace_isolation_policy_up ON "UserProfile" USING ("workspaceId" = current_setting('app.current_workspace_id'));
CREATE POLICY workspace_isolation_policy_upe ON "UserPersona" USING ("workspaceId" = current_setting('app.current_workspace_id'));
CREATE POLICY workspace_isolation_policy_ug ON "UserGoal" USING ("workspaceId" = current_setting('app.current_workspace_id'));
CREATE POLICY workspace_isolation_policy_ui ON "UserInterest" USING ("workspaceId" = current_setting('app.current_workspace_id'));
CREATE POLICY workspace_isolation_policy_ue ON "UserExpertise" USING ("workspaceId" = current_setting('app.current_workspace_id'));
CREATE POLICY workspace_isolation_policy_ubp ON "UserBrandProfile" USING ("workspaceId" = current_setting('app.current_workspace_id'));
CREATE POLICY workspace_isolation_policy_uvp ON "UserVoiceProfile" USING ("workspaceId" = current_setting('app.current_workspace_id'));
CREATE POLICY workspace_isolation_policy_udt ON "UserDigitalTwin" USING ("workspaceId" = current_setting('app.current_workspace_id'));
CREATE POLICY workspace_isolation_policy_kgn ON "KnowledgeGraphNode" USING ("workspaceId" = current_setting('app.current_workspace_id'));
CREATE POLICY workspace_isolation_policy_kge ON "KnowledgeGraphEdge" USING ("workspaceId" = current_setting('app.current_workspace_id'));
CREATE POLICY workspace_isolation_policy_ulp ON "UserLearningProfile" USING ("workspaceId" = current_setting('app.current_workspace_id'));
CREATE POLICY workspace_isolation_policy_ucd ON "UserContentDNA" USING ("workspaceId" = current_setting('app.current_workspace_id'));
CREATE POLICY workspace_isolation_policy_ugm ON "UserGrowthMetrics" USING ("workspaceId" = current_setting('app.current_workspace_id'));
CREATE POLICY workspace_isolation_policy_ur ON "UserRecommendation" USING ("workspaceId" = current_setting('app.current_workspace_id'));
CREATE POLICY workspace_isolation_policy_ph ON "PersonalHistory" USING ("workspaceId" = current_setting('app.current_workspace_id'));

-- Enable RLS and Workspace isolation for ProposedTopicState
ALTER TABLE "ProposedTopicState" ENABLE ROW LEVEL SECURITY;
CREATE POLICY workspace_isolation_policy_pts ON "ProposedTopicState" USING ("workspaceId" = current_setting('app.current_workspace_id'));

