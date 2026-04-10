---
name: webapp-testing
description: Toolkit for interacting with and testing local web applications using the browser. Supports verifying frontend functionality, debugging UI behavior, capturing screenshots, and validating user flows. Use when the user wants to test, debug, or verify a web application.
---

# Web Application Testing

To test local web applications, use Antigravity's `browser_subagent` tool for interactive browser testing and `run_command` for running automated test suites.

## Decision Tree: Choosing Your Approach

```
User task → Is it static HTML?
    ├─ Yes → Open file directly in browser via browser_subagent
    │         ├─ Navigate, click, verify elements
    │         └─ Capture screenshots for validation
    │
    └─ No (dynamic webapp) → Is the server already running?
        ├─ No → Start dev server with run_command first
        │        Then use browser_subagent to test
        │
        └─ Yes → Reconnaissance-then-action:
            1. Navigate to the URL
            2. Take screenshot or inspect DOM
            3. Identify interactive elements
            4. Execute actions and verify results
```

## Testing with browser_subagent

The `browser_subagent` tool is the primary way to test web applications. It provides:
- Full browser interaction (clicking, typing, navigating)
- DOM inspection and element discovery
- Screenshot capture for visual validation
- Console log monitoring

### Example: Testing a Login Flow

```
Task for browser_subagent:
1. Navigate to http://localhost:3000/login
2. Find the email input field and type "test@example.com"
3. Find the password input field and type "password123"
4. Click the "Login" button
5. Wait for navigation to complete
6. Verify the dashboard page is displayed
7. Take a screenshot and return the result
```

### Example: Testing Responsive Design

```
Task for browser_subagent:
1. Navigate to http://localhost:3000
2. Resize browser to 375x667 (iPhone SE)
3. Take a screenshot
4. Verify the hamburger menu is visible
5. Click the hamburger menu
6. Verify navigation links appear
7. Resize to 1920x1080 (desktop)
8. Take a screenshot
9. Verify sidebar navigation is visible
```

## Running Automated Tests

Use `run_command` to execute test suites:

```bash
# Jest/Vitest
npm test

# Playwright (if configured in project)
npx playwright test

# Cypress
npx cypress run
```

## Reconnaissance-Then-Action Pattern

1. **Navigate and inspect**: Open the page, wait for it to load
2. **Take screenshot**: Capture the current state for analysis
3. **Identify selectors**: Find buttons, inputs, links by text, role, or CSS selectors
4. **Execute actions**: Click, type, scroll, navigate
5. **Verify results**: Check for expected changes, take screenshots

## Common Pitfalls

❌ **Don't** try to interact with elements before the page is fully loaded
✅ **Do** wait for the page to finish loading before interacting

❌ **Don't** assume element selectors without inspecting the DOM first
✅ **Do** discover selectors from the rendered page state

❌ **Don't** forget to start the dev server before testing
✅ **Do** ensure the server is running and check its health before browser testing

## Best Practices

- **Start the dev server first**: Use `run_command` with `npm run dev` and wait for it to be ready
- **Use descriptive task descriptions**: Give the browser_subagent clear, step-by-step instructions
- **Capture screenshots**: Always capture screenshots at key checkpoints for visual verification
- **Test critical user flows**: Login, signup, navigation, form submission, data display
- **Test edge cases**: Empty states, error states, loading states, long content
- **Test responsive design**: Check layouts at mobile, tablet, and desktop breakpoints
- **Record test sessions**: Use the RecordingName parameter in browser_subagent for sharable video recordings
