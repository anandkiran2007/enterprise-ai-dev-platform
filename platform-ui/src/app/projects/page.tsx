'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Project {
    id: string;
    name: string;
    last_updated: string;
}

import { UserButton, useAuth } from "@clerk/nextjs";

export default function ProjectsPage() {
    const { userId } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const uid = userId || undefined;
        const headers: Record<string, string> = {};
        if (uid) headers['x-user-id'] = uid;

        fetch('http://localhost:3000/api/projects', { headers })
            .then(res => res.json())
            .then(data => {
                if (!Array.isArray(data)) throw new Error("Invalid response");
                const sorted = data.sort((a: Project, b: Project) =>
                    new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
                );
                setProjects(sorted);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load projects", err);
                setLoading(false);
            });
    }, [userId]);

    const handleProjectClick = async (e: React.MouseEvent, projectId: string) => {
        e.preventDefault();
        const uid = userId || undefined;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (uid) headers['x-user-id'] = uid;

        try {
            await fetch('http://localhost:3000/api/project/load', {
                method: 'POST',
                headers,
                body: JSON.stringify({ projectId })
            });
            window.location.href = '/'; // Navigate to dashboard
        } catch (err) {
            console.error("Failed to load project", err);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                            My Projects
                        </h1>
                        <p className="text-gray-400 mt-2">Manage your AI-powered development workspaces</p>
                    </div>


                    <div className="flex items-center gap-4">
                        <Link href="/" className="bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-md font-medium flex items-center">
                            <span className="mr-2">+</span> New Project
                        </Link>
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </header>

                {loading ? (
                    <div className="text-center text-gray-500 animate-pulse">Loading projects...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project, i) => (
                            <motion.div
                                key={project.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <div
                                    onClick={(e) => handleProjectClick(e, project.id)}
                                    className="block group cursor-pointer bg-gray-900 border border-gray-800 hover:border-purple-500/50 transition-colors rounded-xl p-6"
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-xl font-semibold text-white">{project.name}</h3>
                                        <span className="text-gray-500 group-hover:text-purple-400">Folder</span>
                                    </div>
                                    <p className="text-sm text-gray-400 mb-4">ID: {project.id.substring(0, 8)}...</p>
                                    <div className="flex items-center text-xs text-gray-500 border-t border-gray-800 pt-4">
                                        <span className="mr-1">Clock</span>
                                        Last active: {new Date(project.last_updated).toLocaleString()}
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {/* Empty State if no projects */}
                        {projects.length === 0 && (
                            <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-800 rounded-xl">
                                <p className="text-gray-500 text-xl">No projects found.</p>
                                <p className="text-gray-600 mt-2">Create one to get started!</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
