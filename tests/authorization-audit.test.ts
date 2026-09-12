import test from "node:test";
import assert from "node:assert/strict";

// RBAC Policy Helper logic replicating route authorization guards
function canAccessLead(user: { userId: string; role: string }, lead: { assignedToId?: string | null; createdById?: string | null }): boolean {
  if (["ADMIN", "MANAGER"].includes(user.role)) return true;
  return lead.assignedToId === user.userId || lead.createdById === user.userId;
}

function canAccessCampaign(user: { userId: string; role: string }, campaign: { createdById?: string | null }): boolean {
  if (["ADMIN", "MANAGER"].includes(user.role)) return true;
  return campaign.createdById === user.userId;
}

function canModifyOpportunity(user: { userId: string; role: string }, opportunity: { assignedToId?: string | null }): boolean {
  if (["ADMIN", "MANAGER"].includes(user.role)) return true;
  return opportunity.assignedToId === user.userId;
}

function canViewUserProfile(requester: { userId: string; role: string }, targetUserId: string): boolean {
  if (["ADMIN", "MANAGER"].includes(requester.role)) return true;
  return requester.userId === targetUserId;
}

function canAccessJobQueues(user: { userId: string; role: string }): boolean {
  return ["ADMIN", "MANAGER"].includes(user.role);
}

test("Authorization: Lead access control enforces ownership for AGENT role", () => {
  const agent1 = { userId: "agent_1", role: "AGENT" };
  const agent2 = { userId: "agent_2", role: "AGENT" };
  const manager = { userId: "manager_1", role: "MANAGER" };
  const admin = { userId: "admin_1", role: "ADMIN" };

  const leadOwnedBy1 = { assignedToId: "agent_1", createdById: "agent_1" };

  assert.equal(canAccessLead(agent1, leadOwnedBy1), true, "Owner agent must have access");
  assert.equal(canAccessLead(agent2, leadOwnedBy1), false, "Non-owner agent must be forbidden");
  assert.equal(canAccessLead(manager, leadOwnedBy1), true, "Manager has access to all leads");
  assert.equal(canAccessLead(admin, leadOwnedBy1), true, "Admin has access to all leads");
});

test("Authorization: Campaign access control enforces ownership for AGENT role", () => {
  const agent1 = { userId: "agent_1", role: "AGENT" };
  const agent2 = { userId: "agent_2", role: "AGENT" };
  const admin = { userId: "admin_1", role: "ADMIN" };

  const campaignOwnedBy1 = { createdById: "agent_1" };

  assert.equal(canAccessCampaign(agent1, campaignOwnedBy1), true, "Creating agent can view campaign");
  assert.equal(canAccessCampaign(agent2, campaignOwnedBy1), false, "Unrelated agent cannot view campaign");
  assert.equal(canAccessCampaign(admin, campaignOwnedBy1), true, "Admin can view any campaign");
});

test("Authorization: Opportunity modification requires ownership or privileged role", () => {
  const agent1 = { userId: "agent_1", role: "AGENT" };
  const agent2 = { userId: "agent_2", role: "AGENT" };
  const manager = { userId: "manager_1", role: "MANAGER" };

  const opp1 = { assignedToId: "agent_1" };

  assert.equal(canModifyOpportunity(agent1, opp1), true, "Assigned agent can modify opportunity");
  assert.equal(canModifyOpportunity(agent2, opp1), false, "Non-assigned agent cannot modify opportunity");
  assert.equal(canModifyOpportunity(manager, opp1), true, "Manager can modify any opportunity");
});

test("Authorization: User profile view restricts agents to viewing only their own profile", () => {
  const agent1 = { userId: "agent_1", role: "AGENT" };
  const admin = { userId: "admin_1", role: "ADMIN" };

  assert.equal(canViewUserProfile(agent1, "agent_1"), true, "Agent can view own profile");
  assert.equal(canViewUserProfile(agent1, "agent_2"), false, "Agent cannot view another user profile");
  assert.equal(canViewUserProfile(admin, "agent_2"), true, "Admin can view another user profile");
});

test("Authorization: Job queue logs and telemetry streams restricted to ADMIN/MANAGER", () => {
  const agent = { userId: "agent_1", role: "AGENT" };
  const manager = { userId: "manager_1", role: "MANAGER" };
  const admin = { userId: "admin_1", role: "ADMIN" };

  assert.equal(canAccessJobQueues(agent), false, "Agents cannot view internal job queues");
  assert.equal(canAccessJobQueues(manager), true, "Managers can view job queues");
  assert.equal(canAccessJobQueues(admin), true, "Admins can view job queues");
});
