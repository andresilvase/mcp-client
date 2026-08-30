# MCP Client CLI

A command-line interface for interacting with Claude AI through the Model Context Protocol (MCP). This client connects to MCP servers and enables Claude to use their tools seamlessly.

## Overview

This project integrates:
- **Anthropic Claude API** - Advanced language model for processing queries
- **Model Context Protocol (MCP)** - Framework for connecting to tool servers
- **Interactive CLI** - User-friendly command-line interface for conversations

The client establishes connections to MCP servers (Node.js or Python), discovers available tools, and orchestrates multi-turn conversations where Claude can request and execute tools as needed.

## Prerequisites

- **Node.js** - v18 or higher
- **npm** - v9 or higher
- **Anthropic API Key** - Available at [console.anthropic.com](https://console.anthropic.com)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd andresilvase-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your Anthropic API key:
```
ANTHROPIC_API_KEY=your_api_key_here
```

## Building

Compile TypeScript to JavaScript:
```bash
npm run build
```

This command:
- Compiles all `.ts` files using TypeScript compiler
- Outputs to the `build/` directory
- Makes the executable script executable with proper permissions

## Usage

Run the client by providing the path to an MCP server script:

```bash
npm start <path_to_server_script>
```

Or directly with Node:

```bash
node build/index.js <path_to_server_script>
```

### Example

```bash
# Connect to a local weather MCP server
node build/index.js ~/Desktop/weather-mcp/build/index.js
```

Once connected, you'll enter an interactive chat loop:

```
MCP Client Started!
Type your queries or 'quit' to exit.

Query: What's the current weather in New York?
[Calling tool weather_get with args {"city":"New York"}]
The current weather in New York is...

Query: quit
```

## How It Works

1. **Connection**: The client connects to an MCP server (JavaScript or Python script)
2. **Tool Discovery**: Lists all available tools from the server
3. **Query Processing**: Sends user queries to Claude
4. **Tool Execution**: When Claude requests tools, the client executes them via MCP
5. **Conversation Loop**: Continues the conversation until the user quits

## Supported Content Types

The client handles the following content types:
- **text** - Plain text responses
- **thinking** - Claude's reasoning process
- **tool_use** - Tool execution requests
- **tool_result** - Results from executed tools
- And various other specialized content types for different operations

## Architecture

### MCPClient Class

Main client implementation with the following key methods:

- `constructor()` - Initializes Anthropic and MCP clients
- `connectToServer(serverScriptPath: string)` - Establishes connection to MCP server
- `processQuery(query: string)` - Processes user queries with tool execution
- `executeToolUse()` - Executes tools requested by Claude
- `chatLoop()` - Interactive REPL for user queries
- `cleanup()` - Closes connections

## Environment Configuration

The client uses environment variables for configuration:

- `ANTHROPIC_API_KEY` - **Required**. Your Anthropic API key
- Additional variables can be added in `.env` file

## Project Structure

```
.
├── index.ts          # Main client implementation
├── package.json      # Project dependencies and scripts
├── tsconfig.json     # TypeScript configuration
├── build/            # Compiled JavaScript output
│   └── index.js      # Compiled client
└── README.md         # This file
```

## Requirements for MCP Servers

MCP servers should be:
- Executable files (`.js` or `.py`)
- Capable of stdio communication
- Running with the MCP protocol specification
- Exposing tools via the `listTools()` interface

## Error Handling

The client provides error handling for:
- Missing or invalid Anthropic API key
- Invalid server script paths
- MCP connection failures
- Tool execution errors

## Development

To modify the client:

1. Edit `index.ts`
2. Run `npm run build` to compile
3. Test with your MCP server

## License

ISC

## Contributing

Contributions are welcome! Please ensure all changes:
- Follow TypeScript best practices
- Are properly tested
- Maintain compatibility with MCP specification
- Include appropriate error handling

## Support

For issues or questions:
1. Check the MCP protocol documentation
2. Verify your MCP server implementation
3. Ensure your Anthropic API key is valid
4. Check that Node.js and dependencies are properly installed
