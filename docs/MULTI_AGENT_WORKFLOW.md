# Multi-Agent Development Workflow

This document outlines the standard operating procedure for multi-agent development, based on the successful orchestration of 15 agents in the BBC Agents project.

## SECTION 1: Introduction to Multi-Agent Development

### What is Multi-Agent Development?
Multi-agent development is a software engineering paradigm where strictly scoped tasks are delegated to specialized AI agents. Instead of one generalist developer trying to "do it all," multiple agents act as a virtual team—simultaneously writing code, generating documentation, writing tests, and fixing bugs.

### When to Use It
| Scenario | Approach | Reason |
|----------|----------|--------|
| **Simple Bug Fix** | Single Agent | Context switching overhead is unnecessary. |
| **New Feature (End-to-End)** | Hybrid (3-4 Agents) | Requires database, API, and UI work (Frontend, Backend, Integration). |
| **Greenfield Project** | Multi-Agent Swarm | Parallelizable foundation work (Setup, Docs, CI/CD, Auth). |
| **Legacy Code Audit** | Parallel | One agent maps structure, one checks security, one runs tests. |

### Benefits Demonstrated in This Project
The "BBC Agents" project demonstrated a massive efficiency gain: **work estimated at 2 weeks of manual effort was completed in approximately 2 hours.**

*   **Parallelism:** Frontend (Agent 6) and Backend (Agent 7) testing infrastructures were built simultaneously.
*   **Specialization:** The Security Dev (Agent 9) focused solely on Zod validation, ensuring high-quality security without being distracted by UI layout.
*   **Speed:** Documentation (Agent 8) was written while code was still being refactored, ensuring docs were ready immediately at launch.

---

## SECTION 2: Pre-Planning Phase

The success of a multi-agent swarm depends entirely on the initial breakdown.

### 2.1 Goal Analysis
Start with the high-level objective and decompose it until tasks have **zero overlapping file dependencies** where possible.

*   **High-Level Goal:** "Get the project ready for deployment."
*   **Decomposition:**
    1.  *Is the server running?* -> System Architect.
    2.  *Do we have tests?* -> Test Engineers.
    3.  *Is it documented?* -> Docs Specialist.
    4.  *Are there bugs?* -> Bug Fixer.

**Key Technique:** Identify "Parallel Zones." Files like `README.md`, `vitest.config.js`, and `src/components/ui/` typically don't conflict, allowing agents to work on them at the same time.

### 2.2 Task Sizing
Assign tasks based on complexity:

*   **Small (1 Agent, <5 min):** "Create a README," "Write a unit test for one function," "Fix a specific syntax error."
*   **Medium (1 Agent, 5-15 min):** "Implement a new form with validation," "Refactor a controller," "Set up a testing framework."
*   **Large (Multi-Agent Sequence):** "Build the Task Management System." (Requires: Database Agent -> API Agent -> UI Agent).

### 2.3 Agent Selection
Choose the right persona for the job. Do not send a "General Coder" to do a "Security Audit."

*   **Analyst/Architect:** For planning and file structure mapping.
*   **Specialist:** For specific domains (React, Node, SQL, Security).
*   **Orchestrator:** For managing dependencies and reviewing other agents' work.

---

## SECTION 3: Agent Deployment

Deployment strategies vary based on dependencies.

### 3.1 Launch Sequence

#### A. Serial Deployment (The "Waterfall" Chain)
Use when Agent B needs Agent A's output.
*   **Pattern:** `Agent A (Fix Server)` -> `Agent B (Fix Auth)` -> `Agent C (Fix Protected UI)`
*   **Project Example:** Agents 1, 2, 3, and 4 ran sequentially to stabilize the foundation before features were added.

#### B. Parallel Deployment (The "Swarm")
Use when tasks are independent.
*   **Pattern:** `Agent A (Frontend Tests)` + `Agent B (Backend Tests)` + `Agent C (Docs)`
*   **Project Example:** Agents 6, 7, 8, and 9 ran simultaneously.
    *   Agent 6 touched `client/`
    *   Agent 7 touched `server/tests/`
    *   Agent 8 touched `*.md`
    *   Agent 9 created *new* validation files.
    *   **Result:** 4x throughput.

#### C. Hybrid Deployment (Orchestrated Swarm)
The most powerful model. An Orchestrator manages serial chains and parallel swarms.
*   **Pattern:**
    1.  **Analyst (Agent 5)** defines the plan.
    2.  **Swarm (Agents 6-9)** executes parallel tasks.
    3.  **Reporter (Agent 10)** checks status.
    4.  **Integration (Agent 11-14)** handles merge conflicts and final polish.

### 3.2 Naming Conventions
Always use: `[AGENT XX - DESCRIPTIVE ROLE]`
*   Example: `[AGENT 6 - FRONTEND TEST ENGINEER]`
*   Why? This makes searching history and logs easy and identifies the "owner" of the work.

### 3.3 Monitoring
*   **Inbox Tracking:** Use Antigravity Inbox to track all agents.
*   **Coordinators:** Create coordinator agents for complex workflows.
*   **Status Reporters:** Set up status reporters for large batches.

