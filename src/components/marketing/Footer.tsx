'use client';

import React from 'react';
import Link from 'next/link';
import { Twitter, Linkedin, Github, Globe } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-black/80 py-24 border-t border-white/5 relative z-10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-12 relative z-20">
        {/* Logo & Info */}
        <div className="col-span-2 space-y-6">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center glow">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <span className="text-2xl font-bold tracking-tight text-white group-hover:text-primary transition-colors">
              SmartStore
            </span>
          </Link>
          <p className="text-gray-400 max-w-xs leading-relaxed">
            The intelligent operating system for modern commerce. Scale faster with AI-driven automation.
          </p>
          <div className="flex space-x-4">
            <a href="#" className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="#" className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Product Column */}
        <div>
          <h4 className="font-bold text-white mb-6 uppercase text-sm tracking-widest">Product</h4>
          <ul className="space-y-4">
            <li><Link href="#features" className="text-gray-400 hover:text-white transition-colors">Features</Link></li>
            <li><Link href="#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link></li>
            <li><Link href="/demo" className="text-gray-400 hover:text-white transition-colors">Live Demo</Link></li>
            <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Updates</Link></li>
          </ul>
        </div>

        {/* Company Column */}
        <div>
          <h4 className="font-bold text-white mb-6 uppercase text-sm tracking-widest">Company</h4>
          <ul className="space-y-4">
            <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">About</Link></li>
            <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Careers</Link></li>
            <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Blog</Link></li>
            <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
          </ul>
        </div>

        {/* Resources & Legal Column */}
        <div>
          <h4 className="font-bold text-white mb-6 uppercase text-sm tracking-widest">Legal</h4>
          <ul className="space-y-4">
            <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Privacy</Link></li>
            <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Use</Link></li>
            <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Cookie Policy</Link></li>
            <li><Link href="/api/health" className="flex items-center space-x-2 text-emerald-400 hover:text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Systems Online</span>
            </Link></li>
          </ul>
        </div>
      </div>
      
      {/* Footer Bottom */}
      <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/5 text-center flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
        <p>© 2024 SmartStore SaaS. Built for the future of commerce.</p>
        <div className="flex items-center space-x-1 mt-4 md:mt-0 group cursor-default">
          <Globe className="w-4 h-4" />
          <span>Global Platform</span>
        </div>
      </div>
    </footer>
  );
};
