'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';

interface CodeViewerProps {
  code: string;
}

export function CodeViewer({ code }: CodeViewerProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Extract code from markdown code blocks if present
  const extractCode = (text: string) => {
    const codeBlockRegex = /```(?:jsx?|tsx?|javascript|typescript)?\n?([\s\S]*?)```/;
    const match = text.match(codeBlockRegex);
    return match ? match[1].trim() : text;
  };

  const cleanCode = extractCode(code);

  return (
    <div className="relative">
      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 border-b">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Generated React Component
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={copyToClipboard}
          className="h-8"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy Code
            </>
          )}
        </Button>
      </div>
      <div className="max-h-96 overflow-auto">
        <pre className="p-4 text-sm bg-slate-900 text-slate-100 overflow-x-auto">
          <code>{cleanCode}</code>
        </pre>
      </div>
    </div>
  );
} 