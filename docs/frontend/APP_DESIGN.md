# Design Brief: Knoczie, Personalized Language Learning Assistant

Design a modern, polished web application for a personalized language learning assistant called **Knoczie**, used by tutors and students in tutoring centers.

The product should combine a distinctive, intelligent visual identity with a clean and practical learning workspace. It should feel like a carefully designed product, not a generic SaaS dashboard or a typical AI-generated interface.

## 1. Product Concept

Knoczie helps tutors prepare personalized learning materials, generate vocabulary exercises, manage dictation activities, and support individual student learning.

The product is task-oriented rather than content-feed-oriented. Users select a module, configure the learning context, launch an activity, track its status, and review the results.

Primary users are tutors. Students use a simplified, focused interface when completing learning activities.

The core modules are:

1. **Learner Profile:** Configure and manage personalized learning profiles.
2. **Extract Vocabulary:** Extract vocabulary from uploaded learning materials.
3. **Dictation:** Configure and complete vocabulary dictation exercises.
4. **Selected Dictation:** Allow tutors to generate, review, and customize recommended vocabulary before creating a dictation task. (This maps back to the word-selection api in current project)

Do not invent additional product modules.

## 2. Visual Direction: Playful Precision

Create a distinctive visual identity that blends the clarity of a modern learning tool with the curiosity of a personal learning companion and the visual language of data technology.

The design should feel:

- Professional and technologically sophisticated, but approachable.
- Visually memorable without relying on excessive decoration.
- Intelligent and personalized, with a subtle sense of discovery.
- Clean and spacious, with strong visual hierarchy and intentional composition.
- Engaging enough for student learning without looking childish or excessively gamified.



### 2.1 Color Strategy

Explore a **high-contrast indigo and violet identity**, supported by light, restrained pastel surfaces.

Use a deliberate hierarchy of color roles:

- **Primary brand colors:** Iris blue, deep ink, rich indigo, or violet. Use these to establish identity and create visual emphasis.
- **Main workspace surfaces:** Clean white or very light cool neutrals. Maintain strong readability and generous negative space.
- **Secondary feature cards:** Use a small, coordinated set of pale tinted colors, such as soft lavender, cool cyan, or muted warm yellow. These should complement the deeper brand colors rather than compete with them.
- **Interactive emphasis:** Use a more saturated brand color for primary buttons, selected controls, key navigation states, and important actions.
- **Status colors:** Use clearly distinguishable success, warning, and error colors, supported by labels or icons.

Pastel colors are intended for secondary surfaces, not for all text, buttons, or interactive states. Maintain sufficient contrast between text, icons, and backgrounds.

Do not give every card an unrelated color. Establish a limited palette with consistent semantic roles.

### 2.2 Background and Depth

Explore a very subtle cool blue-to-violet gradient for the main workspace background to add brand personality and visual depth.

The gradient should be low-contrast and restrained. It must not reduce text readability, compete with the main content, or make the page feel hazy.

Keep cards and content areas clean and legible against the background. Use solid neutral surfaces where they improve focus, especially for forms, tables, vocabulary, answers, and scores.

Treat gradients, translucency, and shadows as optional supporting techniques rather than default styling for every component. If the gradient makes the layout feel less clear, prefer a solid light background.

### 2.3 Typography and Visual Identity

Use a contemporary, highly readable typeface with a clear typographic hierarchy, but not too plain. Prefer fonts a bit more substantial and intriguing for learning elements. Follow the app style.

Create visual interest through:

- Distinctive headline scale and weight.
- Intentional spacing and alignment.
- Contrasts between large focal elements and small supporting elements.
- Carefully composed asymmetry where appropriate.
- A restrained abstract visual motif inspired by vocabulary, connected data nodes, learning paths, or discovery.

Use the wordmark **Knoczie**. The optional brand tagline is **“Your words. Your way.”**

The brand should feel recognizable even without gradients or decorative effects.

Avoid:

- Generic enterprise dashboard styling.
- Repetitive equal-sized cards filling every available space.
- Excessive pastel colors with weak text contrast.
- Generic AI gradient blobs.
- Heavy glassmorphism applied to every card.
- Decorative elements behind important learning content.
- Tiny labels, dense visual noise, and excessive explanatory text.



