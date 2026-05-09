---
name: project-evaluator
description: A comprehensive framework for evaluating codebases across Architecture, Performance, UI/UX, Security, and Code Quality.
---

# Project Evaluator

The `project-evaluator` skill is designed to run a complete, 360-degree diagnostic on a codebase. Use this skill when asked to "evaluate", "review", or "audit" a project or specific file.

## Usage Guidelines

When instructed to evaluate a project, follow these 5 pillars of evaluation:

### 1. Architecture & Maintainability
- **Modularity:** Are components and functions decoupled? Is business logic separated from UI?
- **State Management:** Is state managed efficiently (e.g., preventing unnecessary re-renders)?
- **File Structure:** Is the project organized logically? Are naming conventions consistent?

### 2. Code Quality & Clean Code
- **Readability:** Are variable and function names descriptive? Is the code self-documenting?
- **Complexity:** Are there massive, monolithic functions that should be broken down?
- **Error Handling:** Are edge cases and failures caught gracefully?

### 3. Performance Optimization
- **Load Times:** Are assets (images, fonts, bundles) optimized and lazy-loaded where appropriate?
- **Execution Speed:** Are there any blocking operations, expensive calculations in render cycles, or memory leaks?
- **Network:** Are API calls optimized (debounced, cached, batched)?

### 4. UI/UX & Accessibility (a11y)
- **Design Consistency:** Do the UI components align with the stated design system?
- **Responsiveness:** Does the layout break on smaller or extremely large screens?
- **Accessibility:** Are `aria-labels`, `alt` tags, and proper semantic HTML elements (`<button>`, `<nav>`, `<main>`) used? Is color contrast sufficient?

### 5. Security & Best Practices
- **Data Sanitization:** Is user input properly sanitized to prevent XSS or injection attacks?
- **Dependency Health:** Are there outdated or vulnerable dependencies?
- **Secret Management:** Are API keys or secrets accidentally hardcoded?

## The Output Format
When delivering an evaluation, output the response using this structure:

1. **Executive Summary:** A 2-sentence summary of the overall health of the codebase.
2. **Critical Issues (Red Flags):** Things that must be fixed immediately (security, crashing bugs).
3. **Pillar Breakdown:** A quick analysis of the 5 pillars (Architecture, Quality, Performance, UI/UX, Security).
4. **Actionable Roadmap:** 3-5 specific, prioritized steps to improve the codebase.
