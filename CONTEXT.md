# Project Glossary

Quick reference for terminology, patterns, and concepts used in this framework.

## Architecture Patterns

**POM (Page Object Model)**
Design pattern that creates object repository for UI elements. Pages are represented as classes, elements as properties.

**Container-Based Architecture**
Pattern where pages are composed of Header, Main, Footer containers. Each container manages its own UI section independently.

**Fixtures Pattern**
Playwright's dependency injection system. Provides page objects, services, and utilities to tests via merged fixtures.

## Core Concepts

**BaseControl**
Foundation class for all UI elements. Provides common operations: visibility, text, attributes, waiting.

**Clickable**
Base class for elements that can be clicked. Extends `BaseControl`. Used for: Button, Link, Image.

**Editable**
Base class for input elements. Extends `BaseControl`. Used for: Input, Textarea, DatePicker.

**Composition over Inheritance**
Design principle: combine behaviors through composition (has-a) rather than inheritance (is-a). Example: DatePicker has CalendarNavigation.

**Helper Classes**
Utility classes with static methods. Examples: `DateTimeHelper`, `DataGenerator`, `StringHelper`, `FileHelper`.

## Coding Principles

**YAGNI (You Aren't Gonna Need It)**
Don't add functionality until it's actually needed. See ADR-004 for details.

**KISS (Keep It Simple, Stupid)**
Keep code simple and straightforward. Avoid unnecessary complexity. See ADR-004 for details.

**DRY (Don't Repeat Yourself)**
Avoid code duplication. Extract repeated logic into reusable components. See ADR-004 for details.

**Reference:** `docs/decisions/ADR-004-yagni-kiss-dry-principles.md`

## Coding Principles

**YAGNI (You Aren't Gonna Need It)**
Don't add functionality until it's actually needed. Write only the code required for current requirements.

Example:
- ❌ Add "future-proof" pagination when only displaying 10 items
- ✅ Add pagination when requirement actually needs it

**KISS (Keep It Simple, Stupid)**
Prefer simple solutions over complex ones. Avoid over-engineering.

Example:
- ❌ Create abstract factory pattern for one button
- ✅ Use simple Button class directly

**DRY (Don't Repeat Yourself)**
Avoid code duplication. Extract repeated logic into reusable functions/classes.

Example:
- ❌ Copy-paste same validation in 5 places
- ✅ Create `validateEmail()` helper, use it everywhere

## File Organization

**Container**
Component representing a section of a page (Header, Main, Footer). Located in `src/components/containers/[page-name]/`.

**Page Object**
Class representing a complete page. Composes containers. Located in `src/pages/[page-name]/`.

**Element**
Reusable UI component class (Button, Input, Table). Located in `src/elements/common/`.

**Service**
API client class. Extends `BaseService`. Located in `src/services/`.

**Fixture**
Test dependency providing page objects or services. Registered in `src/fixtures/`.

## Path Aliases

**@pages**
Maps to `src/pages/*` - Page object classes

**@elements**
Maps to `src/elements/*` - UI element classes

**@components**
Maps to `src/components/*` - Container and composite components

**@services**
Maps to `src/services/*` - API service classes

**@fixtures**
Maps to `src/fixtures/*` - Test fixtures (ALWAYS import test/expect from here)

**@helpers**
Maps to `src/helpers/*` - Utility helper classes

**@constants**
Maps to `src/constants/*` - Configuration and constants

**@models**
Maps to `src/models/*` - TypeScript interfaces and types

**@common**
Maps to `src/common/*` - Shared utilities and browser management
