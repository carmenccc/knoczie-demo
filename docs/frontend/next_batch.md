### Screen 4: Student Dictation Practice (UI only)

Design a focused student-facing interface for completing a dictation activity.

This screen should have a different interaction atmosphere from the tutor workspace while retaining the same Knoczie brand identity.

Include:

- A concise activity title.
- A clear progress indicator.
- A prominent central word or question area.
- A clearly labeled translation input.
- Previous and next controls.
- A clickable question tracker along the bottom or in another easy-to-reach location.
- A submit action when the student reaches the end of the activity.

Show meaningful example states for current, completed, and unanswered questions.

**Visual requirements:**

- The current word or question must dominate the screen.
- The input field must be easy to find and use.
- Progress and navigation states must be clearly distinguishable.
- Use strong foreground/background contrast and readable typography.
- Avoid distracting background graphics, excessive cards, and unnecessary explanatory content.
- Use the brand accent color purposefully for focus and interaction states.
- Keep the interface engaging and energetic without childish illustrations or excessive gamification.

The student should always understand three things at a glance: what to answer, where to enter the answer, and how much of the activity remains.

## 5. Interaction and Design Quality

Treat these four frames as one connected application, not four unrelated concepts.

Use consistent design tokens, navigation patterns, component behavior, and interaction states while adapting the layout to each screen's purpose.

The tutor workflow should be visually clear:

**Configure → Generate → Review → Create Task**

The student interface should support focused completion of the assigned dictation activity.

Include realistic labels, plausible sample content, selected and unselected states, and balanced empty space.

Ensure that:

- Primary and secondary actions are visually distinct.
- Interactive controls have clear hover, focus, selected, disabled, and relevant status states.
- Text contrast remains accessible.
- Layouts use sensible desktop spacing and adapt to narrower screens.
- Shared components are reusable and practical to implement in React.
- No invented modules or complex functionality are added beyond this brief.