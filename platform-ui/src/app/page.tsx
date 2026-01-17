
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchMemory, submitIdea, approveRequirements, configureGitHub, ProjectMemory } from '@/lib/api';
import { Activity, Code, Cpu, Layers, Settings, Github } from 'lucide-react';

export default function Dashboard() {
  const [memory, setMemory] = useState<ProjectMemory | null>(null);
  const [error, setError] = useState<boolean>(false);
  const [newIdea, setNewIdea] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [configStatus, setConfigStatus] = useState('');

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubToken) return;
    setConfigStatus('Saving...');
    const success = await configureGitHub(githubToken);
    if (success) {
      setConfigStatus('Saved!');
      setTimeout(() => {
        setShowConfig(false);
        setConfigStatus('');
      }, 1000);
    } else {
      setConfigStatus('Failed to save.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIdea.trim()) return;

    setIsSubmitting(true);
    const success = await submitIdea(newIdea);
    if (success) {
      setNewIdea('');
      alert('Project idea submitted to agents!');
    } else {
      alert('Failed to submit idea.');
    }
    setIsSubmitting(false);
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      const data = await fetchMemory();
      if (data) {
        setMemory(data);
        setError(false);
      } else {
        setError(true);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (error && !memory) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-950 text-white gap-4">
        <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse"></div>
        <p>Connection Lost. Retrying...</p>
        <p className="text-sm text-gray-500">Ensure backend is running on port 3000</p>
      </div>
    );
  }

  if (!memory) return <div className="flex items-center justify-center h-screen bg-gray-950 text-white">Connecting to Agent Platform...</div>;

  const agents = ['product_owner', 'ux_designer', 'backend_sde', 'frontend_sde', 'qa_engineer', 'devops'];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8 font-sans relative">
      {/* Config Modal */}
      <AnimatePresence>
        {showConfig && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-gray-900 border border-gray-800 p-6 rounded-xl w-full max-w-md"
            >
              <div className="flex items-center gap-2 mb-4 text-white">
                <Github size={24} />
                <h2 className="text-xl font-bold">Configure Cloud Storage</h2>
              </div>
              <p className="text-gray-400 mb-6 text-sm">Enter your GitHub Personal Access Token to enable cloud sync.</p>

              <form onSubmit={handleConfigSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">GITHUB TOKEN</label>
                  <input
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="ghp_..."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowConfig(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    {configStatus || 'Save Configuration'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <header className="flex flex-col gap-8 mb-12">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              {memory.project_name || 'AgentForge'} <span className="text-gray-500 font-normal text-sm ml-2">Enterprise Edition</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">Project ID: <span className="font-mono text-xs">{memory.project_id}</span></p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowConfig(true)}
              className="p-2 rounded-full bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              title="Settings"
            >
              <Settings size={20} />
            </button>
            <div className="bg-gray-900 px-4 py-2 rounded-full border border-gray-800 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm font-medium">{memory.current_phase.toUpperCase()} PHASE</span>
            </div>
          </div>
        </div>

        {/* Pipeline Visualizer */}
        <div className="w-full bg-gray-900/50 border border-gray-800 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
          <div className="relative flex justify-between items-center z-10">
            {['ideation', 'requirements', 'design', 'development', 'testing', 'deployment'].map((phase, index) => {
              const phases = ['ideation', 'requirements', 'design', 'development', 'testing', 'deployment'];
              const currentIdx = phases.indexOf(memory.current_phase);
              const isCompleted = index < currentIdx;
              const isActive = index === currentIdx;

              return (
                <div key={phase} className="flex flex-col items-center gap-3 relative flex-1">
                  {/* Connector Line */}
                  {index !== 0 && (
                    <div className={`absolute top-4 right-1/2 w-full h-0.5 -z-10 ${index <= currentIdx ? 'bg-blue-500' : 'bg-gray-800'}`}></div>
                  )}

                  <motion.div
                    initial={false}
                    animate={{
                      scale: isActive ? 1.2 : 1,
                      backgroundColor: isCompleted || isActive ? '#3B82F6' : '#1F2937',
                      borderColor: isActive ? '#60A5FA' : isCompleted ? '#3B82F6' : '#374151'
                    }}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${isActive ? 'shadow-[0_0_15px_rgba(59,130,246,0.5)]' : ''}`}
                  >
                    {isCompleted ? (
                      <div className="w-2.5 h-2.5 bg-white rounded-full" />
                    ) : isActive ? (
                      <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                    ) : (
                      <div className="w-2.5 h-2.5 bg-gray-600 rounded-full" />
                    )}
                  </motion.div>
                  <span className={`text-xs font-medium uppercase tracking-wider ${isActive ? 'text-blue-400' : isCompleted ? 'text-gray-300' : 'text-gray-600'}`}>
                    {phase}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* New Project Input */}
      <section className="mb-12 max-w-2xl mx-auto space-y-4">
        <form onSubmit={handleSubmit} className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
          <div className="relative bg-gray-900 border border-gray-800 rounded-xl p-2 flex gap-2">
            <input
              type="text"
              value={newIdea}
              onChange={(e) => setNewIdea(e.target.value)}
              placeholder="Describe your software idea (e.g. 'Build a Tetris game')..."
              className="flex-1 bg-transparent border-none text-white focus:ring-0 px-4 py-3 outline-none"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? <Activity className="animate-spin" size={18} /> : <div className="flex items-center gap-2"><div style={{ borderLeft: '6px solid white', borderTop: '4px solid transparent', borderBottom: '4px solid transparent' }}></div>Start Project</div>}
            </button>
          </div>
        </form>

        {/* Approval Banner */}
        <AnimatePresence>
          {memory && memory.agent_context_pointers['product_owner']?.currently_working_on === 'Waiting for User Approval' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-yellow-900/30 border border-yellow-700/50 p-4 rounded-xl flex items-center justify-between"
            >
              <div className="flex items-center gap-3 text-yellow-200">
                <Activity className="animate-pulse" />
                <div>
                  <h3 className="font-semibold">Review Required</h3>
                  <p className="text-sm opacity-80">Product Owner has defined requirements. Please approve to proceed.</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  const success = await approveRequirements();
                  if (success) alert('Requirements Approved! Team is proceeding.');
                }}
                className="bg-yellow-600 hover:bg-yellow-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Approve & Continue
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Agent Grid */}
        <section className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map((role) => {
            const context = memory.agent_context_pointers[role];
            const isWorking = context && context.currently_working_on && context.currently_working_on !== 'idle';

            return (
              <motion.div
                key={role}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-6 rounded-xl border ${isWorking ? 'border-blue-500/50 bg-blue-900/10' : 'border-gray-800 bg-gray-900'} backdrop-blur-sm transition-colors`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isWorking ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-500'}`}>
                      <Cpu size={20} />
                    </div>
                    <h3 className="font-semibold capitalize">{role.replace('_', ' ')}</h3>
                  </div>
                  {isWorking && (
                    <span className="text-xs text-blue-400 animate-pulse">Processing...</span>
                  )}
                </div>
                <div className="h-12 flex items-center">
                  <p className="text-sm text-gray-400">
                    {isWorking ? context.currently_working_on : 'Waiting for tasks...'}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </section>

        {/* Live Feed / Artifacts */}
        <section className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4 text-purple-400">
              <Layers size={20} />
              <h2 className="font-semibold text-white">Living Documents</h2>
            </div>
            <div className="space-y-3">
              {Object.entries(memory.living_documents).map(([key, doc]: [string, any]) => (
                <div key={key} className="flex items-center gap-3 p-3 rounded bg-gray-800/50 hover:bg-gray-800 transition-colors cursor-pointer border border-transparent hover:border-gray-700">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <div>
                    <div className="text-sm font-medium text-gray-200 capitalize">{key.replace('_', ' ')}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[200px]">{doc.summary || 'No summary'}</div>
                  </div>
                </div>
              ))}
              {Object.keys(memory.living_documents).length === 0 && (
                <p className="text-sm text-gray-600 italic">No artifacts generated yet.</p>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
