# Frontend Development Guidelines (current stage)

## Project Goal
This is a simple teacher-facing dictation word-selection web application using React and TypeScript. The frontend should consume the existing backend APIs. Current version is for demo only, used to explain concept to stake holder and get feedback for next iteratin.

## Code Readability
- Prioritize readability, explicit logic, and maintainability over clever or overly abstract solutions.
- Use functional React components and standard React hooks.
- Use clear, descriptive variable, function, and component names.
- Prefer straightforward conditional logic over nested ternaries or dense expressions.
- Add comments to explain non-obvious business logic, not obvious code.
- Keep components focused on a clear responsibility.
- Do not create unnecessary abstractions, custom hooks, utility layers, or wrapper components.
- Do not introduce patterns or libraries solely for hypothetical future requirements.

## Architecture
- Considering developer knowledge level, prefer using React and vite for development.
- Keep API requests and response handling separate from UI components.
- Define TypeScript types for important API requests and responses.
- Keep business rules in the backend whenever the backend already provides them.
- Use React state for local UI state unless shared state genuinely requires another solution.
- Reuse existing project conventions and dependencies where practical.

## Scope Control
- Implement only explicitly requested features.
- Do not change existing backend behavior or refactor unrelated files.
- Do not add a routing library, global state library, or UI framework unless there's a obvious benefit for the current project scope (need to be explanable).
- Preserve existing API contracts. Do not guess endpoint paths, request fields, or response shapes.
- Prefer implementing one functional slice at a time.

#Constraints:
- Prefer simple React components and standard hooks.
- Keep API calls separate from UI components.
- Do not duplicate backend business logic.
- Do not introduce unnecessary libraries or abstractions.
- Do not modify the backend or refactor unrelated code.
- Do not invent API contracts or business behavior.