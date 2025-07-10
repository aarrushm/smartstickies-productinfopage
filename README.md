# Smart Tag Generator

A powerful Next.js application that uses Vercel's v0 AI to generate beautiful, responsive product info pages. Simply describe your product, and let AI create a professional product page component with modern design patterns.

## ✨ Features

- **AI-Powered Generation**: Uses Vercel's v0 API to generate React components
- **Modern UI**: Built with Next.js, Tailwind CSS, and shadcn/ui
- **Responsive Design**: Generated components are mobile-first and responsive
- **Code & Preview**: View generated code and safe preview side-by-side
- **Copy-Paste Ready**: Generated components are ready to use in your projects
- **Professional Layouts**: Includes product images, descriptions, features, pricing, and CTAs

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A v0 API key from [v0.dev](https://v0.dev)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smart-tag
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` and add your v0 API key:
   ```env
   V0_API_KEY=your_actual_v0_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 How to Use

1. **Describe Your Product**: Enter a detailed description of the product info page you want to create
2. **Generate**: Click "Generate Product Page" to create your component
3. **View Results**: Switch between Preview and Code tabs to see your generated component
4. **Copy & Use**: Copy the generated React code and use it in your projects

### Example Prompts

- "A premium wireless headphone with noise cancellation, 30-hour battery life, and premium leather design. Include product images, feature highlights, customer reviews section, and pricing tiers."
- "Modern smartwatch for fitness enthusiasts with heart rate monitoring, GPS tracking, water resistance, and mobile app integration. Include feature comparison table and different color options."
- "Eco-friendly water bottle with temperature control, smart hydration tracking, and sustainable materials. Show environmental impact statistics and subscription options."

## 📁 Project Structure

```
smart-tag/
├── src/
│   ├── app/
│   │   ├── api/generate/route.ts    # v0 API integration
│   │   ├── page.tsx                 # Main application page
│   │   ├── layout.tsx               # App layout
│   │   └── globals.css              # Global styles
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components
│   │   ├── code-viewer.tsx          # Code display component
│   │   └── preview-renderer.tsx     # Preview component
│   └── lib/
│       └── utils.ts                 # Utility functions
├── public/                          # Static assets
├── .env.local.example              # Environment variables template
└── README.md                       # Project documentation
```

## 🔧 API Configuration

This project uses the Vercel v0 API to generate React components. To get started:

1. Visit [v0.dev](https://v0.dev)
2. Sign up for an account
3. Navigate to your API settings
4. Generate an API key
5. Add the key to your `.env.local` file

## 🛠 Technologies Used

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Modern UI component library
- **React Hook Form**: Form handling and validation
- **Zod**: Schema validation
- **Lucide React**: Icon library
- **Vercel v0 API**: AI component generation

## 📝 Generated Components

The AI generates React components that include:

- Professional product page layouts
- Responsive design with Tailwind CSS
- Modern UI patterns and components
- Product image galleries
- Feature highlights and descriptions
- Pricing sections and call-to-action buttons
- Customer review sections
- Mobile-optimized designs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Vercel v0](https://v0.dev) - AI component generation
- [Next.js](https://nextjs.org) - React framework
- [Tailwind CSS](https://tailwindcss.com) - CSS framework
- [shadcn/ui](https://ui.shadcn.com) - UI components

## 💡 Tips

- Be specific in your product descriptions for better results
- Include details about layout, features, and design preferences
- Mention specific sections you want (reviews, pricing, features, etc.)
- The more context you provide, the better the generated component will be

---

Built with ❤️ using Vercel's v0 AI and modern web technologies.
