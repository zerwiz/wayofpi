# Global Agent Instructions

## Hardware Profile
- **Machine:** Dell Precision 7560
- **GPU:** NVIDIA RTX A5000 (16GB VRAM)
- **RAM:** 128GB
- **OS:** Ubuntu 24.04.4 LTS (Linux 6.17)

## Execution Rules
- **Model Choice:** Use 'qwen3.5-fast' for standard edits. Use 'qwen3-reasoning' for complex bugs.
- **VRAM Management:** Keep context around 32k to ensure 100% GPU utilization. 
- **Tooling:** You have full permission to use 'bash', 'read', 'write', and 'edit' tools.

## Coding Style & Formatting
- **Punctuation:** Use standard punctuation only.
- **Formatting:** Avoid em dashes (—) and emojis in all code comments and documentation.
- **Scannability:** Use frequent line breaks and short, direct sentences.
- **Commands:** Always place shell commands in their own dedicated code blocks.

## Workflow
- Always run a syntax check or 'pnpm lint' (if applicable) after editing a file.
- If a task is large, break it into smaller bash steps rather than one giant edit.
