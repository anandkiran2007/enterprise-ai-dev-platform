'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

const plans = [
    {
        name: 'Hobby',
        price: '$0',
        period: '/month',
        description: 'Perfect for side projects and learning.',
        features: [
            '1 Active Project',
            'Local Execution Only',
            'Public GitHub Repos',
            'Standard AI Models (GPT-3.5)',
            'Community Support'
        ],
        missing: [
            'Cloud Sandbox Execution',
            'Private Repos',
            'gpt-4-turbo Access',
            'Priority Support'
        ],
        cta: 'Current Plan',
        popular: false,
        gradient: 'from-gray-700 to-gray-600'
    },
    {
        name: 'Pro',
        price: '$29',
        period: '/month',
        description: 'For professional developers and teams.',
        features: [
            'Unlimited Projects',
            'Cloud Sandbox Execution',
            'Private GitHub Repos',
            'Premium AI Models (GPT-4)',
            'Email Support',
            'Team Collaboration'
        ],
        missing: [
            'VPC Deployment',
            'SLA',
            'Custom Agent Training'
        ],
        cta: 'Upgrade to Pro',
        popular: true,
        gradient: 'from-blue-500 to-purple-600'
    },
    {
        name: 'Enterprise',
        price: 'Custom',
        period: '',
        description: 'For large organizations requiring security.',
        features: [
            'Everything in Pro',
            'VPC / On-Premise Deployment',
            'SLA Guarantees',
            'Custom Agent Training',
            'Audit Logs',
            'Dedicated Success Manager'
        ],
        missing: [],
        cta: 'Contact Sales',
        popular: false,
        gradient: 'from-pink-500 to-rose-600'
    }
];

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-4">
                        Simple, Transparent Pricing
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Choose the perfect plan for your development needs. Scale up as you grow.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`relative rounded-2xl bg-gray-900 border ${plan.popular ? 'border-purple-500 shadow-2xl shadow-purple-900/20' : 'border-gray-800'} p-8 flex flex-col`}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 right-0 -mt-3 -mr-3 px-4 py-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-xs font-bold uppercase tracking-wide">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                                <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                                <div className="flex items-baseline">
                                    <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                                    <span className="text-gray-500 ml-2">{plan.period}</span>
                                </div>
                            </div>

                            <div className="flex-grow mb-8 space-y-4">
                                {plan.features.map((feature) => (
                                    <div key={feature} className="flex items-start">
                                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-900/50 flex items-center justify-center mt-0.5">
                                            <Check className="w-3 h-3 text-green-400" />
                                        </div>
                                        <span className="ml-3 text-gray-300 text-sm">{feature}</span>
                                    </div>
                                ))}
                                {plan.missing.map((feature) => (
                                    <div key={feature} className="flex items-start opacity-50">
                                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center mt-0.5">
                                            <X className="w-3 h-3 text-gray-500" />
                                        </div>
                                        <span className="ml-3 text-gray-500 text-sm">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                className={`w-full py-3 rounded-lg font-bold text-sm transition-all transform hover:scale-105 ${plan.popular
                                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                                        : 'bg-white text-black hover:bg-gray-200'
                                    }`}
                            >
                                {plan.cta}
                            </button>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <Link href="/" className="text-sm text-gray-500 hover:text-white underline">
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
