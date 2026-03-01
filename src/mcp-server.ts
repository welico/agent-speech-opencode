#!/usr/bin/env node
import { createMCPServer } from './infrastructure/mcp-server.js';

const server = await createMCPServer();
await server.start();