## 3. Application Layout and Design System

Create a desktop-first responsive web application.

Use a narrow, collapsible left navigation rail.

**Collapsed state:**

- Show recognizable navigation icons with tooltips.
- Include a clear control to expand the sidebar.

**Expanded state:**

- Display navigation labels.
- Include an organized task tracker separate from module navigation.
- Show task names, status indicators, and access to recent or ongoing activities.

Keep navigation visually quiet so it does not compete with the main content.

Establish reusable design tokens and components for typography, color, spacing, buttons, form controls, feature cards, tables, progress indicators, and status states.

Maintain a consistent brand identity across screens, but do not force every screen to use the same layout or density. Choose the composition that best supports each task.

- Home workspace: expressive, spacious, and visually memorable.
- Tutor configuration: structured, efficient, and easy to scan.
- Vocabulary review: information-oriented and practical.
- Student dictation: focused, high-contrast, and distraction-free.



## 4. First Batch: Three screens

### Screen 1: Home / Personal Learning Hub

The Home screen should feel like a thoughtfully composed personal workspace, not a conventional analytics dashboard.  

**Primary focus: Learner Profile**

- Place the Learner Profile entrance prominently in the center of the main content area.
- Use a distinctive avatar, abstract identity graphic, or expressive visual symbol as its focal point.
- Make the title “Learner Profile” clear and prominent.
- Keep the central area uncluttered. Do not surround the profile entrance with statistics, multiple descriptive labels, or unnecessary information.
- The intended function is to open and configure the learner's personal learning profile.

**Secondary feature entrances**

Place only these three feature entrances beneath the central profile area:

- Extract Vocabulary
- Dictation
- Selected Dictation

Each entrance should primarily contain an icon and its feature name. Avoid explanatory subtitles and unnecessary descriptive paragraphs.

The three feature cards do not need to have identical widths. Let their dimensions respond naturally to the length of their titles. 

Use pale tinted surfaces for these secondary cards if appropriate, contrasted against darker, more distinctive brand elements. Keep the icons and labels legible.

**Composition and whitespace**

- All content should be centerred in the middle of the space, and don't take up too much space.
- Preserve generous negative space around the central profile entrance. Ample empty space showing only the background is preferred for a sense of clean and clarity.
- Establish one clear visual focal point, followed by a secondary group of feature entrances.
- Use scale, alignment, spacing, and restrained graphic details to create visual impact.
- Do not fill the page merely because space is available.
- Avoid charts, statistics, activity feeds, and extra feature sections that are not required by the product concept.

Use a concise header with the Knoczie wordmark and appropriate user identity or account controls. Keep branding restrained.

The overall effect should be a clean personal learning hub with a distinctive visual identity, not a page full of decorative cards.

### Screen 2: Selected Dictation Configuration

Design a tutor-oriented configuration page for preparing a personalized dictation activity.

Include:

- Function name and current step as the accent page title.
- A compact explanation of the task, only where useful.
- A form to configure selection context.
- A button to generate selection.

Use selectable chips, segmented controls, or compact selection cards for predefined options instead of requiring free-text entry.

Requirements:

- Group related controls logically.
- Make selected and unselected states immediately distinguishable.
- Use clear labels and comfortable spacing.
- Keep the form efficient and avoid excessive vertical scrolling.
- Use neutral content surfaces and strong text contrast.
- Include a prominent primary action labeled **“Generate Dictation List”**.

The configuration page should prioritize clarity and efficient decision-making over expressive decoration.

### Screen 3: Recommended Vocabulary Review

Design the review page shown after vocabulary recommendations have been generated.

Include:

- A clear page title and concise contextual information.
- A readable table or structured list of recommended vocabulary.
- The word and relevant metadata where useful.
- Clear **Remove** and **Replace** actions for each word.
- A sensible visual distinction between recommended words and editable selections.
- A practical way to inspect or modify the list without overwhelming the interface with controls.

At the bottom, provide:

- Primary action: **“Create Dictation Task”** (this will commit the selection)
- Secondary action: **“Discard”**

The page should help tutors review multiple words efficiently.

Use restrained visual emphasis to distinguish the main action and interactive states. Do not rely on pale color differences alone to communicate whether an item is selected, removed, or available for editing.