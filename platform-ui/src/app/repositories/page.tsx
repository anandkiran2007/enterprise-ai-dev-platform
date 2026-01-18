'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Github, ExternalLink, GitBranch, Clock, Lock } from 'lucide-react';
import { useAuth } from "@clerk/nextjs";

interface Repository {
    project_id: string;
    project_name: string;
    repo_url?: string;
    repo_name?: string;
    last_updated: string;
    private: boolean;
}

export default function RepositoriesPage() {
    const { userId } = useAuth();
    const [repos, setRepos] = useState<Repository[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const uid = userId || undefined;
        const headers: Record<string, string> = {};
        if (uid) headers['x-user-id'] = uid;

        fetch('http://localhost:4000/api/projects', { headers })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    // Extract repos from projects that have them
                    const projectRepos = data
                        .filter((p: any) => p.github_repo || p.repo_url) // Check different possible schema locations
                        .map((p: any) => ({
                            project_id: p.id,
                            project_name: p.name,
                            repo_url: p.github_repo?.full_url || p.repo_url,
                            repo_name: p.github_repo?.name || p.name.toLowerCase().replace(/\s+/g, '-'),
                            last_updated: p.last_updated,
                            private: true // Default to private for enterprise
                        }));
                    setRepos(projectRepos);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load repos", err);
                setLoading(false);
            });
    }, [userId]);

    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Github size={32} />
                            Repositories
                        </h1>
                        <p className="text-gray-400 mt-2">Manage connected codebase integrations</p>
                    </div>
                    <div className="bg-gray-900 px-4 py-2 rounded-lg border border-gray-800 text-sm font-mono text-gray-400">
                        Total Repos: <span className="text-white font-bold ml-1">{repos.length}</span>
                    </div>
                </header>

                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-500">Syncing with GitHub...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {repos.map((repo, i) => (
                            <motion.div
                                key={repo.project_id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-gray-900/50 border border-gray-800 hover:border-gray-700 rounded-xl p-5 flex items-center justify-between group transition-all duration-200"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gray-800 rounded-lg group-hover:bg-gray-700 transition-colors">
                                        <Lock size={20} className="text-yellow-500" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-semibold text-lg text-blue-400 hover:underline cursor-pointer">
                                                <a href={repo.repo_url} target="_blank" rel="noopener noreferrer">{repo.repo_name}</a>
                                            </h3>
                                            <span className="text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-400">Private</span>
                                        </div>
                                        <p className="text-sm text-gray-500">Linked to project: <span className="text-gray-300">{repo.project_name}</span></p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col items-end text-sm text-gray-500">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <GitBranch size={14} />
                                            <span>main</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs">
                                            <Clock size={12} />
                                            <span>{new Date(repo.last_updated).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <a
                                        href={repo.repo_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                                    >
                                        <ExternalLink size={20} />
                                    </a>
                                </div>
                            </motion.div>
                        ))}

                        {repos.length === 0 && (
                            <div className="text-center py-20 bg-gray-900/30 border-2 border-dashed border-gray-800 rounded-xl">
                                <Github size={48} className="mx-auto text-gray-700 mb-4" />
                                <h3 className="text-xl font-medium text-gray-400">No repositories found</h3>
                                <p className="text-gray-600 mt-2">Repositories are created automatically when you start a project.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
