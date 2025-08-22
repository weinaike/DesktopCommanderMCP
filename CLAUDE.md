# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development and Building
- `npm run build` - Compile TypeScript and copy necessary files to dist/
- `npm run setup` - Install dependencies, build, and configure Claude Desktop
- `npm run setup:debug` - Install with debugging enabled (Node.js inspector on port 9229)
- `npm run start` - Run the built server
- `npm run start:debug` - Run with debug mode enabled
- `npm run test` - Run all tests
- `npm run test:debug` - Run tests with debug mode
- `npm run watch` - Watch mode for TypeScript compilation
- `npm run clean` - Remove dist/ directory

### Version Management
- `npm run sync-version` - Sync version across files
- `npm run bump` - Bump patch version
- `npm run bump:minor` - Bump minor version
- `npm run bump:major` - Bump major version

### Fuzzy Search Log Analysis
- `npm run logs:view -- --count 20` - View recent fuzzy search logs
- `npm run logs:analyze -- --threshold 0.8` - Analyze patterns and performance
- `npm run logs:export -- --format json --output analysis.json` - Export logs to CSV/JSON
- `npm run logs:clear` - Clear all logs with confirmation

### MCP Inspector
- `npm run inspector` - Run MCP inspector for testing

## Architecture Overview

Desktop Commander is an MCP (Model Context Protocol) server that provides Claude Desktop with file system access, terminal command execution, and process management capabilities. The architecture is organized into several key components:

### Core Architecture
- **Entry Point**: `src/index.ts` - Main server entry that handles setup/remove commands and starts the MCP server
- **Server Core**: `src/server.ts` - MCP server implementation with tool definitions and request routing
- **Command Management**: `src/command-manager.ts` - Terminal session and process management
- **Configuration**: `src/config-manager.ts` and `src/config.ts` - Server configuration and settings management

### Tool Organization
Tools are categorized into several functional areas:

1. **Configuration Tools** (`src/tools/config.ts`)
   - `get_config` - Retrieve complete server configuration
   - `set_config_value` - Update specific configuration settings

2. **Filesystem Tools** (`src/tools/filesystem.ts`)
   - `read_file` - Read files with offset/length support and URL fetching
   - `write_file` - Write files with chunking recommendations
   - `list_directory` - Directory listing
   - `create_directory` - Directory creation
   - `move_file` - File/directory moving and renaming
   - `search_files` - File name search
   - `search_code` - Code/content search using ripgrep
   - `get_file_info` - File metadata retrieval

3. **Text Editing Tools** (`src/tools/edit.ts`)
   - `edit_block` - Surgical text replacement with fuzzy search fallback

4. **Process Tools** (`src/tools/process.ts`, `src/tools/improved-process-tools.ts`)
   - `start_process` - Start terminal processes with intelligent REPL detection
   - `interact_with_process` - Send commands to running processes
   - `read_process_output` - Read output from processes
   - `force_terminate` - Terminate terminal sessions
   - `list_sessions` - List active terminal sessions
   - `list_processes` - List system processes
   - `kill_process` - Kill processes by PID

### Handlers System
The `src/handlers/` directory contains the implementation logic for each tool category:
- `filesystem-handlers.ts` - Filesystem operations
- `process-handlers.ts` - Process and terminal management
- `terminal-handlers.ts` - Terminal-specific operations
- `edit-search-handlers.ts` - Text editing and search functionality

### Utilities
- `src/utils/` - Utility functions for system info, fuzzy search, logging, process detection, etc.
- `src/types.ts` - TypeScript type definitions
- `src/version.ts` - Version management
- `src/custom-stdio.ts` - Custom stdio transport for handling non-JSON messages

### Key Design Principles

1. **Chunked File Operations**: Large files should be processed in chunks (25-30 lines) to avoid performance issues and prevent data loss during message limits.

2. **Process-Based File Analysis**: For ANY local file analysis (CSV, JSON, data processing), always use `start_process` + `interact_with_process` instead of analysis tools, as analysis tools cannot access local files.

3. **Surgical Text Editing**: Use `edit_block` for targeted changes with minimal context. Make multiple small edits rather than one large change.

4. **Configuration Management**: Use dedicated chat for configuration changes. The `allowedDirectories` setting only restricts filesystem operations, not terminal commands.

5. **Comprehensive Logging**: All tool calls are logged for debugging and security monitoring. Fuzzy search operations have detailed analysis tools.

### Configuration System
The server uses a JSON-based configuration system stored in `config.json` with settings for:
- `blockedCommands` - Array of restricted shell commands
- `defaultShell` - Default shell for command execution
- `allowedDirectories` - Paths accessible for file operations
- `fileReadLineLimit` - Maximum lines for read operations (default: 1000)
- `fileWriteLineLimit` - Maximum lines per write operation (default: 50)
- `telemetryEnabled` - External telemetry opt-in/out

### Testing
- Test files are in the `test/` directory
- Run all tests with `npm run test`
- Test runner is `test/run-all-tests.js`
- Various test scenarios including file operations, process management, and edge cases

### Docker Support
The project supports Docker deployment with:
- Automated install scripts for macOS/Linux and Windows
- Persistent storage volumes for development environment
- Isolated execution environment
- Management commands for status checking and data reset

This architecture provides a comprehensive system for Claude Desktop to interact with the local file system, execute terminal commands, and manage processes while maintaining security and performance.