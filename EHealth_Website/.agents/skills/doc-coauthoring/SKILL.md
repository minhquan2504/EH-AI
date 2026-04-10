---
name: doc-coauthoring
description: Guide users through a structured workflow for co-authoring documentation. Use when user wants to write documentation, proposals, technical specs, decision docs, or similar structured content. This workflow helps users efficiently transfer context, refine content through iteration, and verify the doc works for readers.
---

# Doc Co-Authoring Workflow

## When to Offer This Workflow
Trigger when user mentions:
- Writing docs, creating proposals, drafting specs
- Technical documentation, decision documents
- Architecture docs, design docs, RFCs
- README files, API documentation

## Stage 1: Context Gathering

### Initial Questions
Start by understanding the document's purpose:
1. **What type of document?** (proposal, spec, guide, readme, etc.)
2. **Who is the audience?** (developers, stakeholders, end users)
3. **What's the key message or decision?**
4. **Are there existing docs to reference?**
5. **What format/style is expected?**

### Info Dumping
Encourage the user to share all relevant context:
- Related code files (use `view_file` to read them)
- Existing documentation
- Team conventions or templates
- Links to related resources

## Stage 2: Refinement & Structure

### Step 1: Clarifying Questions
Ask targeted questions about unclear areas. Focus on:
- Technical accuracy
- Scope boundaries
- Missing context

### Step 2: Brainstorming
Generate structure options:
- Propose 2-3 outline variations
- Highlight tradeoffs between approaches
- Let the user choose or combine

### Step 3: Curation
Based on user feedback, refine the outline:
- Lock in the structure
- Identify sections that need most attention
- Note any content gaps

### Step 4: Gap Check
Before drafting, verify:
- All necessary context is gathered
- No ambiguities remain
- Technical details are confirmed

### Step 5: Drafting
Write the full document:
- Follow the approved structure
- Use appropriate tone for the audience
- Include code examples where relevant
- Add diagrams (mermaid) where helpful

### Step 6: Iterative Refinement
After first draft:
- Ask for specific feedback on each section
- Make targeted improvements
- Don't rewrite everything — surgical edits only

### Quality Checking
- Verify technical accuracy
- Check for consistency in terminology
- Ensure proper formatting
- Validate code examples work

### Near Completion
When the doc feels close:
- Do a final read-through for flow
- Check all links and references
- Verify formatting renders correctly

## Stage 3: Reader Testing

### Testing Approach
1. **Predict Reader Questions**: What would a first-time reader ask?
2. **Identify Gaps**: What assumptions are we making?
3. **Check Completeness**: Can someone follow this without prior context?
4. **Verify Examples**: Do code examples actually work?

### Iteration
- Address identified gaps
- Clarify confusing sections
- Add missing context
- Simplify where possible

## Final Review

Before delivering:
- [ ] Document serves its stated purpose
- [ ] Audience-appropriate language and detail level
- [ ] All code examples are correct and tested
- [ ] Formatting is clean and consistent
- [ ] Links and references are valid
- [ ] No orphaned TODOs or placeholders

## Tips for Effective Guidance
- **Be specific**: "This section needs X" beats "improve this"
- **Show, don't tell**: Provide examples of what you want
- **Iterate in small batches**: Don't try to fix everything at once
- **Trust the process**: Good docs take multiple passes
