'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import { 
  Calendar, 
  Users, 
  GraduationCap, 
  Clock, 
  Shield, 
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Building2,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  }
};

// Feature data
const features = [
  {
    icon: Calendar,
    title: 'Intelligent Scheduling',
    description: 'AI-powered scheduling that automatically detects conflicts and optimizes room allocations.',
    color: 'from-amber-500/20 to-orange-500/20'
  },
  {
    icon: Users,
    title: 'Unified Management',
    description: 'Manage teachers, students, and groups from a single, intuitive dashboard.',
    color: 'from-blue-500/20 to-cyan-500/20'
  },
  {
    icon: Clock,
    title: 'Availability Tracking',
    description: 'Real-time visibility into teacher availability with smart exception handling.',
    color: 'from-emerald-500/20 to-teal-500/20'
  },
  {
    icon: Shield,
    title: 'Role-Based Access',
    description: 'Granular permissions for admins, managers, teachers, and staff members.',
    color: 'from-violet-500/20 to-purple-500/20'
  },
  {
    icon: BarChart3,
    title: 'Insightful Analytics',
    description: 'Track utilization, attendance, and performance with beautiful visualizations.',
    color: 'from-rose-500/20 to-pink-500/20'
  },
  {
    icon: BookOpen,
    title: 'Lesson Planning',
    description: 'Comprehensive lesson management with recurring schedules and resource allocation.',
    color: 'from-amber-500/20 to-yellow-500/20'
  }
];

const stats = [
  { value: '500+', label: 'Schools', suffix: '' },
  { value: '10', label: 'K+', suffix: 'Teachers' },
  { value: '50', label: 'K+', suffix: 'Students' },
  { value: '99.9', label: '%', suffix: 'Uptime' }
];

const testimonials = [
  {
    quote: "ClassHub transformed how we manage our school. What used to take hours now happens in minutes.",
    author: "Sarah Chen",
    role: "Principal, Westfield Academy",
    avatar: "SC"
  },
  {
    quote: "The conflict detection alone has saved us countless scheduling headaches. Absolutely essential.",
    author: "Michael Torres",
    role: "Operations Director, North High",
    avatar: "MT"
  },
  {
    quote: "Finally, a school management system that actually understands how schools work.",
    author: "Emily Watson",
    role: "Department Head, Riverside School",
    avatar: "EW"
  }
];

// Animated counter component
function AnimatedCounter({ value, suffix }: { value: string; suffix: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      className="tabular-nums"
    >
      {value}{suffix}
    </motion.span>
  );
}

