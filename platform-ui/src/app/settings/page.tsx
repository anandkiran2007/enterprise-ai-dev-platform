'use client';

import { useState, useEffect } from 'react';
import { UserButton, useAuth } from "@clerk/nextjs";
import { Github, Save, Shield, Key, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { configureGitHub } from '@/lib/api';

export default function SettingsPage() {
    const { userId } = useAuth();
    const [githubToken, setGithubToken] = useState('');
    const [configStatus, setConfigStatus] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleConfigSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!githubToken) return;

        setIsLoading(true);
        setConfigStatus('Saving...');
        const uid = userId || undefined;

        const success = await configureGitHub(githubToken, uid);

        if (success) {
            setConfigStatus('Saved successfully!');
            setTimeout(() => setConfigStatus(''), 3000);
        } else {
            setConfigStatus('Failed to save configuration.');
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans">
            <div className="max-w-4xl mx-auto">
                <header className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-200 to-gray-400">
                            Settings
                        </h1>
                        <p className="text-gray-400 mt-2">Manage your account and integrations</p>
                    </div>
                    <UserButton afterSignOutUrl="/" />
                </header>

                <div className="space-y-8">
                    {/* Integrations Section */}
                    <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-500/10 rounded-lg">
                                <Key className="text-purple-400" size={24} />
                            </div>
                            <h2 className="text-xl font-semibold">Integrations & API Keys</h2>
                        </div>

                        <div className="max-w-xl">
                            <form onSubmit={handleConfigSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                                        <Github size={16} />
                                        GitHub Personal Access Token
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            value={githubToken}
                                            onChange={(e) => setGithubToken(e.target.value)}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-4 pr-12 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            placeholder="ghp_..."
                                        />
                                        <div className="absolute right-3 top-3 text-gray-500">
                                            <Shield size={18} />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Required for the agents to push code to your repositories.
                                        Token needs <code>repo</code> scope.
                                    </p>
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={isLoading || !githubToken}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Save size={18} />
                                        )}
                                        {configStatus || 'Save Configuration'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </section>

                    {/* Subscription Section */}
                    <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-green-500/10 rounded-lg">
                                <CreditCard className="text-green-400" size={24} />
                            </div>
                            <h2 className="text-xl font-semibold">Subscription & Billing</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { name: 'Hobby', price: '$0', current: true },
                                { name: 'Pro', price: '$29', features: ['GPT-4 Access', 'Private Repos'], popular: true },
                                { name: 'Enterprise', price: 'Custom', features: ['VPC', 'SLA'] }
                            ].map((plan) => (
                                <div key={plan.name} className={`p-4 rounded-lg border ${plan.current ? 'border-green-500 bg-green-900/10' : 'border-gray-800 bg-gray-950'} flex flex-col`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-white">{plan.name}</h3>
                                        {plan.popular && <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Popular</span>}
                                    </div>
                                    <div className="text-2xl font-bold mb-4">{plan.price}<span className="text-sm font-normal text-gray-500">/mo</span></div>

                                    {plan.current ? (
                                        <button disabled className="mt-auto w-full py-2 bg-green-600/20 text-green-400 rounded-lg font-medium text-sm border border-green-500/50">Current Plan</button>
                                    ) : (
                                        <Link href="/pricing" className="mt-auto block text-center w-full py-2 bg-white text-black hover:bg-gray-200 rounded-lg font-medium text-sm transition-colors">
                                            {plan.price === 'Custom' ? 'Contact Sales' : 'Upgrade'}
                                        </Link>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* About Section */}
                    <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <h2 className="text-lg font-semibold mb-4 text-gray-300">About AgentForge</h2>
                        <div className="text-sm text-gray-400 space-y-2">
                            <p>Version: <span className="text-gray-200 font-mono">1.2.0-enterprise</span></p>
                            <p>Agent Core: <span className="text-green-400">Online</span> (v2.1)</p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
