# Test Cases

This folder contains manual test cases in Markdown format.

## Purpose

**Read these before writing automated test specs** to understand:
- Business requirements
- User scenarios
- Expected behaviors
- Edge cases
- Acceptance criteria

## Structure

Each test case should include:
- **Test Case ID**: Unique identifier
- **Title**: Clear, descriptive name
- **Preconditions**: Setup requirements
- **Steps**: Step-by-step actions
- **Expected Results**: What should happen
- **Actual Results**: What actually happened (during manual testing)
- **Status**: Pass/Fail/Blocked

## Example

```markdown
# TC-001: User Login with Valid Credentials

## Preconditions
- User account exists in the system
- User is on the login page

## Steps
1. Enter valid email address
2. Enter valid password
3. Click "Log in" button

## Expected Results
- User is redirected to dashboard
- Success message is displayed
- User session is created

## Status
✅ Pass
```

## Guidelines

- Write test cases in business language, not technical implementation
- Include positive and negative scenarios
- Document edge cases and boundary conditions
- Keep test cases atomic and focused
- Reference test case IDs in automated test specs

## Current Test Cases

- [`sign-in.md`](./sign-in.md) — Sign-In flow (UI + API), feature `Authentication`
