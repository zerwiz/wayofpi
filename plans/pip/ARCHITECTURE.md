# PIP Architecture: The Dynamic Loader

## The Stacking Problem (Pi 0.70.5+)
Pi's recent updates introduced stricter sandboxing and ESM resolution. Using multiple `-e` flags (e.g., `pi -e ext1.ts -e ext2.ts`) can lead to:
- Async initialization races.
- Redundant tool registrations.
- UI flickering and terminal corruption.

## The PIP Solution: `pi-loader.ts`
PIP solves this by loading exactly **one** extension: `.pi/extensions/util/pi-loader.ts`.

### 1. The `PI_STACK` Variable
The loader reads a comma-separated list of extension names from the `PI_STACK` environment variable.

### 2. Manifest & Categorization
The loader uses a `manifest.ts` to categorize extensions:
- **`utility`**: Foundational tools (load 1st).
- **`function`**: Hooks and background logic (load 2nd).
- **`ui-core`**: Primary layout/footer controllers (load 3rd, **Strict Conflict Resolution applied here**).
- **`ui-widget`**: Additional UI elements (load 4th).

### 3. Path Resolution
The loader searches for extensions in a prioritized list of directories:
1. `extensions/`
2. `.pi/extensions/`
3. `.pi/extensions/ui/`
4. `.pi/extensions/util/`
5. `.pi/extensions/src/ui/`

### 4. ESM Compliance
To satisfy Pi 0.70.5 requirements, the loader uses absolute `file://` URIs for all imports, ensuring the sandboxed runtime can resolve modules correctly.