// Feature card component
function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ 
        duration: 0.7, 
        delay: index * 0.1,
        ease: [0.22, 1, 0.36, 1]
      }}
      className="group relative"
    >
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl`} />
      <div className="relative h-full p-6 rounded-2xl bg-[#151921]/50 border border-white/5 backdrop-blur-sm hover:border-white/10 transition-all duration-300">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F5A623]/20 to-[#D4891A]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
          <feature.icon className="w-6 h-6 text-[#F5A623]" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
      </div>
    </motion.div>
  );
}

// Testimonial card component
function TestimonialCard({ testimonial, index }: { testimonial: typeof testimonials[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="relative p-6 rounded-2xl bg-gradient-to-b from-[#1A1D26] to-[#151921] border border-white/5"
    >
      <div className="absolute top-4 right-4 text-[#F5A623]/30">
        <Sparkles className="w-6 h-6" />
      </div>
      <p className="text-gray-300 mb-6 leading-relaxed italic">&ldquo;{testimonial.quote}&rdquo;</p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F5A623] to-[#D4891A] flex items-center justify-center text-[#0B0D10] font-semibold text-sm">
          {testimonial.avatar}
        </div>
        <div>
          <p className="text-white font-medium text-sm">{testimonial.author}</p>
          <p className="text-gray-500 text-xs">{testimonial.role}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  
  const smoothY = useSpring(y, { stiffness: 100, damping: 30 });
  const smoothScale = useSpring(scale, { stiffness: 100, damping: 30 });

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Gradient orbs */}
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 -left-64 w-[600px] h-[600px] bg-[#F5A623]/20 rounded-full blur-[120px]" 
          />
          <motion.div 
            animate={{ 
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-1/4 -right-64 w-[500px] h-[500px] bg-[#F5A623]/15 rounded-full blur-[100px]" 
          />
          
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
          
          {/* Noise texture */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
        </div>

        <motion.div 
          style={{ y: smoothY, opacity, scale: smoothScale }}
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20"
        >
          <div className="text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F5A623]/10 border border-[#F5A623]/20 mb-8"
            >
              <Sparkles className="w-4 h-4 text-[#F5A623]" />
              <span className="text-sm text-[#F5A623] font-medium">Now with AI-Powered Scheduling</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              School Management
              <br />
              <span className="bg-gradient-to-r from-[#F5A623] to-[#D4891A] bg-clip-text text-transparent">
                Reimagined
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Streamline your school operations with intelligent scheduling, 
              unified management, and powerful analytics—all in one elegant platform.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/signup">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-[#F5A623] to-[#D4891A] text-[#0B0D10] hover:opacity-90 font-semibold px-8 py-6 text-lg rounded-xl shadow-lg shadow-[#F5A623]/20 transition-all duration-300 hover:shadow-[#F5A623]/30 hover:-translate-y-0.5"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/features">
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-white/10 text-white hover:bg-white/5 px-8 py-6 text-lg rounded-xl"
                >
                  Explore Features
                </Button>
              </Link>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-16 flex flex-wrap items-center justify-center gap-8 text-gray-500"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="text-sm">No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="text-sm">14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="text-sm">Cancel anytime</span>
              </div>
            </motion.div>
          </div>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 p-8 rounded-2xl bg-gradient-to-b from-[#151921]/80 to-[#0B0D10]/80 border border-white/5 backdrop-blur-sm"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white mb-1">
                  <AnimatedCounter value={stat.value} suffix={stat.label} />
                </div>
                <div className="text-gray-500 text-sm">{stat.suffix.replace(/[%+K]/g, '') || 'Active Users'}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2"
          >
            <div className="w-1 h-2 bg-white/40 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-20">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-[#F5A623] text-sm font-medium tracking-wider uppercase mb-4 block"
            >
              Features
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl font-bold text-white mb-6"
            >
              Everything You Need
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-gray-400 text-lg max-w-2xl mx-auto"
            >
              Powerful tools designed specifically for modern schools. 
              From scheduling to analytics, we&apos;ve got you covered.
            </motion.p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-32 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#F5A623]/5 to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-[#F5A623] text-sm font-medium tracking-wider uppercase mb-4 block"
            >
              How It Works
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl font-bold text-white mb-6"
            >
              Get Started in Minutes
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Set Up', desc: 'Create your account and configure your school settings in just a few clicks.' },
              { step: '02', title: 'Add Resources', desc: 'Import your teachers, students, rooms, and groups through our intuitive interface.' },
              { step: '03', title: 'Start Scheduling', desc: 'Let our AI handle the complex scheduling while you focus on what matters.' }
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className="relative text-center"
              >
                <div className="text-7xl font-bold text-[#F5A623]/10 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-gray-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-[#F5A623] text-sm font-medium tracking-wider uppercase mb-4 block"
            >
              Testimonials
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl font-bold text-white mb-6"
            >
              Loved by Educators
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={testimonial.author} testimonial={testimonial} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative p-12 md:p-16 rounded-3xl overflow-hidden text-center"
          >
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#F5A623]/20 via-[#D4891A]/10 to-[#F5A623]/20" />
            <div className="absolute inset-0 bg-[#0B0D10]/80 backdrop-blur-sm" />
            
            {/* Content */}
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Transform Your School?
              </h2>
              <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
                Join hundreds of schools already using ClassHub to streamline their operations 
                and focus on what truly matters—education.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/signup">
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-[#F5A623] to-[#D4891A] text-[#0B0D10] hover:opacity-90 font-semibold px-8 py-6 text-lg rounded-xl shadow-lg shadow-[#F5A623]/20"
                  >
                    Get Started Free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button 
                    size="lg"
                    variant="outline"
                    className="border-white/10 text-white hover:bg-white/5 px-8 py-6 text-lg rounded-xl"
                  >
                    Contact Sales
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Logo Cloud */}
      <section className="py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm mb-8">Trusted by leading educational institutions</p>
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-50">
            {['Westfield Academy', 'North High School', 'Riverside School', 'Lincoln Academy', 'Metro Prep'].map((name) => (
              <div key={name} className="flex items-center gap-2 text-gray-400">
                <Building2 className="w-5 h-5" />
                <span className="font-medium">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
