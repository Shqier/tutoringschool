'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const plans = [
  {
    name: 'Starter',
    description: 'Perfect for small schools getting started',
    price: 49,
    period: 'month',
    features: [
      'Up to 100 students',
      'Up to 10 teachers',
      'Basic scheduling',
      'Email support',
      'Standard reports',
      '1 campus location'
    ],
    cta: 'Start Free Trial',
    href: '/signup',
    popular: false
  },
  {
    name: 'Professional',
    description: 'Ideal for growing schools',
    price: 99,
    period: 'month',
    features: [
      'Up to 500 students',
      'Up to 50 teachers',
      'Advanced scheduling with AI',
      'Priority support',
      'Advanced analytics',
      'Up to 3 campus locations',
      'Custom integrations',
      'API access'
    ],
    cta: 'Start Free Trial',
    href: '/signup',
    popular: true
  },
  {
    name: 'Enterprise',
    description: 'For large institutions with complex needs',
    price: null,
    period: 'custom',
    features: [
      'Unlimited students',
      'Unlimited teachers',
      'Custom AI models',
      '24/7 dedicated support',
      'Custom reporting',
      'Unlimited campuses',
      'White-label options',
      'SSO & advanced security',
      'Custom development'
    ],
    cta: 'Contact Sales',
    href: '/contact',
    popular: false
  }
];

const faqs = [
  {
    q: 'Can I switch plans anytime?',
    a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.'
  },
  {
    q: 'Is there a free trial?',
    a: 'Absolutely! Every plan comes with a 14-day free trial. No credit card required to start.'
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit cards, bank transfers for annual plans, and purchase orders for Enterprise customers.'
  },
  {
    q: 'Can I get a refund?',
    a: 'We offer a 30-day money-back guarantee. If you\'re not satisfied, contact us for a full refund.'
  }
];

export default function PricingPage() {
  return (
    <div className="pt-24 pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-[#F5A623] text-sm font-medium tracking-wider uppercase mb-4 block"
          >
            Pricing
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl font-bold text-white mb-6"
          >
            Simple, Transparent Pricing
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto"
          >
            Choose the plan that fits your school. All plans include a 14-day free trial.
          </motion.p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className={`relative rounded-2xl p-8 ${
                plan.popular 
                  ? 'bg-gradient-to-b from-[#F5A623]/20 to-[#D4891A]/10 border-2 border-[#F5A623]/50' 
                  : 'bg-[#151921]/50 border border-white/5'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#F5A623] text-[#0B0D10] text-sm font-medium">
                    <Sparkles className="w-4 h-4" />
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-gray-400 text-sm">{plan.description}</p>
              </div>
              
              <div className="mb-8">
                {plan.price ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-white">${plan.price}</span>
                    <span className="text-gray-400">/{plan.period}</span>
                  </div>
                ) : (
                  <div className="text-3xl font-bold text-white">Custom</div>
                )}
              </div>
              
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link href={plan.href} className="block">
                <Button 
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-[#F5A623] to-[#D4891A] text-[#0B0D10] hover:opacity-90' 
                      : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                  }`}
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 rounded-xl bg-[#151921]/30 border border-white/5"
              >
                <h3 className="text-white font-semibold mb-2">{faq.q}</h3>
                <p className="text-gray-400">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <p className="text-gray-400 mb-4">Still have questions?</p>
          <Link href="/contact">
            <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
              Contact Our Team
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
