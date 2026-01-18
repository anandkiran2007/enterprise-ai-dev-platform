'use client';

import { Book, Code, Terminal, Cpu } from 'lucide-react';

export default function DocsPage() {
    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans">
            <div className="max-w-4xl mx-auto">
                <header className="mb-12">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-4">
                        Platform Documentation
                    </h1>
                    <p className="text-gray-400 text-lg">Comprehensive guides for the AgentForge Enterprise Platform.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-xl hover:border-blue-500/50 transition-colors cursor-pointer group">
                        <div className="p-3 bg-blue-500/10 rounded-lg w-fit mb-4 group-hover:bg-blue-500/20">
                            <Terminal className="text-blue-400" size={24} />
                        </div>
                        <h3 className="text-xl font-semibold mb-2 text-gray-200">Getting Started</h3>
                        <p className="text-gray-400 text-sm">Learn how to create your first project, configure your environment, and deploy your first agent-generated app.</p>
                    </div>

                    <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-xl hover:border-purple-500/50 transition-colors cursor-pointer group">
                        <div className="p-3 bg-purple-500/10 rounded-lg w-fit mb-4 group-hover:bg-purple-500/20">
                            <Cpu className="text-purple-400" size={24} />
                        </div>
                        <h3 className="text-xl font-semibold mb-2 text-gray-200">Agent Workflow</h3>
                        <p className="text-gray-400 text-sm">Deep dive into the collaborative architecture of our multi-agent system (Product Owner, UX, SDE, QA).</p>
                    </div>

                    <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-xl hover:border-green-500/50 transition-colors cursor-pointer group">
                        <div className="p-3 bg-green-500/10 rounded-lg w-fit mb-4 group-hover:bg-green-500/20">
                            <Code className="text-green-400" size={24} />
                        </div>
                        <h3 className="text-xl font-semibold mb-2 text-gray-200">API Reference</h3>
                        <p className="text-gray-400 text-sm">Detailed documentation for the Backend API, WebSocket events, and integration webhooks.</p>
                    </div>

                    <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-xl hover:border-yellow-500/50 transition-colors cursor-pointer group">
                        <div className="p-3 bg-yellow-500/10 rounded-lg w-fit mb-4 group-hover:bg-yellow-500/20">
                            <Book className="text-yellow-400" size={24} />
                        </div>
                        <h3 className="text-xl font-semibold mb-2 text-gray-200">Best Practices</h3>
                        <p className="text-gray-400 text-sm">Guidelines for writing effective prompts, managing credentials, and optimizing cost.</p>
                    </div>
                </div>

                <div className="mt-12 p-6 bg-gray-800/30 border border-gray-800 rounded-xl">
                    <h3 className="text-lg font-semibold text-white mb-2">Need more help?</h3>
                    <p className="text-gray-400 text-sm mb-4">Our support team is available 24/7 for Enterprise customers.</p>
                    <button className="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors">Contact Support</button>
                </div>
            </div>
        </div>
    );
}
