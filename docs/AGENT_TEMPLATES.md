# Agent Templates Library

## Quick Start
1. Choose the template that matches your task
2. Copy the prompt
3. Replace [PLACEHOLDERS] with your specifics
4. Paste in Antigravity
5. Launch the agent

## Template Categories
- [Testing & QA](#testing--qa-templates)
- [Documentation](#documentation-templates)
- [Bug Fixes & Debugging](#bug-fixes--debugging-templates)
- [Refactoring & Code Quality](#refactoring--code-quality-templates)
- [Security & Validation](#security--validation-templates)
- [Feature Development](#feature-development-templates)
- [Integration & Coordination](#integration--coordination-templates)

---

## Testing & QA Templates

### 1. Testing Agent Template (Frontend & Backend)
**Use for:** Setting up Vitest/Jest, writing unit tests, or creating test coverage.
**Source of Success:** Agent 6 (Frontend) & Agent 7 (Backend).

**Copy-Paste Prompt:**
```markdown
[AGENT - TEST ENGINEER]

**Objective:** Implement a comprehensive testing suite for [COMPONENT_OR_MODULE_NAME].

**Context:**
- **Project Name:** [PROJECT_NAME] (e.g., BBC Agents)
- **Tech Stack:** [TECH_STACK] (e.g., React/Vite/Vitest or Node/Jest)
- **Target Files:** [LIST_OF_FILES_TO_TEST]
- **Current Coverage:** [LOW/NONE/PARTIAL]

**Requirements:**
1. **Infrastructure Setup:**
   - Check `package.json` for existing test scripts.
   - Install missing dependencies ([DEPENDENCIES] e.g., `vitest`, `@testing-library/react`, `jsdom`, `jest`, `supertest`).
   - Configure test runner (create/update `vitest.config.js` or `jest.config.js`).

2. **Test Implementation:**
   - Create test structure mirroring the source directory (e.g., `src/__tests__` or alongside components).
   - Write **Unit Tests** for isolated logic/utilities.
   - Write **Component/Integration Tests** for UI components or API routes.
   - **Critical:** Mock external dependencies (API calls, database connections) to ensure tests are fast and reliable.

3. **Validation:**
   - Run `npm test` to verify all tests pass.
   - Fix any immediate failures.
   - Ensure at least 80% coverage for the targeted files.

**Output:**
- Updated `package.json` with test scripts.
- Configuration files.
- Test files with passing tests.
- Execution log showing success.
```

### 2. QA/Testing Agent Template (Final Polish)
**Use for:** Final verification before a release, "Go/No-Go" decisions.
**Source of Success:** Agent 14 (QA Lead).

**Copy-Paste Prompt:**
```markdown
[AGENT - QA LEAD]

**Objective:** Perform final quality assurance on [RELEASE_VERSION_OR_FEATURE].

**Context:**
- **Scope:** [LIST_OF_FEATURES_TO_TEST]
- **Environment:** [ENVIRONMENT] (e.g., Local Dev, Staging)
- **Critical Path:** [MOST_IMPORTANT_USER_FLOW]

**Requirements:**
1. **Automated Verification:**
   - Run full test suite (`npm test`).
   - Run build process (`npm run build`) to check for compilation errors.
   - Check for linting errors (`npm run lint`).

2. **Manual Verification Plan:**
   - Create a checklist of user scenarios based on the "Critical Path".
   - (Agent Action) If possible, use browser automation tools to verify the critical path.
   - If manual, clearly list steps for the user to verify.

3. **Reporting:**
   - Identify blocking bugs (P0) and major issues (P1).
   - Produce a "Go/No-Go" recommendation.

**Output:**
- Testing checklist with results (Pass/Fail).
- Final Deployment Readiness Report.
```

---

## Documentation Templates

### 3. Documentation Agent Template
**Use for:** READMEs, Architecture docs, API references.
**Source of Success:** Agent 8 (Docs Specialist).

**Copy-Paste Prompt:**
```markdown
[AGENT - DOCUMENTATION SPECIALIST]

**Objective:** Create/Update documentation for [PROJECT/COMPONENT_NAME].

**Context:**
- **Target File(s):** [FILE_PATH] (e.g., README.md, CONTRIBUTING.md)
- **Target Audience:** [AUDIENCE] (e.g., New Developers, End Users)
- **Project Goal:** [BRIEF_DESCRIPTION]

**Requirements:**
1. **Content Structure:**
   - **Title & Overview:** High-level summary.
   - **Getting Started:** Prerequisites, Installation, and Running the project.
   - **Project Structure:** Explanation of key directories and files.
   - **Key Features:** Bullet points of what the project does.
   - **Tech Stack:** List of major libraries and frameworks.

2. **Quality Checks:**
   - Ensure all shell commands (e.g., `npm start`) are accurate.
   - Use clear markdown formatting (headers, code blocks, bold text).
   - Links must be valid (or clear placeholders).

**Output:**
- Complete Markdown content for [FILE_PATH].
```

---

## Bug Fixes & Debugging Templates

### 4. Bug Fix Agent Template
**Use for:** Resolving crashes, errors, or broken features.
**Source of Success:** Agent 3 (UI Fixer), Agent 11 (Login Fix).

**Copy-Paste Prompt:**
```markdown
[AGENT - BUG FIXER]

**Objective:** Resolve the issue: "[BUG_DESCRIPTION]" in [AFFECTED_COMPONENT/FILE].

**Context:**
- **Error Message:** [ERROR_MESSAGE]
- **Current Behavior:** [DESCRIPTION]
- **Expected Behavior:** [DESCRIPTION]
- **Suspected Cause:** [HYPOTHESIS] (Optional)

**Requirements:**
1. **Diagnostic Phase:**
   - Read the affected files (`view_file`).
   - Analyze the error to determine the root cause.
   - (Optional) Add temporary logging to trace the issue.

2. **Remediation Phase:**
   - Apply the fix.
   - **Constraint:** Do not remove existing logic unless it is the cause of the bug.
   - **Constraint:** Check for related files that might be impacted.

3. **Verification Phase:**
   - Describe exactly how to verify the fix works.
   - If possible, write a prompt for a regression test.

**Output:**
- Explanation of the root cause.
- Fixed code blocks.
- Verification steps.
```

---

## Refactoring & Code Quality Templates

### 5. Refactoring Agent Template
**Use for:** Cleanup, migration (e.g., to TS or new library), or performance tuning.
**Source of Success:** Agent 11 (Refactoring to React Hook Form).

**Copy-Paste Prompt:**
```markdown
[AGENT - REFACTOR SPECIALIST]

**Objective:** Refactor [FILE_PATH] to improve [GOAL] (e.g., readability, maintainability, adoption of [LIBRARY]).

**Context:**
- **File(s):** [FILE_PATH]
- **Constraint:** External behavior must remain unchanged ("Refactoring", not "Rewriting").

**Requirements:**
1. **Analysis:**
   - Identify code smells (duplicate code, long functions, magic numbers).
   - Identify opportunities for component extraction or hook creation.

2. **Execution:**
   - Perform the refactor in small, safe steps.
   - Ensure variable names are semantic and clear.
   - Add JSDoc/comments to complex logic.
   - **Critical:** Ensure existing tests still pass.

3. **Review:**
   - Compare "Before" vs "After" to ensure no features were lost.

**Output:**
- The improved code.
- Summary of improvements (e.g., "Reduced lines by 20%", "Improved Type safety").
```

### 6. Code Review Agent Template
**Use for:** Auditing code before merge.
**Source of Success:** Agent 14 (QA Lead).

**Copy-Paste Prompt:**
```markdown
[AGENT - CODE REVIEWER]

**Objective:** Review code in [FILE_PATH] against best practices.

**Context:**
- **Files to Review:** [FILE_PATH]
- **Focus Areas:** [FOCUS] (e.g., Security, Performance, Accessibility)

**Requirements:**
1. **Analysis:**
   - **Correctness:** Does the code do what it claims?
   - **Security:** Are there SQL injections, XSS vulnerabilities, or exposed secrets?
   - **Performance:** Are there unnecessary re-renders or N+1 queries?
   - **Style:** Does it follow standard conventions (e.g., ESLint/Prettier)?

2. **Output Report:**
   - List issues categorized by Severity (Critical, Major, Minor).
   - Provide **Code Suggestions** for how to fix the specific issues.
   - Rate the overall code quality (1-10).

**Output:**
- Structured Code Review Report.
```

---

## Security & Validation Templates

### 7. Security/Validation Agent Template
**Use for:** Form validation schemas (Zod), protecting routes, sanitizing inputs.
**Source of Success:** Agent 9 (Security Dev).

**Copy-Paste Prompt:**
```markdown
[AGENT - SECURITY ENGINEER]

**Objective:** Implement strict validation and security for [COMPONENT/ROUTE].

**Context:**
- **Target Component:** [COMPONENT_NAME]
- **Data Structure:** [BRIEF_DATA_DESC]
- **Tools:** [TOOLS] (e.g., Zod, React Hook Form, Joi)

**Requirements:**
1. **Schema Definition:**
   - Create a central schema file (e.g., `schemas/[name].js`).
   - Define strict types, lengths, and formats (e.g., email, strong password).
   - Add custom error messages for better UX.

2. **Implementation:**
   - Replace manual validation logic with the Schema validator.
   - Ensure frontend handles validation errors gracefully (UI feedback).
   - Ensure backend *also* validates the same data (never trust client).

**Output:**
- Validation schema code.
- Component/Route code with validation integrated.
```

---

## Feature Development Templates

### 8. Feature Development Agent Template
**Use for:** Creating new features from scratch.
**Source of Success:** Agent 4 (Feature Integration).

**Copy-Paste Prompt:**
```markdown
[AGENT - FEATURE DEVELOPER]

**Objective:** Develop the [FEATURE_NAME] feature.

**Context:**
- **Project:** [PROJECT_NAME]
- **Techniques:** [TECH_STACK]
- **Requirements:** [LINK_TO_DOC_OR_LIST]

**Requirements:**
1. **Planning:**
   - Break down the feature into components and logic.
   - Identify necessary file changes (New vs. Modified).

2. **Step-by-Step Implementation:**
   - **Step 1:** Create Core Components (`src/components/...`).
   - **Step 2:** Implement Business Logic (State/Hooks/API).
   - **Step 3:** Create/Update Pages/Routes.
   - **Step 4:** Style the components to match the Design System.

3. **Integration:**
   - Ensure the new feature links correctly from the main navigation/flow.

**Output:**
- List of created files.
- Full code for new components.
- Diff for modified existing files.
```

---

## Integration & Coordination Templates

### 9. Integration Agent Template
**Use for:** Connecting Frontend to Backend, or merging two systems.
**Source of Success:** Agent 2 (Auth/Project View), Agent 4 (Tasks).

**Copy-Paste Prompt:**
```markdown
[AGENT - INTEGRATION SPECIALIST]

**Objective:** Integrate [FRONTEND_COMPONENT] with [BACKEND_ENDPOINT].

**Context:**
- **Frontend Code:** [FILE_PATH_FE]
- **Backend Code:** [FILE_PATH_BE]
- **API Contract:** [DESCRIPTION_OF_EXPECTED_DATA]

**Requirements:**
1. **Audit:**
   - Verify the Backend route exists and returns the expected JSON structure.
   - Verify the Frontend fetch/axios call points to the correct URL and Method.

2. **Connection:**
   - Implement the API call in the frontend.
   - Handle **Loading State** (spinners/skeletons).
   - Handle **Error State** (toasts/messages).
   - Handle **Success State** (redirects/updates).

3. **Type Safety:**
   - Ensure variable names match exactly (e.g., `userId` vs `user_id`).

**Output:**
- Fully integrated code for both sides.
- Confirmation of successful data flow.
```

### 10. Monitoring/Coordination Agent Template
**Use for:** Managing complex prompts or multi-agent workflows.
**Source of Success:** Agent 10 (Status Report), Agent 12 (Monitor).

**Copy-Paste Prompt:**
```markdown
[AGENT - COORDINATOR]

**Objective:** Monitor and coordinate the progress of [TASKS/AGENTS].

**Context:**
- **Active Tasks:** [LIST_TASKS]
- **Goal:** [FINAL_DELIVERABLE]

**Requirements:**
1. **Status Check:**
   - Scan the workspace for recent file changes.
   - Read specific output files (e.g., `docs/status.md` or logs).

2. **Analysis:**
   - Compare current state vs. expected state.
   - Identify stuck tasks, missing files, or errors.

3. **Directive:**
   - Update the Master Status Document.
   - Provide next-step instructions for the User or the next Agent.

**Output:**
- Current Status Report.
- "Next Steps" Checklist.
```
