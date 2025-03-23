
import React, { useState, useEffect } from 'react';
import { BookOpen, ExternalLink, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const Footer = () => {
  const socialLinks = [
    {
      name: 'Twitter',
      url: 'https://twitter.com/PumpXBounty',
      icon: <img src="/lovable-uploads/39b0c51d-de1f-43a1-9851-8fd9ead38b3c.png" className="h-5 w-5" alt="Twitter" />
    },
    {
      name: 'Telegram',
      url: 'https://t.me/PumpXBounty',
      icon: <img src="/lovable-uploads/81fb2dc7-59da-424e-8569-4202a7967758.png" className="h-5 w-5" alt="Telegram" />
    },
    {
      name: 'GitBook',
      url: 'https://pumpxbounty.gitbook.io/pumpxbounty',
      icon: <BookOpen className="h-5 w-5" />
    }
  ];

  return (
    <footer className="mt-20 border-t border-white/10 bg-gradient-to-t from-dream-background/80 to-transparent backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start">
            <div className="relative flex items-center">
              <img 
                src="/lovable-uploads/b202d0ff-b32c-4588-9d6a-772fb5cbbe0b.png" 
                alt="PumpXBounty" 
                className="h-8 md:h-10"
              />
            </div>
            
            <p className="mt-2 text-gray-400 text-center md:text-left max-w-md">
              <span className="text-dream-accent3">Building</span> the future of <span className="text-dream-accent2">tokenized assets</span> and <span className="text-dream-accent1">rewards</span> for the Solana community.
            </p>
          </div>
          
          <div className="flex flex-col items-center gap-4">
            <div className="flex space-x-4">
              <TooltipProvider>
                {socialLinks.map((link) => (
                  <Tooltip key={link.name}>
                    <TooltipTrigger asChild>
                      <a 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-dream-card/50 p-2 rounded-full hover:bg-dream-accent3/20 transition-all duration-300 hover:scale-110 flex items-center justify-center group relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-dream-accent1/20 to-dream-accent3/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
                        {link.icon}
                        <span className="sr-only">{link.name}</span>
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="flex items-center">
                        {link.name} <ExternalLink className="ml-1 h-3 w-3" />
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
            
            <a 
              href="https://pumpxbounty.gitbook.io/pumpxbounty"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-300 text-sm"
            >
              <BookOpen className="h-4 w-4" />
              Documentation
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} PumpXBounty. All rights reserved.
          </p>
          
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <motion.div
              initial={{ opacity: 0.5 }}
              whileHover={{ 
                opacity: 1, 
                scale: 1.05, 
                transition: { duration: 0.2 } 
              }}
              className="bg-dream-card/30 py-1 px-3 rounded-full flex items-center backdrop-blur-sm"
            >
              <span>Community Powered</span>
            </motion.div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
