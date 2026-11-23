-- ============================================================================
-- Phase 5B: Enable Supabase Realtime publication for the leads table.
-- This allows postgres_changes subscriptions to receive INSERT events.
-- ============================================================================

alter publication supabase_realtime add table public.leads;
