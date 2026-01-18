'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Folder, Github, Book, Settings, LogOut, Code, Activity, Layers } from 'lucide-react';
import { UserButton } from "@clerk/nextjs";

export function Sidebar() {
    const pathname = usePathname();

    const navItems = [
        { name: 'Dashboard', href: '/', icon: Home },
        { name: 'Projects', href: '/projects', icon: Folder },
        { name: 'Repositories', href: '/repositories', icon: Github },
        { name: 'Documentation', href: '/docs', icon: Book },
        { name: 'Settings', href: '/settings', icon: Settings },
    ];

    return (
        <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-screen fixed left-0 top-0 overflow-y-auto z-50">
            {/* Header */}
            <div className="p-6 border-b border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg shadow-lg shadow-blue-500/20">
                        <Activity className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className="font-bold text-white tracking-tight">AgentForge</h1>
                        <p className="text-xs text-blue-400 font-medium tracking-wider">ENTERPRISE AI</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
                <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 mt-2">Platform</p>
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
                                ? 'bg-blue-600/10 text-white border border-blue-600/20'
                                : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                }`}
                        >
                            <Icon size={20} className={`${isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-white'}`} />
                            <span className="font-medium">{item.name}</span>
                            {isActive && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]"></div>
                            )}
                        </Link>
                    );
                })}

                <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 mt-8">Workspace</p>
                <div className="px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700/50 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <div>
                        <p className="text-xs text-gray-300 font-medium">System Status</p>
                        <p className="text-[10px] text-green-400">All Systems Operational</p>
                    </div>
                </div>
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-gray-800 bg-gray-900/50">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
                    <UserButton afterSignOutUrl="/" showName={true} appearance={{
                        elements: {
                            userButtonBox: "flex flex-row-reverse",
                            userButtonOuterIdentifier: "text-white font-medium text-sm ml-2",
                            avatarBox: "w-8 h-8 ring-2 ring-gray-700"
                        }
                    }} />
                </div>
            </div>
        </aside>
    );
}
