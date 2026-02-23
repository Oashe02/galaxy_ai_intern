'use client';

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ImageIcon, Video, Box, Sparkles, Edit3, FileBox, Maximize2 } from "lucide-react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, ClerkLoaded, ClerkLoading } from "@clerk/nextjs";

const FEATURES = [
  {
    title: "Generate",
    items: [
      { title: "AI Image Generation", icon: ImageIcon, color: "text-blue-400" },
      { title: "AI Video Generation", icon: Video, color: "text-red-400" },
      { title: "AI 3D Generation", icon: Box, color: "text-yellow-400" },
    ]
  },
  {
    title: "Edit",
    items: [
      { title: "AI Image Enhancements", icon: Sparkles, color: "text-green-400" },
      { title: "AI Video Enhancements", icon: Maximize2, color: "text-purple-400" },
    ]
  },
  {
    title: "Customize",
    items: [
      { title: "AI Finetuning", icon: Edit3, color: "text-orange-400" },
      { title: "File Management", icon: FileBox, color: "text-cyan-400" },
    ]
  }
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const active = isOpen || isHovered;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 150);
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-20 flex items-center px-8 bg-black/80 backdrop-blur-md border-b border-white/15 z-[100]">
      <div className="flex-1 flex items-center">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center group-hover:bg-zinc-200 transition-colors">
            <span className="text-black font-black text-xl italic leading-none ml-0.5">K</span>
          </div>
        </Link>
      </div>

      <nav className="hidden md:flex items-center gap-8">
        <Link href="/workflow" className="text-[16px] font-medium text-white hover:text-white/80 transition-colors tracking-tight">App</Link>
        
        <div 
          className="relative" 
          ref={dropdownRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-1.5 cursor-pointer group px-4 py-2 rounded-xl transition-all border ${active ? 'bg-white/15 border-white/20 text-white' : 'bg-transparent border-transparent text-white hover:bg-white/10'}`}
          >
            <span className="text-[16px] font-medium tracking-tight">Features</span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${active ? 'rotate-180 text-white' : 'text-zinc-400'}`} />
          </button>

          <div 
            className={`absolute top-full left-1/2 mt-5 w-[840px] bg-white rounded-[32px] p-10 flex gap-12 text-black shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] transition-all duration-300 origin-top pointer-events-auto
              ${active 
                ? 'opacity-100 visible scale-100 translate-y-0 -translate-x-1/2' 
                : 'opacity-0 invisible scale-95 -translate-y-4 -translate-x-1/2'
              }`}
          >
            {FEATURES.map((section) => (
              <div key={section.title} className="flex-1 space-y-8">
                <h2 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.25em]">{section.title}</h2>
                <div className="space-y-7">
                  {section.items.map((item) => (
                    <div key={item.title} className="group cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center group-hover:bg-zinc-200 transition-colors border border-zinc-200/50">
                          <item.icon className={`w-5 h-5 ${item.color} opacity-90`} />
                        </div>
                        <h3 className="text-[15px] font-medium tracking-tight transition-colors group-hover:text-purple-600">{item.title}</h3>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Link href="#" className="text-[16px] font-medium text-white hover:text-white/80 transition-colors tracking-tight">Image</Link>
        <Link href="#" className="text-[16px] font-medium text-white hover:text-white/80 transition-colors tracking-tight">Video</Link>
        <Link href="#" className="text-[16px] font-medium text-white hover:text-white/80 transition-colors tracking-tight">Upscaler</Link>
        
        <nav className="hidden lg:flex items-center gap-8">
          <Link href="#" className="text-[16px] font-medium text-white hover:text-white/80 transition-colors tracking-tight">API</Link>
          <Link href="#" className="text-[16px] font-medium text-white hover:text-white/80 transition-colors tracking-tight">Pricing</Link>
          <Link href="#" className="text-[16px] font-medium text-white hover:text-white/80 transition-colors tracking-tight">Enterprise</Link>
        </nav>
      </nav>

      <div className="flex-1 flex items-center justify-end gap-4">
        <ClerkLoaded>
          <SignedOut>
            <SignUpButton mode="modal">
              <button className="px-6 py-2.5 text-[14px] font-medium text-black bg-white rounded-xl hover:bg-zinc-200 transition-all tracking-tight cursor-pointer">
                Sign up for free
              </button>
            </SignUpButton>
            <SignInButton mode="modal">
              <button className="px-6 py-2.5 text-[14px] font-medium text-white bg-white/10 border border-white/10 rounded-xl hover:bg-white/20 transition-all tracking-tight cursor-pointer">
                Log in
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href="/workflow" className="px-4 py-2 text-[14px] font-medium text-white/70 hover:text-white transition-colors mr-2">
              Dashboard
            </Link>
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9 ring-2 ring-white/20 hover:ring-white/40 transition-all",
                }
              }}
            />
          </SignedIn>
        </ClerkLoaded>
        <ClerkLoading>
          <div className="w-24 h-10 rounded-xl bg-white/10 animate-pulse" />
        </ClerkLoading>
      </div>
    </header>
  );
}
