import { NextRequest } from 'next/server';

// Define model types
type ModelProvider = 'v0' | 'gpt-4.1' | 'claude-4';

interface GenerateRequest {
  prompt: string;
  model: ModelProvider;
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, model }: GenerateRequest = await request.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!model) {
      return new Response(
        JSON.stringify({ error: 'Model selection is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Route to appropriate model handler
    switch (model) {
      case 'v0':
        return await handleV0Request(prompt);
      case 'gpt-4.1':
        return await handleOpenAIRequest(prompt);
      case 'claude-4':
        return await handleClaudeRequest(prompt);
      default:
        return new Response(
          JSON.stringify({ error: 'Unsupported model' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// V0 API Handler (existing implementation)
async function handleV0Request(prompt: string): Promise<Response> {
  const response = await fetch('https://api.v0.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.V0_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'v0-1.5-md',
      messages: [
        {
          role: 'system',
          content: 'You are an expert UI designer. Generate clean, modern React components using Tailwind CSS and shadcn/ui components. Focus on creating beautiful product info pages with proper typography, layout, and responsive design. Always include realistic placeholder content.'
        },
        {
          role: 'user',
          content: `Create a product info page component with the following requirements: ${prompt}. Make sure to use modern design patterns, proper spacing, and include sections for product images, description, features, pricing, and call-to-action buttons. Use Tailwind CSS for styling.`
        }
      ],
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('v0 API error:', errorText);
    return new Response(
      JSON.stringify({ error: 'Failed to generate component with v0' }),
      { status: response.status, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return createStreamResponse(response);
}

// OpenAI GPT-4.1 Handler
async function handleOpenAIRequest(prompt: string): Promise<Response> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert React developer and UI/UX designer. Generate clean, modern React components using Tailwind CSS and common UI patterns. Focus on creating beautiful, responsive product info pages with proper typography, layout, and accessibility. Always wrap your code in markdown code blocks with ```jsx or ```tsx.'
        },
        {
          role: 'user',
          content: `Create a complete React component for a product info page with the following requirements: ${prompt}. 

Requirements:
- Use modern React with hooks (useState, useEffect as needed)
- Style with Tailwind CSS classes
- Include sections for product images, description, features, pricing, and call-to-action buttons
- Make it fully responsive (mobile-first design)
- Use semantic HTML elements
- Include realistic placeholder content and mock data
- Add interactive elements like image gallery, quantity selectors, etc.
- Use modern design patterns with proper spacing and typography

Return only the React component code wrapped in a code block.`
        }
      ],
      stream: true,
      max_tokens: 4000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error:', errorText);
    return new Response(
      JSON.stringify({ error: 'Failed to generate component with GPT-4.1' }),
      { status: response.status, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return createStreamResponse(response);
}

// Claude-4 Handler
async function handleClaudeRequest(prompt: string): Promise<Response> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.CLAUDE_API_KEY || '',
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: `You are an expert React developer and UI/UX designer. Create a complete React component for a product info page with the following requirements: ${prompt}.

Requirements:
- Use modern React with hooks (useState, useEffect as needed)
- Style with Tailwind CSS classes
- Include sections for product images, description, features, pricing, and call-to-action buttons
- Make it fully responsive (mobile-first design)
- Use semantic HTML elements
- Include realistic placeholder content and mock data
- Add interactive elements like image gallery, quantity selectors, etc.
- Use modern design patterns with proper spacing and typography

Return only the React component code wrapped in a markdown code block with \`\`\`jsx or \`\`\`tsx.`
        }
      ],
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Claude API error:', errorText);
    return new Response(
      JSON.stringify({ error: 'Failed to generate component with Claude-4' }),
      { status: response.status, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Claude uses a different streaming format
  return createClaudeStreamResponse(response);
}

// Generic stream response handler for OpenAI and V0
function createStreamResponse(response: Response): Response {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body?.getReader();
      if (!reader) {
        controller.close();
        return;
      }

      let buffer = '';
      let heartbeatInterval: NodeJS.Timeout | undefined;
      
      // Send heartbeat every 30 seconds to keep connection alive
      const sendHeartbeat = () => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          // Connection closed, clear interval
          if (heartbeatInterval) clearInterval(heartbeatInterval);
        }
      };
      
      heartbeatInterval = setInterval(sendHeartbeat, 30000);
      
      try {
        let consecutiveErrors = 0;
        const maxErrors = 5;
        
        while (true) {
          try {
            const result = await Promise.race([
              reader.read(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Read timeout')), 10000)
              )
            ]) as ReadableStreamReadResult<Uint8Array>;
            
            const { done, value } = result;
            
            if (done) {
              // Send final completion signal
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: '', done: true })}\n\n`));
              break;
            }
            
            // Reset error counter on successful read
            consecutiveErrors = 0;
            
            buffer += decoder.decode(value, { stream: true });
            
            // Process complete lines
            let lineEndIndex;
            while ((lineEndIndex = buffer.indexOf('\n')) !== -1) {
              const line = buffer.slice(0, lineEndIndex).trim();
              buffer = buffer.slice(lineEndIndex + 1);
              
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (data === '[DONE]') {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: '', done: true })}\n\n`));
                  if (heartbeatInterval) clearInterval(heartbeatInterval);
                  controller.close();
                  return;
                }
                
                if (data && data !== '') {
                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    if (content) {
                      // Send content with chunk index for ordering
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                        content, 
                        timestamp: Date.now() 
                      })}\n\n`));
                    }
                  } catch (parseError) {
                    console.error('Error parsing SSE data:', parseError, 'Data:', data);
                    // Continue processing instead of breaking
                  }
                }
              }
            }
          } catch (readError) {
            consecutiveErrors++;
            console.error(`Stream read error (${consecutiveErrors}/${maxErrors}):`, readError);
            
            if (consecutiveErrors >= maxErrors) {
              throw new Error(`Too many consecutive read errors: ${readError instanceof Error ? readError.message : String(readError)}`);
            }
            
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      } catch (error) {
        console.error('Stream error:', error);
        // Send error information to client
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            error: error instanceof Error ? error.message : String(error),
            timestamp: Date.now()
          })}\n\n`));
        } catch {
          // Controller might be closed
        }
        controller.error(error);
      } finally {
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        try {
          reader.releaseLock();
        } catch {
          // Reader might already be released
        }
      }
    },
    
    cancel() {
      console.log('Stream cancelled by client');
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}

