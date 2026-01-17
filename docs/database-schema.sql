-- Core Multi-tenant Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    github_token_encrypted TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization Memberships
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- Projects
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'suspended')),
    memory_snapshot JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Repository Connections
CREATE TABLE repositories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    clone_url VARCHAR(500) NOT NULL,
    branch VARCHAR(100) DEFAULT 'main',
    access_type VARCHAR(20) NOT NULL CHECK (access_type IN ('github_app', 'pat', 'ssh')),
    credentials_encrypted TEXT,
    file_tree_hash VARCHAR(64),
    last_synced_at TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'completed', 'failed')),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, full_name)
);

-- Code Discovery Results
CREATE TABLE discovery_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
    detected_stack JSONB,
    service_boundaries JSONB,
    dependency_graph JSONB,
    risk_hotspots JSONB,
    file_index_summary JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add pgvector extension (will be added after extension is available)
-- CREATE EXTENSION IF NOT EXISTS "pgvector";

-- Semantic Index (pgvector) - will be created after extension
-- CREATE TABLE code_chunks (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
--     file_path VARCHAR(1000) NOT NULL,
--     chunk_type VARCHAR(50) NOT NULL, -- 'route', 'service', 'model', 'config', 'test'
--     content TEXT NOT NULL,
--     embedding vector(1536), -- OpenAI ada-002 dimension
--     metadata JSONB,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- Create vector index for similarity search
-- CREATE INDEX code_chunks_embedding_idx ON code_chunks USING ivfflat (embedding vector_cosine_ops);

-- Feature Requests
CREATE TABLE feature_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'planning', 'approved', 'in_progress', 'completed', 'rejected')),
    requester_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Execution Plans
CREATE TABLE execution_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feature_request_id UUID REFERENCES feature_requests(id) ON DELETE CASCADE,
    phases JSONB NOT NULL,
    blast_radius JSONB,
    risk_assessment JSONB,
    api_contract_changes JSONB,
    test_strategy JSONB,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'executing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent Executions
CREATE TABLE agent_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_plan_id UUID REFERENCES execution_plans(id) ON DELETE CASCADE,
    agent_type VARCHAR(50) NOT NULL, -- 'planner', 'backend', 'frontend', 'qa', 'reviewer'
    phase_number INTEGER,
    input_data JSONB,
    output_data JSONB,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'blocked')),
    error_message TEXT,
    token_usage JSONB,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pull Requests
CREATE TABLE pull_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
    agent_execution_id UUID REFERENCES agent_executions(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    branch_name VARCHAR(255),
    pr_number INTEGER,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'opened', 'merged', 'closed', 'failed')),
    url VARCHAR(500),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Artifacts (S3/GCS pointers)
CREATE TABLE artifacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    agent_execution_id UUID REFERENCES agent_executions(id) ON DELETE CASCADE,
    artifact_type VARCHAR(50) NOT NULL, -- 'discovery_report', 'plan', 'test_results', 'design_spec'
    storage_path VARCHAR(1000) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event Log (for audit/replay)
CREATE TABLE event_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    aggregate_id UUID NOT NULL,
    aggregate_type VARCHAR(50) NOT NULL, -- 'project', 'feature_request', 'execution_plan'
    data JSONB NOT NULL,
    metadata JSONB,
    sequence_number BIGSERIAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX event_log_aggregate_idx ON event_log (aggregate_type, aggregate_id, sequence_number);

-- Indexes for performance
CREATE INDEX repositories_project_idx ON repositories (project_id);
CREATE INDEX code_chunks_repository_idx ON code_chunks (repository_id);
CREATE INDEX code_chunks_type_idx ON code_chunks (chunk_type);
CREATE INDEX agent_executions_plan_idx ON agent_executions (execution_plan_id);
CREATE INDEX artifacts_project_idx ON artifacts (project_id);
