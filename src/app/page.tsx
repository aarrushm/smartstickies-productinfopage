'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, Code2, Eye } from 'lucide-react';
import { CodeViewer } from '@/components/code-viewer';
import { PreviewRenderer } from '@/components/preview-renderer';

const formSchema = z.object({
  prompt: z.string().min(10, {
    message: 'Product description must be at least 10 characters.',
  }),
  model: z.enum(['v0', 'gpt-4.1', 'claude-4'], {
    required_error: 'Please select a model.',
  }),
});

export default function Home() {
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [streamingCode, setStreamingCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: '',
      model: 'v0',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setIsStreaming(true);
    setError('');
    setGeneratedCode('');
    setStreamingCode('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: values.prompt,
          model: values.model 
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate component');
      }

      // Handle streaming response with retry mechanism
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedCode = '';
      let buffer = '';
      let retryCount = 0;
      const maxRetries = 3;

      if (reader) {
        try {
          while (true) {
            const result = await Promise.race([
              reader.read(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Client read timeout')), 15000)
              )
            ]) as ReadableStreamReadResult<Uint8Array>;

            const { done, value } = result;
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            
            // Process complete lines
            let lineEndIndex;
            while ((lineEndIndex = buffer.indexOf('\n')) !== -1) {
              const line = buffer.slice(0, lineEndIndex).trim();
              buffer = buffer.slice(lineEndIndex + 1);

              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                
                // Skip heartbeat messages
                if (line.startsWith(': heartbeat')) {
                  continue;
                }
                
                if (data && data !== '[DONE]' && data !== '') {
                  try {
                    const parsed = JSON.parse(data);
                    
                    // Handle error messages from server
                    if (parsed.error) {
                      setError(`Generation error: ${parsed.error}`);
                      break;
                    }
                    
                    // Handle completion signal
                    if (parsed.done) {
                      console.log('Stream completed successfully');
                      break;
                    }
                    
                    // Handle content
                    if (parsed.content) {
                      accumulatedCode += parsed.content;
                      setStreamingCode(accumulatedCode);
                      retryCount = 0; // Reset retry count on successful data
                    }
                  } catch (e) {
                    console.error('Error parsing SSE data:', e, 'Data:', data);
                    retryCount++;
                    
                    if (retryCount > maxRetries) {
                      throw new Error('Too many parsing errors');
                    }
                  }
                }
              }
            }
          }
          
          // Once streaming is complete, set the final code for preview
          if (accumulatedCode.trim()) {
            setGeneratedCode(accumulatedCode);
          } else {
            setError('No code was generated. Please try again.');
          }
        } catch (streamError) {
          console.error('Stream reading error:', streamError);
          if (accumulatedCode.trim()) {
            // If we have partial content, use it
            setGeneratedCode(accumulatedCode);
            setError('Stream was interrupted, but partial content was saved.');
          } else {
            setError('Failed to read stream. Please try again.');
          }
        } finally {
          try {
            reader.releaseLock();
          } catch {
            // Reader might already be released
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-blue-600 mr-2" />
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
              Smart Tag Generator
            </h1>
          </div>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Describe your product and let AI generate a beautiful, responsive product info page for you.
          </p>
        </div>

        {/* Input Form */}
        <Card className="max-w-2xl mx-auto mb-8">
          <CardHeader>
            <CardTitle>Describe Your Product</CardTitle>
            <CardDescription>
              Enter a detailed description of the product info page you want to create.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-3">
                    <FormField
                      control={form.control}
                      name="prompt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g., A premium wireless headphone with noise cancellation, 30-hour battery life, and premium leather design. Include product images, feature highlights, customer reviews section, and pricing tiers."
                              className="min-h-[120px] resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Be specific about features, design preferences, and sections you want included.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="md:col-span-1">
                    <FormField
                      control={form.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>AI Model</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select model" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="v0">
                                <div className="flex flex-col">
                                  <span className="font-medium">v0 by Vercel</span>
                                  <span className="text-xs text-muted-foreground">UI Components</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="gpt-4.1">
                                <div className="flex flex-col">
                                  <span className="font-medium">GPT-4.1</span>
                                  <span className="text-xs text-muted-foreground">by OpenAI</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="claude-4">
                                <div className="flex flex-col">
                                  <span className="font-medium">Claude-4</span>
                                  <span className="text-xs text-muted-foreground">by Anthropic</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose the AI model to generate your component
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Product Page
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="max-w-2xl mx-auto mb-8 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <CardContent className="pt-6">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Generated Code Display */}
        {(generatedCode || streamingCode) && (
          <Card className="max-w-6xl mx-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  Generated Product Page
                  {isStreaming && (
                    <div className="ml-3 flex items-center text-sm text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Generating...
                    </div>
                  )}
                </CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant={activeTab === 'preview' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab('preview')}
                    disabled={isStreaming && !generatedCode}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                    {isStreaming && !generatedCode && (
                      <span className="ml-1 text-xs">(Preparing...)</span>
                    )}
                  </Button>
                  <Button
                    variant={activeTab === 'code' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab('code')}
                  >
                    <Code2 className="w-4 h-4 mr-2" />
                    Code
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {activeTab === 'preview' ? (
                // Only render preview when streaming is complete
                generatedCode ? (
                  <PreviewRenderer code={generatedCode} />
                ) : (
                  <div className="flex items-center justify-center p-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-slate-600 dark:text-slate-400">
                        Preparing preview... Please wait for generation to complete.
                      </p>
                    </div>
                  </div>
                )
              ) : (
                // Show real-time streaming for code tab
                <CodeViewer code={streamingCode || generatedCode} />
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
