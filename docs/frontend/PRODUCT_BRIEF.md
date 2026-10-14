# Personalized Language Learning Assistant App

## Target Users
Tutors and students in tutoring center.

## Usage Scenario
This app is designed to assist teaching and learning activities taking place in tutoring center. The purpose is to help teachers to improve workflow of preparing selected materials and generate practice for students based on their level. The core problem we intend to address with this app is to provide a more personalized and smart way to prioritize learning items, so this app will emphasize on context configuration and practice generation. The main usage of the app will be for students to complete in-class activities and tasks assigned as homework, so preferably the app should be designed in a tool-based and task-based style. Users will be able to select modules (or say features), launch a task, track list of tasks, and see progress and results.


## Main Modules
### Learning Profile
This module allows users to configure leaning profiles with preference data later used as context for practice activities. Fields for each profile include "Learning Goal, Current Level, Target Level". Multiple profiles can be configured. 
#### MAIN_SCREEN
The module main screen should have 3 sections:
- user information, includes user Avatar, name, id.
- Profile tracker. This can be a round circle pie / ring that track each profile with its percentage. By default each takes up equal portion.
- Profile tab for details of each profile, such as a configuration snapshot, and statistics tracking current progress (stage, average score, dictation counts, learned words, memorized words, failing words)
#### SCREEN_FLOW
- On the profile tracker, users can click an add button to create new profile
- the add button will create a new screen, where a profile creation process is launch. This will be a step by step configuration, each step asks a question for configuring one field in the profile. All questions are single choice question, with options listed for selection. One step ocupies a screen, with back and next arrows and task tracking bar for navigating. 

### Extract Vodabulary
This is a tool module that allows users to extract vocabulary items from user provided materials (mainly images for now). 
#### MAIN_SCREEN
The main screen should consider three sections:
- a dropbox for file upload, uploaded image will appear as preview.
- configuration for filters. This section will look like a form, fields are similar to what are in the learning profile, and will be auto-filled with data from the first profile users have. Adding more fields are possible, available extra fields include difficulty, frequency, personalized recommendation (as a checkbox).
- button to start extaction. 
#### SCREEN_FLOW
- After clicking the extract button, the results will be displayed in a new section under the button, with action buttons to either save to vocabulary or innitiate a dictation.


### Dictation
This module allows teachers and students to generate a dictation activity and take the excercise.
#### MAIN_SCREEN
The main screen will mainly be configuration of the dictation context, that is, the vocabulary scope used to generate dictation words. This will be a form consisting multiple filter fields:
- Activity (English-to-Chines and Chinese-to-English)
- Vocabulary scope
- Level
- count
- difficulty
- frequency
- preferred features (optional tags)
Most fields are with limited options preconfigured in database, so should appear as selectable boxes with each option as a box, seleced ones are filled with color. This is to avoid making users manually enter options.
#### SCREEN_FLOW
- main screen has a 'START' button which will launch a dictation session taking up the entire screen
- Words show up as cards in the middle of the screen, one word at a time. Left and right arrows to navigate to next word. A clickable tracker bar should be placed at the bottom for easy jumping to word. Underneath each word card, an input field allow students to enter the translation.
- At the last word, a submit button for submitting the activity.
- After submission, display the result mark in the middle, and the summary underneath it (result for each word).

### Tutor end custom module: Selected Dictation
This module is a custom module only exposed to the teacher account. The main purpose is to allow teachers to adjust word selection for dictation.
#### MAIN_SCREEN
Same as the main screen in Dictation module
#### SCREEN_FLOW
- main screen action button becomes 'GENERATE DICTATION LIST' instead of 'START'
- after clicking generation button, it enters a review screen, where all the recommended words are listed, each follows action buttons allowing teachers to remove or replace the word. At the bottom is action buttons, teacher can choose to either 'CREATE DICTATION TASK' or 'DISCARD'
- after clicking 'CREATE DICTATION TASK', a task ID and pass key will be generated on the screen, allowing copy or email to students.






