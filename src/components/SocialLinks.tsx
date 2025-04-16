
import React from 'react';
import { motion } from 'framer-motion';
import { Twitter, Globe, GitHub, ExternalLink } from 'lucide-react';

interface SocialLink {
  name: string;
  url: string;
  icon: React.ReactNode;
  color: string;
}

const SocialLinks = () => {
  const socialLinks: SocialLink[] = [
    {
      name: 'Twitter',
      url: 'https://twitter.com/pumpxbounty',
      icon: <Twitter className="h-5 w-5" />,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      name: 'Website',
      url: 'https://pumpxbounty.com',
      icon: <Globe className="h-5 w-5" />,
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      name: 'Discord',
      url: 'https://discord.gg/pumpxbounty',
      icon: <img src="/lovable-uploads/81fb2dc7-59da-424e-8569-4202a7967758.png" className="h-5 w-5" alt="Discord" />,
      color: 'bg-indigo-500 hover:bg-indigo-600'
    },
    {
      name: 'GitHub',
      url: 'https://github.com/pumpxbounty',
      icon: <GitHub className="h-5 w-5" />,
      color: 'bg-gray-700 hover:bg-gray-800'
    }
  ];

  return (
    <div className="w-full max-w-xl mx-auto">
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {socialLinks.map((link, index) => (
          <motion.a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${link.color} p-4 rounded-lg flex flex-col items-center justify-center text-white transition-all transform shadow-lg hover:scale-105`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.2 }}
            whileHover={{ y: -5 }}
          >
            <div className="bg-white/10 p-3 rounded-full mb-2">
              {link.icon}
            </div>
            <span className="text-sm font-medium">{link.name}</span>
            <div className="flex items-center text-xs mt-1 opacity-70">
              <ExternalLink className="h-3 w-3 mr-1" />
              <span>Visit</span>
            </div>
          </motion.a>
        ))}
      </motion.div>
    </div>
  );
};

export default SocialLinks;
