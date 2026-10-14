# Frontend redesign progress

Visual reference: the Figma Make prototype, adjusted with the notes from review. Home B and the unused PNG assets are out. The word-selection API flow stays as it is.

## Proposal

Keep the Make color system and the cool gradient workspace. Iris, deep ink, and the pale cyan, yellow, and lavender feature tints stay, with white surfaces for anything the user has to read or decide.

**Outfit** is used for the wordmark, titles, and feature names. It is a modern geometric sans, in place of the earlier serif. **Sora** stays on navigation, buttons, and form text.

The sidebar keeps the logo, the expand control, a Home icon, and a settings icon at the bottom. Module links are not listed there. A task tab appears only while a selection is in progress, with that task’s icon and name. Collapsed, the tab is the icon alone, and the open tab uses a solid iris fill. With no task, that middle area stays empty. The workspace has a night-mode toggle and an account image at the top right.

Home has no greeting. Learner Profile is one stacked control: a small companion mark, then the title underneath. It is smaller than the Make version and sits in open space. The three feature entrances stay under it, as icon and name only.

No component library in this slice. The shell is a handful of custom controls, and a kit would fight the color system. Revisit a headless library if the review table or replace dialog needs one.

Selected Dictation opens the configure form, then a single-title review list: remove, replace from the leftover pools, Create Dictation Task, and Discard. The saved list shows the event id. Learner Profile, Extract Vocabulary, and Dictation open a one-line placeholder.

## Tasks

- [x] **Foundation.** Tokens, Outfit and Sora, gradient workspace, collapsible task sidebar, night mode, account image. Selection behavior unchanged.
- [x] **Home.** Stacked Learner Profile, three feature entrances, no welcome line.
- [x] **Configure.** Restyle the generate form with chips bound to the real API options. Label the action Generate Dictation List.
- [x] **Review and commit.** One title, no marketing heading stack. Remove, leftover-word replace, Create Dictation Task, and Discard stay on the API. Chinese gloss is placeholder text.
- [ ] **Student practice.** Focused dictation screen, interface only, after the tutor path.
