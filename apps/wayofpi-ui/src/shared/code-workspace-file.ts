/**
 * @file This is a declaration file for shared code workspace utilities
 */
import { BuildCodeWorkspacePayload } from "pi-types";

export type CodeWorkspaceFolderEntry = string | {
    uri: string;
    name: string;
};

export type WorkspaceFolderInput = {
    name: string;
    uri: string;
};

export function buildCodeWorkspacePayload(entry: CodeWorkspaceFolderEntry): BuildCodeWorkspacePayload | null {
    return null;
}

export function unixRelativePath(path: string): string {
    return path;
}
