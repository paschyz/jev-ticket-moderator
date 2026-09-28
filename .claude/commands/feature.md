---
description: Implement a feature following TDD workflow with architecture awareness
---

Implement: $ARGUMENTS

Workflow:

1. Read relevant source files and ADRs in docs/adr/
2. Identify expected behavior and which layers are affected
3. If the change crosses architectural boundaries or adds a new port, call the `architect` agent
4. Write a failing test (RED) that captures the expected behavior
5. Run `make test-unit` — verify it fails for the right reason
6. Implement the minimum code to pass (GREEN)
7. Run `make test-unit` — verify it passes
8. Refactor if the code can be simplified
9. Run `make check` to validate everything
10. Call the `reviewer` agent to review the diff
11. Address relevant findings
12. Run `make check` again
13. Summarize: what changed, what was skipped, what to add later
