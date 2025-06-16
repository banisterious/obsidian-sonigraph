# Documentation Style Guide

## Executive Summary

- **Consistency**: Maintain consistent formatting, voice, and structure across all documentation
- **Visual Aid**: Use annotated screenshots and images to enhance understanding
- **Accessibility**: Ensure all documentation is accessible to all users
- **Organization**: Follow the established file and section structure for all documents
- **User-Focused**: Write from the user's perspective with clear, concise language

## Table of Contents

- [1. Introduction](#1-introduction)
- [2. Voice and Tone](#2-voice-and-tone)
- [3. Documentation Types](#3-documentation-types)
- [4. Directory Structure](#4-directory-structure)
  - [4.1. Organization Guidelines](#41-organization-guidelines)
  - [4.2. Naming Conventions](#42-naming-conventions)
  - [4.3. Cross-Reference Standards](#43-cross-reference-standards)
- [5. Image Guidelines](#5-image-guidelines)
  - [5.1. Image Organization and Sizing](#51-image-organization-and-sizing)
  - [5.2. Banner Creation](#52-banner-creation)
- [6. Document Structure and Format](#6-document-structure-and-format)
  - [6.1. Table of Contents (TOC)](#61-table-of-contents-toc)
  - [6.2. Heading Structure](#62-heading-structure)
- [7. Annotated Screenshots](#7-annotated-screenshots)
  - [7.1. Purpose](#71-purpose)
  - [7.2. Key Sections to Annotate](#72-key-sections-to-annotate)
  - [7.3. Steps for Creating Screenshots](#73-steps-for-creating-screenshots)
  - [7.4. Suggested Locations](#74-suggested-locations)
  - [7.5. Annotated Screenshot Template](#75-annotated-screenshot-template)
- [8. CSS Styling](#8-css-styling)
  - [8.1. Banner Fade Effect](#81-banner-fade-effect)
  - [8.2. Lucide Icon Overlay](#82-lucide-icon-overlay)
  - [8.3. Custom Callout Background](#83-custom-callout-background)
- [9. Color Palette](#9-color-palette)
  - [9.1. From "gsa-barn"](#91-from-gsa-barn)
  - [9.2. From "gsa-strange-landscape"](#92-from-gsa-strange-landscape)
- [10. Modal and Leaf Design Standards](#10-modal-and-leaf-design-standards)
  - [10.1. Standard Modal Layout](#101-standard-modal-layout)
  - [10.2. Implementation Notes](#102-implementation-notes)
- [11. Accessibility Guidelines](#11-accessibility-guidelines)
  - [11.1. Images and Visual Content](#111-images-and-visual-content)
  - [11.2. Structure and Navigation](#112-structure-and-navigation)
  - [11.3. Text and Readability](#113-text-and-readability)
- [12. Mobile Considerations](#12-mobile-considerations)
  - [12.1. Responsive Design](#121-responsive-design)
  - [12.2. Touch Interactions](#122-touch-interactions)
- [13. Documentation Review Process](#13-documentation-review-process)
  - [13.1. Review Checklist](#131-review-checklist)
  - [13.2. Workflow](#132-workflow)
- [14. Version Control Guidelines](#14-version-control-guidelines)
  - [14.1. When to Update Documentation](#141-when-to-update-documentation)
  - [14.2. Versioning Strategy](#142-versioning-strategy)
  - [14.3. Date Usage Guidelines](#143-date-usage-guidelines)
- [15. Documentation Templates](#15-documentation-templates)
  - [15.1. Feature Documentation Template](#151-feature-documentation-template)
  - [15.2. Tutorial Template](#152-tutorial-template)
  - [15.3. Technical Documentation Template](#153-technical-documentation-template)
  - [15.4. Feature Plan Template](#154-feature-plan-template)
- [16. Implementation Checklist](#16-implementation-checklist)

## 1. Introduction

This document provides guidelines for the visual style and presentation of Sonigraph plugin documentation, ensuring consistency, clarity, and user-friendliness. It covers writing style, image usage, annotated screenshots, and CSS styling.

The primary goal of our documentation is to help users understand and effectively use the Sonigraph plugin while adhering to a consistent style that reflects the project's aesthetic and values.

## 2. Voice and Tone

### Writing Style

- **Person**: Use second person ("you") when addressing the user directly
- **Tense**: Use present tense for actions and descriptions
- **Active Voice**: Prefer active voice over passive voice
- **Clarity**: Use clear, concise language without unnecessary jargon
- **Consistency**: Maintain consistent terminology throughout all documentation
- **Personal Pronouns**: Avoid using "we," "our," or "us" in documentation. Instead, refer directly to "the plugin," "the feature," or use other specific subjects.

### Examples

#### Preferred:
- "Click the Settings button to access configuration options."
- "You can customize your metrics by adding new entries."
- "The plugin automatically creates backups before making changes."
- "This feature enables filtering by date."
- "Version 0.5.0 introduced the Dream Journal Manager."

#### Avoid:
- "The Settings button should be clicked to access configuration options."
- "Users may customize their metrics by adding new entries."
- "Backups are automatically created by the plugin before changes are made."
- "We added a new feature that enables filtering by date."
- "We introduced the Dream Journal Manager in version 0.5.0."

### Technical Writing Guidelines

- Break complex procedures into numbered steps
- Use bullet points for lists of related items
- Highlight important notes using blockquotes (> syntax in Markdown)
- Use code blocks for any commands, callout syntax, or code examples
- Define abbreviations and technical terms on first use

## 3. Documentation Types

Sonigraph documentation includes several types, each with specific purposes:

### User Guide (user/guides/*.md)
- **Purpose**: Comprehensive instructions for using the plugin
- **Structure**: Organized by features, with step-by-step instructions
- **Content**: Screenshots, examples, and detailed explanations
- **Audience**: All users, from beginners to advanced

### Tutorials (user/guides/*.md)
- **Purpose**: Guide users through specific tasks from start to finish
- **Structure**: Sequential steps with clear beginnings and endpoints
- **Content**: Heavily illustrated with screenshots, focused on learning by doing
- **Audience**: New users or those learning specific features

### Reference Guides (user/reference/*.md)
- **Purpose**: Detailed information about specific features
- **Structure**: Organized by feature or component, not by task
- **Content**: Comprehensive, detailed explanations of options and settings
- **Audience**: Users who need in-depth information about specific features

### Technical Documentation (developer/*)
- **Purpose**: Technical details for developers and contributors
- **Structure**: Organized by system components and technical concepts
- **Content**: Code examples, API descriptions, data structures
- **Audience**: Developers and contributors

### Conceptual Guides (user/concepts/*.md)
- **Purpose**: Explain concepts and principles rather than specific procedures
- **Structure**: Organized by topic or concept
- **Content**: Explanations, diagrams, examples
- **Audience**: Users who want to understand how things work

### Planning Documents (planning/*)
- **Purpose**: Outline future development and feature plans
- **Structure**: Organized by feature or milestone
- **Content**: Requirements, designs, implementation plans
- **Audience**: Developers and contributors

## 4. Directory Structure

### 4.1. Organization Guidelines

Sonigraph documentation follows a structured organization to improve discoverability and maintainability:

#### Primary Directory Structure
```
docs/
├── user/                           # End-user documentation
│   ├── guides/                     # How-to guides
│   ├── concepts/                   # Conceptual explanations
│   └── reference/                  # Reference materials
├── developer/                      # Developer documentation
│   ├── architecture/               # System architecture
│   ├── implementation/             # Implementation details
│   ├── testing/                    # Testing guidance
│   └── contributing/               # Contribution guides
├── planning/                       # Active planning documents
│   ├── features/                   # Feature planning
│   └── feature-requirements/       # Detailed requirements
├── assets/                         # Documentation assets
│   ├── images/                     # Screenshots and diagrams
│   └── templates/                  # Document templates
├── archive/                        # Historical documents
└── README.md                       # Documentation home/index
```

#### Rules for Document Placement

1. **User-facing documentation** should be placed in the `user/` directory:
   - Step-by-step instructions in `user/guides/`
   - Conceptual explanations in `user/concepts/`
   - Reference materials in `user/reference/`

2. **Developer documentation** should be placed in the `developer/` directory:
   - Architecture overviews in `developer/architecture/`
   - Implementation details in `developer/implementation/`
   - Testing information in `developer/testing/`
   - Contribution guidelines in `developer/contributing/`

3. **Planning documents** should be placed in the `planning/` directory:
   - Active feature plans in `planning/features/`
   - Requirements in `planning/feature-requirements/`

4. **Assets** should be placed in the `assets/` directory:
   - Images, screenshots, and diagrams in `assets/images/`
   - Document templates in `assets/templates/`

5. **Historical documents** should be placed in the `archive/` directory:
   - Organized by type (specs, plans, legacy)

#### When to Create New Directories

1. Create a new subdirectory when:
   - You have 3+ related documents that form a logical group
   - A new feature area is being documented that doesn't fit existing categories
   - You need to separate content for better organization

2. Get approval before creating top-level directories

3. Document new directories in the root README.md

### 4.2. Naming Conventions

Consistent file naming improves navigation and organization:

#### File Naming Patterns

1. **User Guides**: `<feature-name>.md`
   - Example: `dream-journal.md`, `metrics.md`

2. **Reference Documents**: `<subject>-reference.md`
   - Example: `metrics-reference.md`, `settings-reference.md`

3. **Architecture Documents**: `<component>-architecture.md`
   - Example: `state-management-architecture.md`

4. **Implementation Documents**: `<component>-implementation.md`
   - Example: `metrics-system-implementation.md`

5. **Feature Plans**: `<feature-name>-plan.md`
   - Example: `templater-integration-plan.md`

#### Case Conventions

- Use **kebab-case** for all file names (lowercase with hyphens)
  - Correct: `dream-journal-manager.md`
  - Incorrect: `DreamJournalManager.md`, `dream_journal_manager.md`

- Use **Title Case** for directory names
  - Correct: `Implementation/`
  - Incorrect: `implementation/`

#### File Extension

- Use `.md` for all documentation files

### 4.3. Cross-Reference Standards

Consistent cross-referencing improves navigation and maintenance:

#### Internal Links

1. **Use relative paths** for links between documentation files:
   - Within same directory: `[Link text](other-file.md)`
   - To parent directory: `[Link text](../other-file.md)`
   - To child directory: `[Link text](subdirectory/file.md)`

2. **Section linking** using anchors:
   - Same file: `[Link text](#section-heading)`
   - Other file: `[Link text](file.md#section-heading)`

3. **Link formatting**:
   - Use descriptive link text: "See [Configuration Options](settings.md)" (good)
   - Avoid "click here" or URLs as link text: "For more information, [click here](file.md)" (bad)

#### External Links

1. **Full URLs** for external resources:
   - `[Official Obsidian Documentation](https://help.obsidian.md/)`

2. **Reference linking** for repeated URLs:
   ```markdown
   See the [Obsidian API documentation][obsidian-api] for details.

   [obsidian-api]: https://github.com/obsidianmd/obsidian-api
   ```

#### Link Maintenance

1. Check links during documentation reviews
2. Update cross-references when moving or renaming files
3. For removed content, either update links or create redirects

## 5. Image Guidelines

### 5.1. Image Organization and Sizing

- **Organization:** Store all images used in documentation within the `docs/images/` directory. This keeps images separate from other documentation files and makes them easier to manage.
- **Naming:** Use web-friendly and descriptive filenames for images. This helps with searchability and makes it clear what the image represents (e.g., `feature-x-workflow.png` instead of `image01.png`).
- **Sizing:**
  - **Banner Images:** If using a banner image (e.g., in the `README.md`), aim for a width between 1200 and 1600 pixels. This ensures good display quality on various screen sizes.
  - **Inline Images:** For images embedded within the main text of documentation, a width between 600 and 800 pixels is recommended. This provides sufficient detail without making the image too large.
- **Display Width:** When embedding images in Markdown files, you can adjust their display width using HTML or CSS if needed. However, try to adhere to the recommended sizes to maintain consistency.

### 5.2. Banner Creation

- **Concept:** The banner image for the Sonigraph plugin should visually represent the blend of structured data (the "barn") and the abstract nature of dreams (the "surreal landscape").
- **Composition:**
  - Use a horizontal fade effect to transition from the "gsa-barn.jpg" image on the left to the "gsa-strange-landscape.jpg" image on the right.
  - Employ a gradient mask to create a smooth and seamless transition between the two images.
  - Overlay subtle Lucide metric icons (e.g., `eye`, `smile`, `layers`, `feather`, `check-circle`) on the banner. Use white or soft colors and low opacity to ensure they don't distract from the main images.
- **File:** Save the completed banner image as `banner-fade.jpg` in the `docs/images/` directory.
- **Optional:** Consider using SVG code directly for the Lucide icons to ensure they scale well and maintain sharpness.

#### Example Banner:

<p align="center">
  <img src="images/banner-example.jpg" alt="Example banner showing the transition from structured data (barn) to dreams (surreal landscape)" width="1200"/>
</p>

## 6. Document Structure and Format

### 6.1. Table of Contents (TOC)

- **Requirement:** Every documentation file (including this one, `docs/developer/architecture/overview.md`, `ISSUES.md`, `docs/developer/testing/testing-overview.md`, `docs/developer/architecture/specification.md`, `docs/user/guides/usage.md`, `CHANGELOG.md`, and any new `.md` documents) must include a Table of Contents at its top.
- **Format:** The TOC should list all main headings (H1, H2, H3, etc.) present in the document.
- **Interactivity:** Each entry in the TOC must be a clickable link that navigates directly to its corresponding heading within the document.
- **Placement:** The TOC should be placed immediately after the document's main title (H1) and any introductory badges/images.

#### Example TOC:

```markdown
## Table of Contents

- [1. Introduction](#1-introduction)
- [2. Installation](#2-installation)
  - [2.1. Prerequisites](#21-prerequisites)
  - [2.2. Installation Steps](#22-installation-steps)
- [3. Configuration](#3-configuration)
  - [3.1. Basic Settings](#31-basic-settings)
  - [3.2. Advanced Options](#32-advanced-options)
```

### 6.2. Heading Structure

- **Hierarchy:** Use a consistent heading hierarchy throughout all documentation:
  - **H1 (#):** Document title - only one per document
  - **H2 (##):** Major sections
  - **H3 (###):** Subsections
  - **H4 (####):** Minor subsections
  - **H5 (#####):** Rarely needed, but available for deep nesting

- **Numbering:** Use numbered headings for technical documentation and implementation guides:
  - Example: `## 1. Introduction`, `### 1.1. Purpose`
  - This aids in cross-referencing and provides clear structure

- **Descriptiveness:** Ensure headings are descriptive and unique:
  - Clear: "Installing from Community Plugins"
  - Unclear: "Installation"

- **Consistency:** Maintain parallel structure in headings:
  - Good: "Creating Templates", "Managing Filters", "Exporting Data"
  - Avoid mixed formats: "Create Templates", "Filter Management", "How to Export"

- **Length:** Keep headings concise (under 60 characters) while still being descriptive

- **Capitalization:** Use Title Case for all headings
  - Capitalize all major words (nouns, pronouns, verbs, adjectives, adverbs)
  - Do not capitalize articles (a, an, the), coordinating conjunctions (and, but, or), or prepositions shorter than five letters unless they are the first or last word

## 7. Annotated Screenshots

### 7.1. Purpose

- Annotated screenshots are visual aids that enhance user understanding of the plugin's UI and workflows.
- They are particularly helpful for:
  - Users unfamiliar with Markdown or Obsidian's callouts.
  - Quickly communicating the relationship between different elements.
  - Guiding users in replicating specific structures or steps.

### 7.2. Key Sections to Annotate

When creating annotated screenshots, focus on highlighting these key sections of dream journal entries or plugin interfaces:

- **YAML frontmatter (metadata):** The beginning of a note, containing metadata like date, tags, etc.
- **[!journal-entry] callout:** The main container for a day's entry.
- **Dream entry section:** The narrative description of a dream, often nested under the `[!journal-entry]` callout.
- **[!dream-metrics] callout:** The section containing quantitative metrics for a dream.
- **Regular journal entry:** Any non-dream notes within a journal.
- **Block references (e.g., ^20250511):** Unique identifiers for specific blocks of content.

### 7.3. Steps for Creating Screenshots

1. **Prepare a Sample Note:** Create a representative sample note in Obsidian that includes all the relevant sections you want to annotate.
2. **Switch to Preview Mode:** Display the note or UI element in Obsidian's preview mode (or reading mode) to ensure a clean and accurate visual representation.
3. **Take a Screenshot:** Capture the desired area using your operating system's screenshot tool or a dedicated screenshot application.
4. **Annotate the Screenshot:** Use an image editor (e.g., Snagit, Greenshot, Skitch, or even a basic image editor) to add annotations.
   - Use boxes, arrows, or other visual elements to highlight specific sections.
   - Add concise labels to explain each highlighted section.
5. **Annotation Style:**
   - Use clear, contrasting colors for annotations to ensure they stand out against the screenshot.
   - Keep labels brief and easy to read.
   - Avoid cluttering the screenshot with excessive annotations.
   - Use a readable font size for all annotation text.
6. **Accessibility:**
   - Consider colorblind users when choosing annotation colors. Use a colorblind-friendly palette or provide alternative text descriptions.
7. **Optional Numbering and Legend:**
   - For complex screenshots, you can number the annotations and provide a legend below the image to explain each number.

### 7.4. Suggested Locations

- **`docs/USAGE.md`:** Include annotated screenshots in the "Adding Dream Metrics" section to illustrate the callout structure.
- **`docs/SAMPLES.md`:** If you create a separate document showcasing sample notes or UI elements, use annotated screenshots there.
- **Plugin README:** Add a simplified annotated screenshot to the `README.md` for a quick visual overview.

### 7.5. Annotated Screenshot Template

Below is an example of a properly annotated screenshot showing a dream journal entry:

<p align="center">
  <img src="images/annotated-screenshot-example.jpg" alt="Annotated screenshot showing the structure of a dream journal entry with YAML frontmatter, journal-entry callout, dream-diary callout, and dream-metrics" width="800"/>
</p>

#### How to Replicate This Style:

1. Use a colorblind-friendly highlight scheme:
   - YAML frontmatter: Blue (#3498db)
   - Journal entry callout: Green (#2ecc71)
   - Dream diary callout: Purple (#9b59b6)
   - Dream metrics callout: Orange (#e67e22)

2. Use a consistent annotation style:
   - Rounded rectangles for highlighting sections
   - Solid 2px borders
   - 50% transparent fill
   - Clear, sans-serif font for labels (Calibri, Arial, or similar)
   - 14-16pt font size for readability

3. Place labels:
   - Above or to the side of highlighted sections
   - Connected by thin (1px) lines if necessary
   - With consistent positioning (e.g., all labels on the left)

## 8. CSS Styling

The following CSS rules are intended for use in the plugin's `styles.css` file or within the `README.md` if necessary, to enhance the visual presentation of documentation:

### 8.1. Banner Fade Effect

```css
.banner-fade {
    width: 100%;
    height: 300px;
    background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0) 100%);
    position: relative;
}

.banner-fade img {
    width: 50%;
    height: 100%;
    object-fit: cover;
    position: absolute;
    top: 0;
}

.banner-fade .left {
    left: 0;
}

.banner-fade .right {
    right: 0;
}
```

#### Visual Example:

<p align="center">
  <img src="images/banner-fade-example.jpg" alt="Example of banner fade effect showing transition between two images" width="800"/>
</p>

### 8.2. Lucide Icon Overlay

```html
<svg width="32" height="32" style="position:absolute; top:40px; left:60px; opacity:0.3;">
    <use href="../images/icons/eye.svg#icon" />
</svg>
```

Note: This example uses a local reference to the icons rather than an external URL to ensure stability.

### 8.3. Custom Callout Background

```css
.callout[data-callout="dream-metrics"] {
    background-image: url('../images/gsa-barn.jpg');
    background-size: cover;
    background-blend-mode: lighten;
    color: #222;
}
```

#### Visual Example of Custom Callout:

<p align="center">
  <img src="images/custom-callout-example.jpg" alt="Example of a custom callout with dream-metrics styling" width="600"/>
</p>

## 9. Color Palette

Use the following color palettes, derived from the project's imagery, for headings, callouts, or accents in documentation and plugin UI:

### 9.1. From "gsa-barn"
- Sky blue: #a7c7e7
- Barn red: #b97a56
- Leaf green: #7bb661
- Soft yellow: #f7e7a0

### 9.2. From "gsa-strange-landscape"
- Dream blue: #5a7fa3
- Surreal green: #b6e3c6
- Deep red: #a33c3c
- Lavender: #b6a3e3

#### Color Palette Visual Reference:

<p align="center">
  <img src="images/color-palette-example.jpg" alt="Visual representation of the color palette derived from project imagery" width="600"/>
</p>

## 10. Modal and Leaf Design Standards

### 10.1. Standard Modal Layout

The following layout standards apply to all modals and leaves in the plugin, ensuring consistency with Obsidian's UI conventions:

1. **Overall Structure**
   - Dismissible note at the very top (if needed)
   - Sections ordered logically from top to bottom
   - Progress/status section at the very bottom

2. **Section Layout**
   - Two-column layout for each section:
     - Left column: Label and helper text (left-aligned)
     - Right column: Widget (right-aligned)
   - Label and widget appear on the same row
   - Helper text appears below the label (still in left column)

3. **Progress Section**
   - Left-aligned label (e.g., "Scrape Progress")
   - Progress bar and status text on their own row below the label
   - Centered within the modal

4. **Widgets**
   - Autocomplete fields: Right-aligned in their section
   - Buttons: Right-aligned in their section
   - Multi-select fields: Right-aligned with appropriate width

5. **Spacing**
   - Consistent vertical spacing between sections
   - No thick horizontal lines or unnecessary dividers
   - Modal height adapts to content

### 10.2. Implementation Notes

- Use CSS Grid or Flexbox for the two-column layout
- Ensure proper spacing using CSS variables
- Match Obsidian's Settings page conventions for consistency
- Support both light and dark themes
- Ensure accessibility with proper ARIA labels and keyboard navigation

#### Example Modal Layout:

<p align="center">
  <img src="images/modal-layout-example.jpg" alt="Example of the standard two-column modal layout with labels on the left and widgets on the right" width="700"/>
</p>

## 11. Accessibility Guidelines

### 11.1. Images and Visual Content

- **Alt Text**: All images must include descriptive alt text that conveys the content and purpose of the image
- **Contrast**: Ensure sufficient contrast between text and background (minimum 4.5:1 ratio)
- **Color Independence**: Never use color as the only means of conveying information
- **Image Size**: Ensure images can be enlarged for users with visual impairments

#### Example of Good Alt Text:
```markdown
![Dream Journal Manager interface showing three tabs: Dream Scraper, Journal Structure, and Templates, with the Dream Scraper tab active and displaying note selection options](images/dream-journal-manager.png)
```

### 11.2. Structure and Navigation

- **Heading Hierarchy**: Use proper heading levels (h1, h2, h3) in sequential order
- **Link Text**: Use descriptive link text rather than "click here" or URLs
- **Lists**: Use proper list formatting for sequential and non-sequential items
- **Tables**: Include header rows and provide sufficient context
- **Keyboard Navigation**: Ensure all interactive elements can be accessed via keyboard

### 11.3. Text and Readability

- **Plain Language**: Use clear, straightforward language (aim for a 9th-grade reading level)
- **Abbreviations**: Spell out abbreviations on first use
- **Font**: Use readable fonts (sans-serif fonts are generally more accessible)
- **Line Length**: Keep line lengths reasonable (60-80 characters per line)
- **Text Alternatives**: Provide text alternatives for any non-text content

## 12. Mobile Considerations

### 12.1. Responsive Design

- **Image Sizing**: Use relative sizing for images (percentage-based or max-width)
- **Tables**: Create responsive tables that can be viewed on smaller screens
  - Consider using a scrollable container for wide tables
  - Or reorganize data for vertical display on mobile
- **Code Blocks**: Ensure code blocks wrap or scroll horizontally on small screens
- **Touch Targets**: Buttons and links should be at least 44×44 pixels for easy tapping

### 12.2. Touch Interactions

- **Instructions**: Adapt instructions for touch interfaces where appropriate
  - Example: "Tap the Settings button" instead of "Click the Settings button"
- **Gestures**: Clearly explain any required touch gestures
- **Mobile-Specific Features**: Document any features that work differently on mobile

## 13. Documentation Review Process

### 13.1. Review Checklist

Before submitting documentation changes, ensure the following:

- [ ] Follows the voice and tone guidelines
- [ ] Adheres to the established formatting and structure
- [ ] Images include alt text and follow size guidelines
- [ ] Includes appropriate examples for complex concepts
- [ ] Links to related documentation where helpful
- [ ] Code examples are complete and properly formatted
- [ ] Spell-checked and grammar-checked
- [ ] Mobile-friendly
- [ ] Passes document validation checks (run `node docs/validate-docs.js`)

### 13.2. Workflow

1. **Create**: Draft new documentation following the style guide
2. **Validate**: Run document validation script (`node docs/validate-docs.js`) to check for compliance
3. **Review**: Self-review using the checklist above
4. **Submit**: Create a pull request with the documentation changes
5. **Peer Review**: Another team member reviews the changes
6. **Revise**: Make any necessary revisions based on feedback
7. **Merge**: Once approved, merge the changes
8. **Monitor**: Watch for user feedback on the documentation

For detailed information on document validation, see [Document Validation](../../developer/implementation/document-validation.md).

## 14. Version Control Guidelines

### 14.1. When to Update Documentation

Update documentation in the following scenarios:

- When adding a new feature
- When changing existing functionality
- When deprecating or removing features
- When fixing bugs that affect user workflow
- When improving clarity based on user feedback

### 14.2. Versioning Strategy

- **Changelog**: Keep documentation changes in the CHANGELOG.md file
- **Version Tagging**: Tag documentation versions to match plugin versions
- **Documentation Commits**: Use the prefix "docs:" for documentation-only commits
- **Breaking Changes**: Clearly mark breaking changes in both code and documentation

### 14.3. Date Usage Guidelines

- **Past Releases**: Include specific dates (YYYY-MM-DD format) for all past releases in the CHANGELOG.md
- **Current Features**: Use dates for documentation of existing features when relevant
- **Future Plans**: Avoid specific dates or months for unreleased/planned features:
  - Avoid phrases like "Coming in July 2025" or "Planned for Q3 2025"
  - Instead use relative language like "In a future release" or "Planned for implementation after [prerequisite feature]"
  - For implementation order, use "First Priority", "Second Priority" instead of specific timelines
- **Implementation Timelines**: In planning documents, use general phases rather than specific dates:
  - Use "Phase 1: Initial Implementation" instead of "July 2025: Initial Implementation"
  - Structure timelines as dependency relationships rather than calendar dates
  - Example: "Worker prototype development → CSS optimization → Multi-day selection → Performance testing"
- **Contemporaneous Updates and Drafts (Session-Specific Dates):**
    - This guideline applies when adding content that reflects an update as of a specific working session, such as drafting changelog entries, version notes, meeting summaries, or recording progress updates directly within documentation (whether by a human author or an AI assistant).
    - **Prioritize Provided Session Date:** Utilize the specific date explicitly provided or established for that working session (e.g., if an author or assistant is operating under the context of "Today is YYYY-MM-DD" for that session's work). This session-provided date is the authoritative source for these contemporaneous timestamps.
    - **Application:** Use this date for any documentation content generated or modified during the session that requires a timestamp to reflect its "as-of" status (e.g., "Progress as of YYYY-MM-DD," or dating a new entry in a list of updates).
    - **Date Formatting:** Unless otherwise specified by this style guide for a particular document type, format these dates as YYYY-MM-DD.
    - **Fallback for Missing Session Date:** If a timestamp for such an update is contextually necessary but no specific date has been provided or established for the working session:
        - Insert a clear placeholder (e.g., `[Date: YYYY-MM-DD]`, `[Confirm Date for this update]`, or `[Timestamp]`) and ensure the item is flagged for review to insert the correct date.
        - Avoid inventing dates or using ambiguous terms like "today," "now," or "current," which lose their meaning outside the specific context of the working session. The goal is an explicit date tied to the information.

## 15. Documentation Templates

### 15.1. Feature Documentation Template

```markdown
# Feature Name

## Overview
Brief description of what the feature does and its purpose.

## How to Access
Explain how to access or enable the feature.

## Configuration Options
List and explain all configuration options with examples.

## Usage Examples
Provide 2-3 practical examples of how to use the feature.

## Tips and Best Practices
Offer advice on getting the most out of the feature.

## Troubleshooting
Address common issues and how to resolve them.

## Related Features
Link to related features that users might also want to explore.
```

### 15.2. Tutorial Template

```markdown
# Tutorial: Accomplishing X with Sonigraph

## What You'll Learn
Brief description of what the user will accomplish.

## Prerequisites
What the user needs to know or have before starting.

## Step 1: [First Task]
Detailed instructions with screenshots.

## Step 2: [Second Task]
Detailed instructions with screenshots.

## Step 3: [Third Task]
Detailed instructions with screenshots.

## Next Steps
Suggestions for what to learn or try next.

## Troubleshooting
Common issues and solutions specific to this tutorial.
```

### 15.3. Technical Documentation Template

```markdown
# Feature Name

## Overview
Brief description of what the feature does and its purpose.

## How to Access
Explain how to access or enable the feature.

## Configuration Options
List and explain all configuration options with examples.

## Usage Examples
Provide 2-3 practical examples of how to use the feature.

## Tips and Best Practices
Offer advice on getting the most out of the feature.

## Troubleshooting
Address common issues and how to resolve them.

## Related Features
Link to related features that users might also want to explore.
```

### 15.4. Feature Plan Template

```markdown
# Feature Name

## Overview
Brief description of what the feature does and its purpose.

## How to Access
Explain how to access or enable the feature.

## Configuration Options
List and explain all configuration options with examples.

## Usage Examples
Provide 2-3 practical examples of how to use the feature.

## Tips and Best Practices
Offer advice on getting the most out of the feature.

## Troubleshooting
Address common issues and how to resolve them.

## Related Features
Link to related features that users might also want to explore.
```

## 16. Implementation Checklist

- [x] Create docs/images/ directory
- [x] Add gsa-barn.jpg and gsa-strange-landscape.jpg to docs/images/
- [ ] Create and add banner-fade.jpg to docs/images/
- [ ] Add banner to README.md
- [ ] Add "What is a Dream?" section with gsa-strange-landscape.jpg to README.md
- [ ] Add feature example section with barn image as background to README.md (optional)
- [ ] Implement CSS for custom callout backgrounds (optional)
- [ ] Overlay Lucide icons on banner (optional)
- [ ] Add first annotated screenshot of a complete dream journal entry to docs/USAGE.md
- [ ] Add additional annotated screenshots for advanced features (e.g., metrics table, modal UI)
- [ ] Create and add example images for CSS effects
- [ ] Add color palette visual reference 