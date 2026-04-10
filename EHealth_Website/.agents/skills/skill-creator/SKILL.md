---
name: skill-creator
description: Create new skills, modify and improve existing skills. Use when users want to create a skill from scratch, edit or optimize an existing skill, or understand how to structure skills for Antigravity.
---

# Skill Creator

This skill helps create, modify, and improve skills for Antigravity.

## Communicating with the User
Before creating a skill, have a conversation to understand:
- What task should the skill help with?
- What's the expected input/output?
- Are there existing patterns or workflows to follow?
- What tools does the skill rely on?

## Creating a Skill

### Step 1: Capture Intent
Understand what the user wants to automate or improve. Ask clarifying questions:
- "What specific tasks will this skill handle?"
- "Can you walk me through how you do this manually?"
- "What makes a good vs bad result?"

### Step 2: Interview and Research
If the skill involves existing code or workflows:
- Read relevant source files with `view_file`
- Search for patterns with `grep_search`
- Understand the project structure with `list_dir`

### Step 3: Write the SKILL.md

#### Structure
```markdown
---
name: my-skill-name
description: A clear description of what this skill does and when to use it.
---

# Skill Title

Instructions that the AI will follow when this skill is active.

## When to Use
- Trigger condition 1
- Trigger condition 2

## How to Use
Step-by-step instructions...

## Examples
- Example usage 1
- Example usage 2

## Guidelines
- Guideline 1
- Guideline 2
```

#### Skill Writing Guide

**Frontmatter (Required):**
- `name`: Lowercase, hyphens for spaces (e.g., `my-skill-name`)
- `description`: Complete description of what the skill does AND when to trigger it. This is critical — it determines when the skill is activated.

**Content Guidelines:**
- Write clear, actionable instructions
- Include specific examples
- Reference Antigravity's available tools:
  - `run_command` — Execute shell commands
  - `browser_subagent` — Browser interaction and testing
  - `generate_image` — Create images
  - `view_file`, `write_to_file`, `replace_file_content` — File operations
  - `grep_search`, `find_by_name` — Code search
  - `read_url_content` — Fetch web content
- Avoid vague language — be specific about what to do
- Include edge cases and error handling

### Step 4: Place the Skill
Save the skill to the project's skill directory:
```
.agents/skills/<skill-name>/SKILL.md
```

Optionally include additional directories:
```
.agents/skills/<skill-name>/
├── SKILL.md          # Main instructions (required)
├── scripts/          # Helper scripts
├── examples/         # Reference implementations
└── resources/        # Additional files, templates
```

## Improving a Skill

### How to Think About Improvements
1. **Read the current SKILL.md**: Understand what it does now
2. **Identify gaps**: What's missing? What's confusing?
3. **Test mentally**: Walk through a scenario — would the instructions produce good results?
4. **Iterate**: Make targeted changes, don't rewrite everything

### The Iteration Loop
1. Review current skill content
2. Identify specific improvement area
3. Make the change
4. Verify the improvement makes sense in context
5. Repeat if needed

## Description Optimization

The `description` field in frontmatter is crucial — it determines when the skill triggers.

**Good description traits:**
- States what the skill does clearly
- Lists specific trigger scenarios
- Uses keywords the user might mention
- Not too broad (triggers on everything) or too narrow (never triggers)

**Example:**
```yaml
# Too broad:
description: Helps with coding tasks

# Too narrow:
description: Creates React components with Tailwind CSS using the App Router pattern

# Just right:
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, or applications.
```

## Best Practices
- Keep instructions concise but complete
- Structure with clear headers and sections
- Include both "what to do" and "what NOT to do"
- Reference available tools by name
- Test the skill by running through scenarios mentally
- Update the description if the skill's scope changes
