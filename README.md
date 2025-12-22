# PlugIN Base

A SaaS platform to create, manage, and embed AI chatbots on any website [web:12]. Design your agent in the dashboard, then add a simple widget snippet to your site for an instant branded assistant [web:18].

**Live Demo:** https://plug-in-base.vercel.app/  
**Fast Alternative:** https://pluginbase.up.railway.app/

## Features

- Multiple custom chatbots per account with unique configurations
- RAG-ready: ground chatbots on your own content and context
- Embeddable floating widget with instant load
- Session tracking and analytics with geo lookup
- Message logging with response times
- User feedback collection (thumbs up/down)
- Ready-made integration snippets for all major frameworks

## Tech Stack

Built with Next.js, Convex (backend + database), Clerk (auth), Tailwind CSS, and deployed on Vercel [web:15].

## Getting Started

Clone the repository and install dependencies, then configure your environment variables for Convex, Clerk, and OpenAI [web:13]. Run the Convex dev server and Next.js dev server simultaneously [web:16].

The app will be available at `http://localhost:3000`.

## Usage

Sign in and navigate to the Chatbots section to create a new bot [web:12]. Configure the name, welcome message, and optionally attach RAG data sources [web:18]. Test your bot using the built-in chat interface, then grab the embed snippet from the Integration tab and paste it into your website [web:12].

## Roadmap

- One-click deployment for Shopify and WordPress
- Enhanced RAG evaluation tools
- Per-chatbot theme customization
- Rate limiting and billing

## Repository

https://github.com/zoro-zuro/plugIN_base

## License

Currently unlicensed.
