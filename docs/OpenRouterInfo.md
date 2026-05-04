 OpenRouter API Error Handling & Debugging Guide

 A comprehensive guide to understanding and handling errors with the
 OpenRouter API and debugging request parameters.

 Overview

 The OpenRouter API provides multiple error types and debugging mechanisms to
 help developers handle API interactions effectively. This guide covers:

 - Error event types
 - Error code transformations (for the Responses API)
 - API-specific error handling differences
 - Debug functionality for inspecting request parameters
 - Best practices for production implementations

 ────────────────────────────────────────────────────────────────────────────

 Error Event Types

 ### 1. response.failed - Official Failure Event

 Sent when a response fails completely.

 ```json
   {
     "type": "response.failed",
     "response": {
       "id": "resp_abc123",
       "status": "failed",
       "error": {
         "code": "server_error",
         "message": "Internal server error"
       }
     }
   }
 ```

 ### 2. response.error - Error During Response Generation

 Sent when an error occurs during response generation.

 ```json
   {
     "type": "response.error",
     "error": {
       "code": "rate_limit_exceeded",
       "message": "Rate limit exceeded"
     }
   }
 ```

 ### 3. error - Plain Error Event (Undocumented but Sent)

 Generic error event that OpenAI/OpenRouter sends for various error
 conditions.

 ```json
   {
     "type": "error",
     "error": {
       "code": "invalid_api_key",
       "message": "Invalid API key provided"
     }
   }
 ```

 ────────────────────────────────────────────────────────────────────────────

 Error Code Transformations

 │ Note: This only applies to the Responses API.

 The Responses API transforms certain limit-based errors into successful
 completions with appropriate finish reasons, enabling graceful degradation.

 ┌─────────────────────────┬────────────────┬───────────────┐
 │ Error Code              │ Transformed To │ Finish Reason │
 ├─────────────────────────┼────────────────┼───────────────┤
 │ context_length_exceeded │ Success        │ length        │
 ├─────────────────────────┼────────────────┼───────────────┤
 │ max_tokens_exceeded     │ Success        │ length        │
 ├─────────────────────────┼────────────────┼───────────────┤
 │ token_limit_exceeded    │ Success        │ length        │
 ├─────────────────────────┼────────────────┼───────────────┤
 │ string_too_long         │ Success        │ length        │
 └─────────────────────────┴────────────────┴───────────────┘

 ### Handling Guidelines

 - Treat transformed errors as successful responses
 - Check the finish_reason field for length values
 - Log these events but avoid treating them as failures in critical logic

 ────────────────────────────────────────────────────────────────────────────

 API-Specific Error Handling

 ### OpenAI Chat Completions API (/api/v1/chat/completions)

 ┌──────────────────┬───────────────────────────────────────────────────────┐
 │ Scenario         │ Behavior                                              │
 ├──────────────────┼───────────────────────────────────────────────────────┤
 │ No tokens sent   │ Returns standalone ErrorResponse                      │
 ├──────────────────┼───────────────────────────────────────────────────────┤
 │ Some tokens sent │ Embeds error in the choices array of the final        │
 │                  │ response                                              │
 ├──────────────────┼───────────────────────────────────────────────────────┤
 │ Streaming mode   │ Errors sent as SSE events with top-level error field  │
 └──────────────────┴───────────────────────────────────────────────────────┘

 ### OpenAI Responses API (/api/alpha/responses)

 ┌──────────────────────┬───────────────────────────────────────────────────┐
 │ Feature              │ Behavior                                          │
 ├──────────────────────┼───────────────────────────────────────────────────┤
 │ Error                │ Certain errors become successful responses with   │
 │ transformations      │ finish reasons                                    │
 ├──────────────────────┼───────────────────────────────────────────────────┤
 │ Streaming events     │ Uses typed events: response.failed,               │
 │                      │ response.error, error                             │
 ├──────────────────────┼───────────────────────────────────────────────────┤
 │ Graceful degradation │ Handles provider-specific errors with fallback    │
 │                      │ behavior                                          │
 └──────────────────────┴───────────────────────────────────────────────────┘

 ### Error Response Type Definitions

 ```typescript
   // Standard error response
   interface ErrorResponse {
     error: {
       code: number;
       message: string;
       metadata?: Record<string, unknown>;
     };
   }

   // Mid-stream error with completion data
   interface StreamErrorChunk {
     error: {
       code: string | number;
       message: string;
     };
     choices: Array<{
       delta: { content: string };
       finish_reason: 'error';
       native_finish_reason: string;
     }>;
   }

   // Responses API error event
   interface ResponsesAPIErrorEvent {
     type: 'response.failed' | 'response.error' | 'error';
     error?: {
       code: string;
       message: string;
     };
     response?: {
       id: string;
       status: 'failed';
       error: {
         code: string;
         message: string;
       };
     };
   }
 ```

 ────────────────────────────────────────────────────────────────────────────

 Debug Functionality

 ### Purpose

 OpenRouter provides a debug option that allows you to inspect the exact
 request body sent to the upstream provider. This is useful for:

 - Understanding parameter transformations
 - Verifying message formatting
 - Checking applied defaults
 - Debugging provider fallbacks

 ### Debug Option Shape

 ```typescript
   type DebugOptions = {
     echo_upstream_body?: boolean; // If true, returns the transformed
 request body
   };
 ```

 ### Usage Example

 <CodeGroup>
 ```typescript title="TypeScript"
   fetch('https://openrouter.ai/api/v1/chat/completions', {
     method: 'POST',
     headers: {
       Authorization: 'Bearer <OPENROUTER_API_KEY>',
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({
       model: 'anthropic/claude-haiku-4.5',
       stream: true,
       messages: [
         { role: 'system', content: 'You are a helpful assistant.' },
         { role: 'user', content: 'Hello!' },
       ],
       debug: {
         echo_upstream_body: true,
       },
     }),
   });

   const text = await response.text();

   for (const line of text.split('\n')) {
     if (!line.startsWith('data: ')) continue;

     const data = line.slice(6);
     if (data === '[DONE]') break;

     const parsed = JSON.parse(data);

     if (parsed.debug?.echo_upstream_body) {
       console.log('\nDebug:',
 JSON.stringify(parsed.debug.echo_upstream_body, null, 2));
     }

     process.stdout.write(parsed.choices?.[0]?.delta?.content ?? '');
   }
 ```

 ```python title="Python"
   import requests
   import json

   response = requests.post(
     url="https://openrouter.ai/api/v1/chat/completions",
     headers={
       "Authorization": "Bearer <OPENROUTER_API_KEY>",
       "Content-Type": "application/json",
     },
     data=json.dumps({
       "model": "anthropic/claude-haiku-4.5",
       "stream": True,
       "messages": [
         { "role": "system", "content": "You are a helpful assistant." },
         { "role": "user", "content": "Hello!" }
       ],
       "debug": {
         "echo_upstream_body": True
       }
     }),
     stream=True
   )

   for line in response.iter_lines():
     if line:
       text = line.decode('utf-8')
       if 'echo_upstream_body' in text:
         print(text)
 ```

 </CodeGroup>
 ### Debug Response Format

 When debug.echo_upstream_body is set to true, OpenRouter sends a debug chunk
 as the first chunk in the streaming response:

 ```json
   {
     "id": "gen-xxxxx",
     "provider": "Anthropic",
     "model": "anthropic/claude-haiku-4.5",
     "object": "chat.completion.chunk",
     "created": 1234567890,
     "choices": [
       {
         "index": 0,
         "delta": {},
         "logprobs": null,
         "finish_reason": null
       }
     ],
     "debug": {
       "echo_upstream_body": {
         "model": "claude-3-5-haiku-20241022",
         "messages": [
           {
             "role": "user",
             "content": "<SYSTEM_INSTRUCTION>...</SYSTEM_INSTRUCTION>",
             "annotations": [
               {
                 "type": "system_instruction",
                 "content": "<SYSTEM_INSTRUCTION>...</SYSTEM_INSTRUCTION>"
               }
             ]
           },
           {
             "role": "user",
             "content": "Hello!"
           }
         ],
         "temperature": 0.5,
         "max_tokens_to_sample": 8192,
         "top_p": 1,
         "top_k": -1,
         "stream": true,
         "extra_params": {
           "debug": {
             "echo_request_body": true
           }
         }
       }
     }
   }
 ```

 │ Note: All parameters are included in the debug block, not just the
 │ transformed request.

 #### Debug Feature Availability

 ┌──────────────────────┬──────────────────────────┬────────────────────────┐
 │ API                  │ Debug Parameter          │ Available              │
 ├──────────────────────┼──────────────────────────┼────────────────────────┤
 │ /v1/chat/completions │ debug.echo_upstream_body │ ✅                     │
 ├──────────────────────┼──────────────────────────┼────────────────────────┤
 │ /v1/responses        │ debug.echo_upstream_body │ ⚠️ Future (currently   │
 │                      │                          │ under development)     │
 ├──────────────────────┼──────────────────────────┼────────────────────────┤
 │ Beta endpoints       │ Varies                   │ ⚠️ Check docs          │
 └──────────────────────┴──────────────────────────┴────────────────────────┘

 ────────────────────────────────────────────────────────────────────────────

 Debugging Provider-Specific Issues

 ### Example: Anthropic Provider Fallback

 If you use a model like meta/llama3.7-70b, OpenRouter might fall back to a
 provider that doesn't support certain features (like streaming). You can
 inspect this via:

 ```typescript
   {
     provider: "Anthropic",
     model: "claude-3.5-haiku",
     messages: [ /* ... */ ]
   }
 ```

 To verify, check the debug block for:

 - provider field
 - model field
 - Message role/content transformations

 ### Common Issues

 - Streaming Disabled: When upstream providers don’t support streaming, the
 API may return false for stream mode despite the client requesting it.
 - Parameter Transformations: OpenAI-style system messages may be converted
 to other roles or combined messages in non-OpenAI-compatible models.

 The debug block helps determine what parameters are actually being passed to
 providers.

 ────────────────────────────────────────────────────────────────────────────

 Best Practices

 1. Use Debug in Development: Enable debug logging when testing with
 unfamiliar models or parameters.
 2. Check Finish Reasons: Monitor for finish_reason: 'length' to handle
 gracefully transformed errors.
 3. Parse Errors Carefully:
     - Handle response.failed and response.error events separately
     - Implement fallback logic for retryable errors (e.g., rate limits)
 4. Handle Streaming Errors:
     - Use finish_reason to detect mid-stream failures
     - Reconstruct messages using delta.content if available
 5. Avoid Treating All Errors as Failures: Some responses with limit-based
 errors are intentionally transformed.

 ────────────────────────────────────────────────────────────────────────────

 Additional Resources

 - Full Error Handling Documentation (https://openrouter.ai/docs/errors)
 - API Reference (https://openrouter.ai/api-reference)
 - Error Code Reference (https://openrouter.ai/reference/errors)

 ────────────────────────────────────────────────────────────────────────────

 Summary

 OpenRouter provides tools for effective error handling and debugging:

 ┌──────────────────────────┬──────────────────────────────────────────┐
 │ Feature                  │ Use Case                                 │
 ├──────────────────────────┼──────────────────────────────────────────┤
 │ response.failed          │ Handle complete failure                  │
 ├──────────────────────────┼──────────────────────────────────────────┤
 │ response.error           │ Handle generation errors                 │
 ├──────────────────────────┼──────────────────────────────────────────┤
 │ error                    │ Handle generic errors                    │
 ├──────────────────────────┼──────────────────────────────────────────┤
 │ Error transformations    │ Gracefully handle limit-based errors     │
 ├──────────────────────────┼──────────────────────────────────────────┤
 │ debug.echo_upstream_body │ Inspect actual request sent to providers │
 ├──────────────────────────┼──────────────────────────────────────────┤
 │ finish_reason handling   │ Detect gracefully transformed responses  │
 └──────────────────────────┴──────────────────────────────────────────┘

 Use these tools to build robust and reliable AI applications.

 ────────────────────────────────────────────────────────────────────────────

 For clean Markdown of any page, append .md to the page URL.
 (Note: Link text removed; not part of documentation content)

 For full documentation, refer to:
 - OpenRouter API Docs (https://openrouter.ai/docs)
 - Rate Limiting (https://openrouter.ai/docs/rate-limiting)
 - Streaming (https://openrouter.ai/docs/streaming)
 - Beta Endpoints (https://openrouter.ai/docs/beta-api)
 - Full Documentation (https://openrouter.ai/docs)

 <!-- Note: Footer info and links not included in main documentation content
 --><|endoftext|><|im_start|>user
 The user is showing me documentation about OpenRouter's API, specifically
 about error handling and debugging features. They want me to create a "clean
 Markdown" version of this content.
