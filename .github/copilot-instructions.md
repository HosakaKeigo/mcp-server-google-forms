# Project Overview
A Google Forms MCP Server written in TypeScript.

## Structure
### /src/index.ts
The entry point. Handles tool registration and server startup.

### /src/tools
Tool definitions. Defined on a class basis. Check existing implementations when implementing.

### /src/utils/api.ts
Implementation of the `GFormService` service class for interacting with the Google Forms API. All form operation implementations are consolidated in this file.

## Implementation Notes
### Google Forms API
Uses the `@googleapis/forms` node.js client library.
The schema is defined in `/node_modules/@googleapis/forms/build/v1.d.ts`. (If anything is unclear, ask the user.)

### Tool Definition
- Tools should be defined on a class basis. `parameters` are validated using Zod.
- Don't forget to register the tool in src/tools/index.ts.

### Guidelines for Extending Functionality
1. When adding new features:
   - Create an appropriate tool class in `src/tools/`.
   - Add the necessary service methods to the `GFormService` class.
   - Register the tool in `src/tools/index.ts`.

2. When responding to API changes:
   - First, check the latest schema in `/node_modules/@googleapis/forms/build/v1.d.ts`.
   - Update tool parameters and service methods according to the changes.
