'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { 
  Calendar, Users, Clock, Shield, BarChart3, BookOpen,
  Zap, Globe, Lock, Bell, Search, Filter, CheckCircle2
} from 'lucide-react';

const features = [
  {
    category: 'Scheduling',
    icon: Calendar,
    title: 'Intelligent Scheduling',
    description: 'AI-powered scheduling that automatically detects conflicts and suggests optimal time slots. Never double-book a room or teacher again.',
    highlights: ['Conflict detection', 'Auto-suggestions', 'Drag & drop interface', 'Recurring schedules']
  },
  {
    category: 'Management',
    icon: Users,
    title: 'Unified Resource Management',
    description: 'Manage all your school resources from one place. Teachers, students, rooms, and groups—all connected and organized.',
    highlights: ['Teacher profiles', 'Student groups', 'Room booking', 'Equipment tracking']
  },
  {
    category: 'Availability',
    icon: Clock,
    title: 'Smart Availability',
    description: 'Track teacher availability with intelligent exception handling. Handle time-off, partial availability, and substitutions seamlessly.',
    highlights: ['Weekly schedules', 'Exception handling', 'Substitutions', 'Notifications']
  },
  {
    category: 'Security',
    icon: Shield,
    title: 'Role-Based Access Control',
    description: 'Granular permissions ensure users only access what they need. From admins to teachers, everyone gets the right level of access.',
    highlights: ['4 role levels', 'Custom permissions', 'Audit logs', 'SSO ready']
  },
  {
    category: 'Analytics',
    icon: BarChart3,
    title: 'Powerful Analytics',
    description: 'Gain insights into school operations with beautiful dashboards and reports. Track utilization, attendance, and performance.',
    highlights: ['Real-time dashboards', 'Custom reports', 'Export data', 'Trends analysis']
  },
  {
    category: 'Lessons',
    icon: BookOpen,
    title: 'Lesson Management',
    description: 'Plan, schedule, and track lessons with comprehensive tools. Attach resources, set objectives, and monitor progress.',
    highlights: ['Lesson plans', 'Resource attachments', 'Progress tracking', 'Curriculum mapping']
  }
];

const additionalFeatures = [
  { icon: Zap, title: 'Lightning Fast', desc: 'Built for speed with instant updates' },
  { icon: Globe, title: 'Multi-Campus', desc: 'Manage multiple locations effortlessly' },
  { icon: Lock, title: 'Data Security', desc: 'Enterprise-grade security & encryption' },
  { icon: Bell, title: 'Smart Alerts', desc: 'Timely notifications for all stakeholders' },
  { icon: Search, title: 'Global Search', desc: 'Find anything in seconds' },
  { icon: Filter, title: 'Advanced Filters', desc: 'Powerful filtering for all data' }
];

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const isEven = index % 2 === 0;
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${!isEven ? 'lg:flex-row-reverse' : ''}`}
    >
      <div className={isEven ? 'lg:order-1' : 'lg:order-2'}>
        <span className="text-[#F5A623] text-sm font-medium tracking-wider uppercase mb-4 block">
          {feature.category}
        </span>
        <h3 className="text-3xl font-bold text-white mb-4">{feature.title}</h3>
        <p className="text-gray-400 text-lg mb-6 leading-relaxed">{feature.description}</p>
        <ul className="space-y-3">
          {feature.highlights.map((item) => (
            <li key={item} className="flex items-center gap-3 text-gray-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className={`relative ${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
        <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-[#1A1D26] to-[#151921] border border-white/5 p-8 flex items-center justify-center">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#F5A623]/20 to-[#D4891A]/20 flex items-center justify-center">
            <feature.icon className="w-12 h-12 text-[#F5A623]" />
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#F5A623]/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-[#F5A623]/5 rounded-full blur-3xl" />
      </div>
    </motion.div>
  );
}

export default function FeaturesPage() {
  return (
    <div className="pt-24 pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-24">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-[#F5A623] text-sm font-medium tracking-wider uppercase mb-4 block"
          >
            Features
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl font-bold text-white mb-6"
          >
            Everything You Need
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto"
          >
            Powerful features designed to streamline your school operations 
            and help you focus on what matters most—education.
          </motion.p>
        </div>

        {/* Main Features */}
        <div className="space-y-32">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>

        {/* Additional Features Grid */}
        <div className="mt-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">And Much More</h2>
            <p className="text-gray-400">Additional features that make ClassHub indispensable</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {additionalFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 rounded-xl bg-[#151921]/50 border border-white/5 text-center hover:border-white/10 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-[#F5A623]/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-[#F5A623]" />
                </div>
                <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