---

## SECTION 4: Coordination Patterns

### 4.1 The Coordinator Pattern
Use a monitoring agent to track multiple agents:
- Agent 10 (Status Reporter)
- Agent 12 (Progress Monitor)
- Agent 14 (QA Lead)

### 4.2 The Orchestrator Pattern
Use a master agent to plan and spawn sub-agents:
- Agent 13 (Orchestrator)

### 4.3 The Sequential Pattern
Agent B waits for Agent A to complete:
- Agent 11 waited for Agent 9's validation schemas

### 4.4 The Parallel Pattern
Multiple agents work independently:
- Agents 6, 7, 8, 9 all ran simultaneously

---

## SECTION 5: Common Workflows

### Workflow 1: New Feature Development
1. **Planning Agent:** Analyze requirements.
2. **Feature Agents:** Parallel work (Frontend, Backend, Tests).
3. **Integration Agent:** Connect the pieces.
4. **QA Agent:** Verify everything works.

### Workflow 2: Bug Fix Sprint
1. **Triage Agent:** Categorize bugs.
2. **Fix Agents:** Parallel fix (one per bug).
3. **Test Agent:** Regression testing.
4. **Verification Agent:** Manual testing checklist.

### Workflow 3: Code Quality Improvement
1. **Audit Agent:** Identify issues.
2. **Refactoring Agents:** Parallel refactor (by module).
3. **Test Agent:** Ensure no regressions.
4. **Documentation Agent:** Update docs.

### Workflow 4: Testing Infrastructure
1. **Setup Agent:** Install dependencies, config.
2. **Test Writing Agents:** Parallel writing (by component).
3. **Coverage Agent:** Analyze gaps.
4. **Fix Agent:** Address failing tests.

---

## SECTION 6: Best Practices

### ✅ DO:
- Start with clear, specific goals.
- Use descriptive agent names with `[AGENT XX - NAME]` format.
- Launch independent agents in parallel.
- Create monitoring agents for large batches.
- Document what each agent does.
- Keep agents focused on single responsibilities.
- Use templates for common tasks.

### ❌ DON'T:
- Launch too many agents at once (5-7 max in parallel).
- Create circular dependencies.
- Give vague instructions.
- Forget to monitor progress.
- Skip the planning phase.
- Launch dependent agents before prerequisites complete.

---

## SECTION 7: Troubleshooting

### Problem: Agent Gets Stuck
**Solution:**
- Check the conversation for waiting/approval requests.
- Provide specific guidance or approval.
- If truly stuck, summarize work and launch new agent.

### Problem: Conflicting Changes
**Solution:**
- Use sequential deployment for interdependent tasks.
- Create integration agent to resolve conflicts.
- Review changes before committing.

### Problem: Agent Misunderstands Task
**Solution:**
- Be more specific in prompt.
- Provide examples of desired output.
- Reference existing files/patterns.

---

## SECTION 8: Metrics & Success Indicators

Track these metrics for your multi-agent workflows:

*   **Total agents deployed**
*   **Parallel vs sequential ratio**
*   **Time saved** (estimated manual time vs actual)
*   **Success rate** (completed without issues)
*   **Files created/modified**
*   **Tests added/passing**

### Example from BBC Agents project:
- **Agents:** 15
- **Parallel batches:** 3
- **Time saved:** ~2 weeks → 2 hours (~90% reduction)
- **Success rate:** 100%
- **Tests:** 14 (all passing)
- **Files:** 30+ created/modified

---

## SECTION 9: Case Study - BBC Agents Project

Walk through the actual agent deployment for this project:

**Phase 1: Debugging & Stabilization (Agents 1-4)**
- **Type:** Serial deployment
- **Action:** Each fixed critical issues.
- **Outcome:** Foundation for parallel work established.

**Phase 2: Parallel Development (Agents 6-9)**
- **Type:** Simultaneous Swarm
- **Action:** Testing, Docs, Validation ran at the same time.
- **Outcome:** Completed in ~15 minutes total. No dependencies between them.

**Phase 3: Integration & Polish (Agents 10-14)**
- **Type:** Mixed serial and parallel
- **Action:** Coordination and quality assurance.
- **Outcome:** Final verification and automated reporting.

**Phase 4: Organization (Agents 15-20)**
- **Type:** Documentation Swarm
- **Action:** Documenting the process and creating reusable systems.

---

## SECTION 10: Quick Start Checklist

For your next multi-agent project:

- [ ] Define high-level goal clearly.
- [ ] Break into 5-10 specific tasks.
- [ ] Identify which tasks can run in parallel.
- [ ] Choose agent templates from `AGENT_TEMPLATES.md`.
- [ ] Customize templates with project specifics.
- [ ] Create launch sequence (batches).
- [ ] Launch first batch of agents.
- [ ] Monitor progress in Antigravity Inbox.
- [ ] Handle approvals/questions as they arise.
- [ ] Launch subsequent batches.
- [ ] Create QA/integration agent.
- [ ] Verify all work with tests.
- [ ] Commit changes with detailed message.
- [ ] Update `AGENT_REGISTRY.md`.