// Claude-specific stream response handler
function createClaudeStreamResponse(response: Response): Response {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body?.getReader();
      if (!reader) {
        controller.close();
        return;
      }

      let buffer = '';
      let heartbeatInterval: NodeJS.Timeout | undefined;
      
      // Send heartbeat every 30 seconds to keep connection alive
      const sendHeartbeat = () => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch (e) {
          if (heartbeatInterval) clearInterval(heartbeatInterval);
        }
      };
      
      heartbeatInterval = setInterval(sendHeartbeat, 30000);
      
      try {
        let consecutiveErrors = 0;
        const maxErrors = 5;
        
        while (true) {
          try {
            const result = await Promise.race([
              reader.read(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Read timeout')), 10000)
              )
            ]) as ReadableStreamReadResult<Uint8Array>;
            
            const { done, value } = result;
            
            if (done) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: '', done: true })}\n\n`));
              break;
            }
            
            consecutiveErrors = 0;
            buffer += decoder.decode(value, { stream: true });
            
            // Process complete lines
            let lineEndIndex;
            while ((lineEndIndex = buffer.indexOf('\n')) !== -1) {
              const line = buffer.slice(0, lineEndIndex).trim();
              buffer = buffer.slice(lineEndIndex + 1);
              
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (data === '[DONE]') {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: '', done: true })}\n\n`));
                  if (heartbeatInterval) clearInterval(heartbeatInterval);
                  controller.close();
                  return;
                }
                
                if (data && data !== '') {
                  try {
                    const parsed = JSON.parse(data);
                    // Claude streaming format
                    const content = parsed.delta?.text;
                    if (content) {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                        content,
                        timestamp: Date.now()
                      })}\n\n`));
                    }
                  } catch (parseError) {
                    console.error('Error parsing Claude SSE data:', parseError, 'Data:', data);
                  }
                }
              }
            }
          } catch (readError) {
            consecutiveErrors++;
            console.error(`Claude stream read error (${consecutiveErrors}/${maxErrors}):`, readError);
            
            if (consecutiveErrors >= maxErrors) {
              throw new Error(`Too many consecutive read errors: ${readError instanceof Error ? readError.message : String(readError)}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      } catch (error) {
        console.error('Claude stream error:', error);
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            error: error instanceof Error ? error.message : String(error),
            timestamp: Date.now()
          })}\n\n`));
        } catch {
          // Controller might be closed
        }
        controller.error(error);
      } finally {
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        try {
          reader.releaseLock();
        } catch {
          // Reader might already be released
        }
      }
    },
    
    cancel() {
      console.log('Claude stream cancelled by client');
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}