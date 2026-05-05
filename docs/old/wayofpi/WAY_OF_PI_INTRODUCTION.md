# Way of Pi — The Simple Guide

> Way of Pi turns a "command-line" robot into a "point-and-click" superpower for anyone building software.

This page is a **short, plain-language** intro. For install commands, ports, and the full doc list, start at the repo **[README.md](../README.md)** and **[docs/README.md](./README.md)**.

---

## What is Way of Pi?

Imagine you have a super-smart robot named **Pi** that is amazing at writing computer code. Usually, to talk to this robot, you have to type commands into a boring black box with green text (the "Terminal").

**Way of Pi is like giving that robot a control center** with buttons, windows, and a file browser so it is easier to work with.

---

## The two main parts

Think of Way of Pi like a video game console:

1. **The brains (Pi):** The part that does the thinking. It can read your questions, look at files when allowed, and follow instructions.
2. **The screen (Way of Pi shell):** The app you see: chat, folders, editor, and settings. A small **server** in the shell also serves the **folder you opened** safely to the UI.

When people say **headless Pi**, they mean Pi running **without** the old full-screen terminal UI — still the real Pi program, driven by the Way of Pi app.

---

## What can you do with it?

### Build "superpowers" for your AI

If you were playing Minecraft, you might install "mods" for new items. In Way of Pi, you can add **extensions** — like mods that teach your helper new tools or behaviors.

### Hire a "team" of bots

You can set up a **team**: one persona for finding bugs, another for design, and so on. They work against the **workspace** you opened.

### A better way to code

Instead of copying code into a random website, the AI stays **inside the project folder** you chose, so it sees how files fit together.

---

## When the AI can change files (workspace tools)

Sometimes the assistant only **answers in chat**. Other times it can use **tools** to **read**, **search**, or **edit files** in the **folder you opened** — for example when your setup uses **orchestrator tools** in the Way of Pi server, or when chat runs through the real **Pi** program so Pi's normal tools apply. Think of it like a **robot arm that only reaches inside the toy box you put on the table**: it should not wander the rest of your computer unless you chose a risky folder or turned on powerful features. Always read warnings and use a **project folder** you trust.

---

## Keeping track of everything (documentation)

Way of Pi is not only for writing code; it is also a good place to keep notes and explain how things work.

**For you:** **Effort docs** under **`projects/`** in the repo (see **[projects/README.md](../projects/README.md)**) — a diary for a task or codebase the team is working on.

**For teams:** Everyone can share the same **playground** rules, **agent** setups, and guides in git so nobody gets lost on a big project.

---

## Who uses this?

- **Creators** experimenting with the next idea in AI-assisted development.
- **Builders** making apps or sites who want a helper that understands the whole repo.
- **Power users** who like a fast, customizable desktop or browser workflow.

---

## Why is it helpful?

- **Easier to see:** Files and chat side by side instead of a tiny terminal-only view.
- **Fast:** Runs on your machine, so file access is local.
- **Private when you want it:** You can use **local models** (for example via **Ollama**) so chat does not have to leave your computer.

---

## Optional: open Way of Pi from the internet (ngrok)

Sometimes you want a **temporary public `https` link** to the computer where Way of Pi is running — for example from another network, on cellular, or to show someone a quick demo. **[ngrok](https://ngrok.com/)** is a common way to do that. It is **not** required for normal local use.

**In the app:** open **Settings → ngrok (optional)**. From there you can install the ngrok agent into the app, save your **[dashboard authtoken](https://dashboard.ngrok.com/get-started/your-authtoken)**, turn the managed tunnel on or off, and optionally set **tunnel login** (username and password) so strangers with the link cannot use your dev server without logging in.

**Details:** ports (Vite vs Bun), environment variables, HTTP APIs on the Bun server, security, and optional system-wide install — **[WOP_NGROK.md](./WOP_NGROK.md)**. The repo **[README.md](../README.md)** also has a short **Public HTTPS URL (ngrok)** section under **Way of Pi web UI**.

---

## Next steps

- **[README.md](../README.md)** — clone, prerequisites, run **Electron** or browser dev (`./start-wayofpi-electron.sh`, `./start-wayofpi-ui.sh`).
- **[WOP_PRODUCT_CAPABILITIES.md](./WOP_PRODUCT_CAPABILITIES.md)** — what is shipped vs still being wired.
- **[WOP_PRODUCT_OVERVIEW.md](./WOP_PRODUCT_OVERVIEW.md)** — product story and onboarding narratives.
- **[WOP_NGROK.md](./WOP_NGROK.md)** — public dev links with ngrok (optional).
- **[REPO_INDEX.md](./REPO_INDEX.md)** — folder map for this playground.
- **[docs/README.md](./README.md)** — full list of guides under **`docs/`**.

---

## 8. Governance (CABA)

The **CABA** framework (Capability Assurance & Boundedness Architecture) outlines how new capabilities are reviewed, documented, and bounded. For each new capability added to Way of Pi, ensure:

- It is listed in the **CABA checklist** (`CABA_CHECKLIST.md`).
- The entry is added to the **CABA log** (`docs/wayofpi/CABA.md`).
- The capability’s documentation references the CABA entry and the relevant workspace scope.

This ensures traceability, safety, and clear ownership for future contributions.

*This is Way of Pi. Meet your AI assistant's control center.*
