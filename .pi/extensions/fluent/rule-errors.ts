import type { ExtensionAPI } from '@pi/sdk';

/**
 * Extension: Rule Errors
 * Provides error codes for Pi rules validation
 * Following E1.1 - E1.15 specification
 */

// Error codes (export at top level per M1.1)
export const ErrorCode = {
    RULE_MISSING: 1001,
    RULE_READ_ERROR: 1002,
    RULE_PARSE_ERROR: 1003,
    VALIDATION_FAILED: 1004,
    PERMISSION_MISSING: 1005,
    SECRET_LEAK: 1006,
    TYPE_DECLARATION: 1007,
    SANDBOX_VIOLATION: 1008,
    PERMISSION_OVER: 1009,
} as const;

// Error messages
export const Message = {
    [ErrorCode.RULE_MISSING]: 'Rule file not found',
    [ErrorCode.RULE_READ_ERROR]: 'Failed to read rule',
    [ErrorCode.RULE_PARSE_ERROR]: 'Invalid rule format',
    [ErrorCode.VALIDATION_FAILED]: 'Rule validation failed',
    [ErrorCode.PERMISSION_MISSING]: 'Permissions not declared',
    [ErrorCode.SECRET_LEAK]: 'Hardcoded secrets detected',
    [ErrorCode.TYPE_DECLARATION]: 'Missing TypeScript declaration',
    [ErrorCode.SANDBOX_VIOLATION]: 'Sandbox execution failed',
    [ErrorCode.PERMISSION_OVER]: 'Permission overreaching',
};

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];

export default async function init(api: ExtensionAPI) {
  // Register error information tool (read-only)
  api.registerTool({
    name: 'get_error_codes',
    description: 'Get available error codes for rule validation',
    schema: {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          description: 'Error code to lookup',
        },
      },
      required: [],
    },
    execute: async (args?: any) => {
      const error = args?.error || Object.keys(ErrorCode).join(' | ');

      if (args?.error && ErrorCode[args.error as ErrorCodeType]) {
        return {
          code: ErrorCode[args.error as ErrorCodeType],
          message: Message[args.error as ErrorCodeType],
        };
      }

      return {
        success: true,
        codes: ErrorCode,
        messages: Message,
        usage: 'Get error codes for rule validation compliance',
      };
    },
  });

  return () => {};
}