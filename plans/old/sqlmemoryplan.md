Prerequisites

Since you are now using SQLite, you will need to add the better-sqlite3 driver to your extension's environment:
npm install better-sqlite3
1. The Database Setup (db.ts)

First, create a shared file to initialize the connection. This ensures both your write and read operations point to the same file.
TypeScript

// extensions/sessions/db.ts
import Database from 'better-sqlite3';
import path from 'node:path';
import os from 'node:os';

// Path: inside your .pi directory
const dbPath = path.join(process.cwd(), '.pi', 'session_summaries.db');
const db = new Database(dbPath);

// Initialize Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    cwd TEXT,
    content TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export default db;

2. compactiontosql.ts (The Writer)

This will be called when your session ends to save the distilled "Compaction" into the SQL database.
TypeScript

// extensions/sessions/compactiontosql.ts
import db from './db.js';

export function saveCompaction(sessionId: string, cwd: string, summary: string) {
  const insert = db.prepare(`
    INSERT INTO summaries (session_id, cwd, content) 
    VALUES (@sessionId, @cwd, @summary)
  `);
  
  try {
    insert.run({ sessionId, cwd, summary });
    return true;
  } catch (err) {
    console.error("Failed to save compaction to SQL:", err);
    return false;
  }
}

3. readcompactiontosql.ts (The Reader)

This will be called at the start of a session or when your agent needs to retrieve "Long-Term Memory."
TypeScript

// extensions/sessions/readcompactiontosql.ts
import db from './db.js';

export function getRelevantSummaries(cwd: string, limit = 5) {
  const query = db.prepare(`
    SELECT content, timestamp 
    FROM summaries 
    WHERE cwd = ? 
    ORDER BY timestamp DESC 
    LIMIT ?
  `);
  
  return query.all(cwd, limit) as { content: string; timestamp: string }[];
}

4. Integration Strategy

Now, wire these into your lifecycle events in session-memory.ts (or your main extension entry).

On Session End (Write):
TypeScript

pi.on("session_end", async (_event, ctx) => {
    // 1. Generate summary using LLM (as discussed in previous step)
    const summary = await generateSummary(ctx); 
    
    // 2. Save to SQL
    const cwd = process.cwd();
    const sessionId = getSessionId(ctx);
    saveCompaction(sessionId, cwd, summary);
});

Before Agent Start (Read):
TypeScript

pi.on("before_agent_start", async (event, ctx) => {
    const cwd = process.cwd();
    const history = getRelevantSummaries(cwd);
    
    if (history.length > 0) {
        const historyBlock = history
            .map(h => `[${h.timestamp}] Summary: ${h.content}`)
            .join("\n\n");
            
        event.systemPrompt += `\n\n## Long-Term Memory (Past Sessions):\n${historyBlock}`;
    }
});

Why this is better for you:

    Context Loading: Instead of reading through 50 raw JSONL files, your agent now reads 5 dense summaries from the SQL table. This is significantly faster and preserves your token budget.

    Organization: You can now query specific time ranges or sessions if you ever want to build a /memory history command in the future.

    Performance: better-sqlite3 is synchronous, which is perfect for CLI coding agents—you won't have to deal with complex async/await chains for database reads during the agent's "thinking" phase.

One final recommendation: When you save the summary to SQL, include a few keywords or tags if your LLM is smart enough to generate them. It will make your readcompactiontosql queries even more powerful later on.