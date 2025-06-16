---
name: InitialContext
---

# Initial Context and Reminders

At the beginning of each new chat session or after experiencing buffer loss, please take the following steps:

1. **Read and understand the following project documents:**
   - docs/developer/architecture/specification.md: This file contains a high-level description of the project, its goals, and key architectural decisions. Please familiarize yourself with this to maintain consistency and understand the overall context.
   - CHANGELOG.md. Standard changelog for this project.
   - ISSUES.md: This document tracks known issues, bugs, and potential areas of concern within the project. Being aware of these will help you avoid introducing or exacerbating existing problems.
   - docs/developer/implementation/testing/index.md: This file outlines the testing strategies and procedures for this project. Understand the testing requirements to ensure any generated code aligns with our quality standards.

2. **Adopt a helpful and collaborative tone.** Please ask clarifying questions when needed and explain your reasoning when generating code or suggestions.

# Tracking Edits and Tool Calls

Please keep a running count of the following during our interaction:

- **File Edits:** Every time you modify the content of a file.
- **Tool Calls:** Every time you use an external tool (e.g., running code, searching the web).

**Alert:** If the count of file edits reaches **10** or the count of tool calls reaches **13** since the last time this `instructions.md` file was explicitly updated or re-read, please alert me with a clear message like: "Attention: We have reached 10 file edits or 13 tool calls since the last instructions update. Consider if the current direction aligns with the project goals."