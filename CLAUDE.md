# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run lint` - Run ESLint for code linting
- `npm run preview` - Preview production build locally

## Code Style Guidelines
- **Imports**: Group imports (React, libraries, local components, styles); sort alphabetically within groups
- **Types**: Use TypeScript interfaces for props and state; include proper React.FC<Props> typing for components
- **Components**: React functional components with explicit prop interfaces; avoid default exports
- **Naming**: PascalCase for components/types; camelCase for functions/variables; UPPER_CASE for constants
- **Functions**: Use useCallback for functions in React components; include proper typing for parameters/returns
- **Error Handling**: Use try/catch blocks; log errors to console; return false/null from failed operations
- **State Management**: Use React Context API and localStorage for data persistence
- **Formatting**: 2-space indentation; semicolons required; single quotes for strings
- **Component Structure**: Props destructuring with defaults at top; then hooks; then event handlers; then render

## Project Architecture
- Components are organized by feature (tasks, projects, categories, etc.)
- Common/reusable UI components in components/common
- Context API for global state management
- Types defined in types/index.ts
- Utils folder for helper functions