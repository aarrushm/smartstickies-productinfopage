'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PreviewRendererProps {
  code: string;
}

export function PreviewRenderer({ code }: PreviewRendererProps) {
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // Extract code from markdown code blocks if present
  const extractCode = (text: string) => {
    // Remove thinking tags and their content
    let cleanedText = text.replace(/<Thinking>[\s\S]*?<\/Thinking>/gi, '');
    cleanedText = cleanedText.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
    
    // Try to extract code from markdown code blocks
    const codeBlockRegex = /```(?:jsx?|tsx?|javascript|typescript|react)?\n?([\s\S]*?)```/g;
    const matches = [...cleanedText.matchAll(codeBlockRegex)];
    
    if (matches.length > 0) {
      // Combine all code blocks, filtering out any that might contain thinking content
      const codeBlocks = matches
        .map(match => match[1].trim())
        .filter(code => !code.toLowerCase().includes('thinking'))
        .filter(code => code.length > 50); // Filter out very short snippets
      
      return codeBlocks.join('\n\n');
    }
    
    // If no code blocks found, return the cleaned text
    return cleanedText.trim();
  };

  const generatePreview = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      // Extract the actual code
      const cleanCode = extractCode(code);
      
      // Create a full HTML document with the React component
      const previewHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: white;
    }
    /* Add basic shadcn/ui styles */
    button {
      transition: all 0.2s;
    }
    .animate-spin {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const { useState, useEffect, useRef } = React;
    
    // Mock shadcn/ui components
    const Button = ({ children, variant = 'default', size = 'default', className = '', ...props }) => {
      const variants = {
        default: 'bg-slate-900 text-white hover:bg-slate-800',
        outline: 'border border-slate-200 hover:bg-slate-100',
        ghost: 'hover:bg-slate-100',
        secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200'
      };
      const sizes = {
        default: 'px-4 py-2',
        sm: 'px-3 py-1.5 text-sm',
        lg: 'px-6 py-3 text-lg'
      };
      return (
        <button 
          className={\`inline-flex items-center justify-center rounded-md font-medium transition-colors \${variants[variant]} \${sizes[size]} \${className}\`}
          {...props}
        >
          {children}
        </button>
      );
    };
    
    const Card = ({ children, className = '' }) => (
      <div className={\`rounded-lg border border-slate-200 bg-white shadow-sm \${className}\`}>
        {children}
      </div>
    );
    
    const CardHeader = ({ children, className = '' }) => (
      <div className={\`p-6 \${className}\`}>{children}</div>
    );
    
    const CardTitle = ({ children, className = '' }) => (
      <h3 className={\`text-lg font-semibold \${className}\`}>{children}</h3>
    );
    
    const CardDescription = ({ children, className = '' }) => (
      <p className={\`text-sm text-slate-600 \${className}\`}>{children}</p>
    );
    
    const CardContent = ({ children, className = '' }) => (
      <div className={\`p-6 pt-0 \${className}\`}>{children}</div>
    );
    
    const CardFooter = ({ children, className = '' }) => (
      <div className={\`p-6 pt-0 \${className}\`}>{children}</div>
    );
    
    const Badge = ({ children, variant = 'default', className = '' }) => {
      const variants = {
        default: 'bg-slate-900 text-white',
        secondary: 'bg-slate-100 text-slate-900',
        outline: 'border border-slate-200',
        destructive: 'bg-red-500 text-white'
      };
      return (
        <span className={\`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold \${variants[variant]} \${className}\`}>
          {children}
        </span>
      );
    };
    
    const Input = ({ className = '', ...props }) => (
      <input 
        className={\`flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 \${className}\`}
        {...props}
      />
    );
    
    const Label = ({ children, className = '', ...props }) => (
      <label className={\`text-sm font-medium leading-none \${className}\`} {...props}>
        {children}
      </label>
    );
    
    const Textarea = ({ className = '', ...props }) => (
      <textarea 
        className={\`flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 \${className}\`}
        {...props}
      />
    );

    // Mock Lucide icons
    const Star = ({ className = '' }) => (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="24" height="24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    );
    
    const Check = ({ className = '' }) => (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="24" height="24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5"/>
      </svg>
    );
    
    const ShoppingCart = ({ className = '' }) => (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="24" height="24">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
    );
    
    const Heart = ({ className = '' }) => (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="24" height="24">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    );
    
    const Share2 = ({ className = '' }) => (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="24" height="24">
        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
      </svg>
    );
    
    const ChevronRight = ({ className = '' }) => (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="24" height="24">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    );
    
    const ChevronLeft = ({ className = '' }) => (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="24" height="24">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    );

    const Package = ({ className = '' }) => (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="24" height="24">
        <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    );

    const Truck = ({ className = '' }) => (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="24" height="24">
        <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
        <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    );

    const Shield = ({ className = '' }) => (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="24" height="24">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    );

    const User = ({ className = '' }) => (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="24" height="24">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    );

    const Zap = ({ className = '' }) => (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="24" height="24">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    );

    const Activity = ({ className = '' }) => (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="24" height="24">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    );

    const MapPin = ({ className = '' }) => (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="24" height="24">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
      </svg>
    );

    const Leaf = ({ className = '' }) => (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="24" height="24">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    );

    const Recycle = ({ className = '' }) => (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="24" height="24">
        <polyline points="7 11 12 2 17 11"/><polyline points="17 11 22 13 17 19 15 14"/>
        <polyline points="2 13 7 11 7 19 5 14"/><line x1="11" y1="11" x2="14" y2="16"/>
      </svg>
    );

    const Award = ({ className = '' }) => (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="24" height="24">
        <circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
      </svg>
    );

    const Droplets = ({ className = '' }) => (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="24" height="24">
        <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/>
        <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>
      </svg>
    );
    
    // Placeholder image function
    const PlaceholderImage = ({ width = 600, height = 400, text = 'Product Image' }) => (
      <div 
        className="flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600 font-medium"
        style={{ width: '100%', aspectRatio: \`\${width}/\${height}\` }}
      >
        {text}
      </div>
    );

    // Additional mock components
    const Tabs = ({ children, value, onValueChange, className = '' }) => {
      const [activeTab, setActiveTab] = useState(value || 'tab1');
      return (
        <div className={className}>
          {React.Children.map(children, child => 
            React.cloneElement(child, { activeTab, setActiveTab, onValueChange })
          )}
        </div>
      );
    };
    
    const TabsList = ({ children, className = '' }) => (
      <div className={\`flex space-x-1 rounded-lg bg-slate-100 p-1 \${className}\`}>
        {children}
      </div>
    );
    
    const TabsTrigger = ({ children, value, activeTab, setActiveTab, onValueChange, className = '' }) => (
      <button
        onClick={() => {
          setActiveTab(value);
          onValueChange && onValueChange(value);
        }}
        className={\`px-3 py-1.5 text-sm font-medium rounded-md transition-all \${
          activeTab === value 
            ? 'bg-white text-slate-900 shadow' 
            : 'text-slate-600 hover:text-slate-900'
        } \${className}\`}
      >
        {children}
      </button>
    );
    
    const TabsContent = ({ children, value, activeTab, className = '' }) => (
      activeTab === value ? <div className={className}>{children}</div> : null
    );

    const Avatar = ({ children, className = '' }) => (
      <div className={\`relative inline-flex h-10 w-10 shrink-0 overflow-hidden rounded-full \${className}\`}>
        {children}
      </div>
    );
    
    const AvatarImage = ({ src, alt = '', className = '' }) => (
      <img className={\`aspect-square h-full w-full \${className}\`} src={src} alt={alt} />
    );
    
    const AvatarFallback = ({ children, className = '' }) => (
      <div className={\`flex h-full w-full items-center justify-center rounded-full bg-slate-100 \${className}\`}>
        {children}
      </div>
    );

    const Progress = ({ value = 0, className = '' }) => (
      <div className={\`relative h-4 w-full overflow-hidden rounded-full bg-slate-200 \${className}\`}>
        <div
          className="h-full bg-blue-600 transition-all"
          style={{ width: \`\${value}%\` }}
        />
      </div>
    );

    const Select = ({ children, ...props }) => <select {...props}>{children}</select>;
    const SelectTrigger = ({ children, className = '' }) => (
      <button className={\`flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm \${className}\`}>
        {children}
      </button>
    );
    const SelectContent = ({ children }) => <div>{children}</div>;
    const SelectItem = ({ children, value }) => <option value={value}>{children}</option>;

    try {
      // First, let's clean up any TypeScript syntax
      let componentCode = \`${cleanCode}\`
        .replace(/^['"]use client['"][\\s;]*/gm, '')
        .replace(/export\\s+default\\s+function\\s+(\\w+)/g, 'const $1 = function')
        .replace(/export\\s+default\\s+/g, 'const Component = ')
        .replace(/import\\s+[^;]+from\\s+['"][^'"]+['"];?/gm, '')
        .replace(/:\\s*React\\.FC(?:<[^>]*>)?/g, '')
        .replace(/:\\s*FC(?:<[^>]*>)?/g, '')
        .replace(/interface\\s+\\w+\\s*{[^}]*}/gs, '')
        .replace(/type\\s+\\w+\\s*=\\s*{[^}]*};?/gs, '')
        .replace(/:\\s*{[^}]+}/g, '') // Remove inline type annotations
        .replace(/:\\s*\\w+(?:<[^>]*>)?(?:\\[\\])?/g, '')
        .replace(/as\\s+\\w+/g, '')
        .replace(/<(\\w+)\\s*\\/>/g, '<$1></$1>')
        .replace(/\\/\\*[\\s\\S]*?\\*\\//g, '') // Remove block comments
        .replace(/\\/\\/.*/g, ''); // Remove line comments
      
      console.log('Cleaned component code:', componentCode);
      
      // Execute the component code
      eval(componentCode);
      
      // Try to find and render the component
      let ComponentToRender = null;
      
      // Look for common component patterns
      const componentNames = [
        'Component', 'ProductPage', 'ProductInfoPage', 'App', 'Page', 
        'Product', 'ProductInfo', 'ProductDetail', 'ProductDetails',
        'Main', 'Home', 'Index'
      ];
      
      for (const name of componentNames) {
        try {
          const component = eval(name);
          if (typeof component === 'function') {
            ComponentToRender = component;
            console.log('Found component:', name);
            break;
          }
        } catch (e) {
          // Component not found, continue searching
        }
      }
      
      if (!ComponentToRender) {
        // Try to find any function that looks like a component
        const componentMatches = componentCode.matchAll(/(?:const|function|let|var)\\s+(\\w+)\\s*=\\s*(?:function\\s*)?\\([^)]*\\)\\s*(?:=>\\s*)?[{(]/g);
        for (const match of componentMatches) {
          const componentName = match[1];
          if (componentName && componentName[0] === componentName[0].toUpperCase()) {
            try {
              ComponentToRender = eval(componentName);
              console.log('Found component by pattern:', componentName);
              break;
            } catch (e) {
              console.error('Could not evaluate component:', componentName);
            }
          }
        }
      }
      
      if (ComponentToRender) {
        console.log('Rendering component:', ComponentToRender);
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(ComponentToRender));
      } else {
        console.error('No component found in code, showing demo');
        // Show a demo product page as fallback
        const DemoProductPage = () => (
          <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <PlaceholderImage text="Product Preview" />
                  <div className="grid grid-cols-4 gap-2 mt-4">
                    {[1,2,3,4].map(i => (
                      <PlaceholderImage key={i} width={100} height={100} text={\`\${i}\`} />
                    ))}
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">Generated Product</h1>
                    <p className="text-gray-600">Your AI-generated product page will appear here</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />)}
                    <span className="text-sm text-gray-500">(2,847 reviews)</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl font-bold">$249</span>
                    <span className="text-xl text-gray-500 line-through">$299</span>
                    <Badge className="bg-red-500 text-white">Save $50</Badge>
                  </div>
                  <div className="space-y-4">
                    <Button className="w-full">
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Add to Cart
                    </Button>
                    <div className="grid grid-cols-3 gap-4">
                      <Card className="p-4 text-center">
                        <Shield className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                        <p className="text-sm font-medium">Premium Quality</p>
                      </Card>
                      <Card className="p-4 text-center">
                        <Truck className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                        <p className="text-sm font-medium">Fast Shipping</p>
                      </Card>
                      <Card className="p-4 text-center">
                        <Package className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                        <p className="text-sm font-medium">Easy Returns</p>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(DemoProductPage));
      }
    } catch (error) {
      console.error('Error rendering component:', error);
      document.getElementById('root').innerHTML = '<div style="padding: 40px; text-align: center; color: #ef4444;"><h3 style="margin-bottom: 8px;">Error rendering component</h3><p style="font-family: monospace; font-size: 14px;">' + error.message + '</p></div>';
    }
  </script>
</body>
</html>
      `;

      // Force iframe refresh by changing key
      setIframeKey(prev => prev + 1);
      
      // Store the HTML in a data URL to avoid CSP issues
      const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(previewHtml)}`;
      
      // Update iframe with new content
      const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
      if (iframe) {
        iframe.src = dataUrl;
      }
    } catch (err) {
      console.error('Preview generation error:', err);
      setError('Failed to generate preview. Please check the code tab for the generated component.');
    } finally {
      setIsLoading(false);
    }
  }, [code]);

  useEffect(() => {
    if (code) {
      generatePreview();
    }
  }, [code, generatePreview]);

  const retry = () => {
    generatePreview();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Generating preview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Preview Error
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          {error}
        </p>
        <Button onClick={retry} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <iframe
        id="preview-iframe"
        key={iframeKey}
        className="w-full h-[600px] border-0 bg-white rounded-lg"
        sandbox="allow-scripts allow-same-origin"
        title="Component Preview"
      />
    </div>
  );
}