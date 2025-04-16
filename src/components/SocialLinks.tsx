
import React from 'react';
import { motion } from 'framer-motion';
import { Twitter, Github, Discord, Globe, Instagram, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';

const socials = [
  {
    name: 'Twitter',
    url: 'https://twitter.com/pxbhub',
    icon: <Twitter className="h-5 w-5" />,
    color: 'bg-blue-500 hover:bg-blue-600'
  },
  {
    name: 'Discord',
    url: 'https://discord.gg/pxb',
    icon: <Discord className="h-5 w-5" />,
    color: 'bg-indigo-600 hover:bg-indigo-700'
  },
  {
    name: 'GitHub',
    url: 'https://github.com/pxb',
    icon: <Github className="h-5 w-5" />,
    color: 'bg-gray-800 hover:bg-gray-900'
  },
  {
    name: 'Website',
    url: 'https://pxb.io',
    icon: <Globe className="h-5 w-5" />,
    color: 'bg-green-600 hover:bg-green-700'
  },
  {
    name: 'Instagram',
    url: 'https://instagram.com/pxb',
    icon: <Instagram className="h-5 w-5" />,
    color: 'bg-pink-600 hover:bg-pink-700'
  },
  {
    name: 'YouTube',
    url: 'https://youtube.com/pxb',
    icon: <Youtube className="h-5 w-5" />,
    color: 'bg-red-600 hover:bg-red-700'
  }
];

const SocialLinks = () => {
  return (
    <motion.div 
      className="rounded-xl border border-indigo-900/30 bg-[#0f1628]/80 backdrop-blur-lg p-8 my-16"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h2 
        className="text-2xl md:text-3xl font-bold text-center mb-8
          bg-gradient-to-r from-white via-blue-300 to-blue-400 bg-clip-text text-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        Connect With Us
      </motion.h2>
      
      <div className="flex flex-wrap justify-center gap-4">
        {socials.map((social, index) => (
          <motion.div
            key={social.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 + 0.3 }}
          >
            <Button 
              className={`${social.color} gap-2`}
              asChild
            >
              <a href={social.url} target="_blank" rel="noopener noreferrer">
                {social.icon}
                {social.name}
              </a>
            </Button>
          </motion.div>
        ))}
      </div>
      
      <motion.div
        className="mt-8 text-center text-indigo-300/70 text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        Join our community to get the latest updates and announcements.
      </motion.div>
    </motion.div>
  );
};

export default SocialLinks;
