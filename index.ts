import { Anthropic } from "@anthropic-ai/sdk";
import {
    MessageParam,
    Tool,
} from "@anthropic-ai/sdk/resources/messages/messages.mjs";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import readline from "readline/promises";
import dotenv from "dotenv";

dotenv.config();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
}

enum ContentType {
    TEXT = "text",
    THINKING = "thinking",
    REDACTED_THINKING = "redacted_thinking",
    TOOL_USE = "tool_use",
    SERVER_TOOL_USE = "server_tool_use",
    WEB_SEARCH_TOOL_RESULT = "web_search_tool_result",
    WEB_FETCH_TOOL_RESULT = "web_fetch_tool_result",
    CODE_EXECUTION_TOOL_RESULT = "code_execution_tool_result",
    BASH_CODE_EXECUTION_TOOL_RESULT = "bash_code_execution_tool_result",
    TEXT_EDITOR_CODE_EXECUTION_TOOL_RESULT = "text_editor_code_execution_tool_result",
    TOOL_SEARCH_TOOL_RESULT = "tool_search_tool_result",
    CONTAINER_UPLOAD = "container_upload",
}

class MCPClient {
    private mcp: Client;
    private anthropic: Anthropic;
    private transport: StdioClientTransport | null = null;
    private tools: Tool[] = [];
    private messages: MessageParam[] = [];

    constructor() {
        this.anthropic = new Anthropic({
            apiKey: ANTHROPIC_API_KEY,
        });
        this.mcp = new Client({ name: "mcp-client-cli", version: "1.0.0" });
    }

    async connectToServer(serverScriptPath: string) {
        try {
            const isJs = serverScriptPath.endsWith(".js");
            const isPy = serverScriptPath.endsWith(".py");

            if (!isJs && !isPy) {
                throw new Error("Server script must be a .js or .py file");
            }

            const command = isPy
                ? process.platform === "win32"
                    ? "python"
                    : "python3"
                : process.execPath;

            this.transport = new StdioClientTransport({
                command,
                args: [serverScriptPath],
            });

            await this.mcp.connect(this.transport);

            const availableTools = await this.mcp.listTools();

            this.tools = availableTools.tools.map((tool) => {
                return {
                    name: tool.name,
                    description: tool.description,
                    input_schema: tool.inputSchema,
                };
            });

            console.log(
                "Connected to server with tools:",
                this.tools.map(({ name }) => name)
            );

        } catch (e) {
            console.log("Failed to connect to MCP server: ", e);
            throw e;
        }
    }

    async processQuery(query: string) {

        this.messages.push({
            role: "user",
            content: query,
        });

        var response = await this.anthropic.messages.create({
            model: "claude-opus-5",
            max_tokens: 1000,
            messages: this.messages,
            tools: this.tools,
        });

        const outputText = [];
        const tool_result: Anthropic.ContentBlockParam[] = [];

        for (const content of response.content) {
            if (content.type === ContentType.TEXT) {
                outputText.push(content.text);
            } else if (content.type === ContentType.TOOL_USE) {
                const toolName = content.name;
                const toolArgs = content.input as { [x: string]: unknown } | undefined;

                const result = await this.mcp.callTool({
                    name: toolName,
                    arguments: toolArgs,
                });

                outputText.push(
                    `[Calling tool ${toolName} with args ${JSON.stringify(toolArgs)}]`
                );

                tool_result.push({
                    type: "tool_result",
                    tool_use_id: content.id,
                    content: "\n".concat(
                        result.content
                            .filter((block) => block.type === ContentType.TEXT)
                            .map((block) => block.text)
                            .join("\n")
                    ),
                });
            }
        }

        if (tool_result.length > 0) {
            this.messages.push({
                role: "assistant",
                content: response.content
            })

            this.messages.push({
                role: "user",
                content: tool_result
            });

            response = await this.anthropic.messages.create({
                model: "claude-opus-5",
                max_tokens: 1000,
                messages: this.messages,
                tools: this.tools,
            });

            for (const content of response.content) {
                if (content.type === ContentType.TEXT) {
                    outputText.push(content.text);
                }
            }
        }

        return outputText.join("\n");
    }

    async chatLoop() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        try {
            console.log("\nMCP Client Started!");
            console.log("Type your queries or 'quit' to exit.");

            while (true) {
                const message = await rl.question("\nQuery: ");
                if (message.toLowerCase() === "quit") {
                    break;
                }
                const response = await this.processQuery(message);
                console.log("\n" + response);
            }
        } finally {
            rl.close();
        }
    }

    async cleanup() {
        await this.mcp.close();
    }
}

async function main() {
    if (process.argv.length < 3) {
        console.log("Usage: node index.ts <path_to_server_script>");
        return;
    }
    const mcpClient = new MCPClient();
    try {
        await mcpClient.connectToServer(process.argv[2]);
        await mcpClient.chatLoop();
    } catch (e) {
        console.error("Error:", e);
        await mcpClient.cleanup();
        process.exit(1);
    } finally {
        await mcpClient.cleanup();
        process.exit(0);
    }
}

main();