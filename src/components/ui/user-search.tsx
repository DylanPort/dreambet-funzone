
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, X } from 'lucide-react';
import { searchUsers } from '@/services/communityService';
import { UserProfile } from '@/types/community';

interface UserSearchProps {
  onSelectUser?: (user: UserProfile) => void;
  placeholder?: string;
  buttonText?: string;
  showButton?: boolean;
}

export const UserSearch: React.FC<UserSearchProps> = ({ 
  onSelectUser, 
  placeholder = "Search users by username or wallet...",
  buttonText = "View Profile",
  showButton = true
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (query.length >= 2) {
      setIsSearching(true);
      
      timeoutId = setTimeout(async () => {
        try {
          const users = await searchUsers(query);
          setResults(users);
        } catch (error) {
          console.error('Error searching users:', error);
          setResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setResults([]);
      setIsSearching(false);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [query]);
  
  const getInitials = (username: string | null) => {
    if (!username) return 'AN';
    return username.substring(0, 2).toUpperCase();
  };
  
  const formatWalletAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input 
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pr-10 bg-[#191c31] border-indigo-900/30 text-white"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => {
            // Delay hiding results to allow for clicks
            setTimeout(() => setSearchFocused(false), 200);
          }}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          {query ? (
            <button onClick={() => setQuery('')} className="focus:outline-none">
              <X className="h-4 w-4" />
            </button>
          ) : (
            <Search className="h-4 w-4" />
          )}
        </div>
      </div>
      
      {(searchFocused || results.length > 0) && query.length >= 2 && (
        <div className="absolute z-10 mt-1 w-full rounded-md bg-[#191c31] border border-indigo-900/50 shadow-lg">
          {isSearching ? (
            <div className="py-3 px-4 text-gray-400 text-sm">
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="py-3 px-4 text-gray-400 text-sm">
              No users found
            </div>
          ) : (
            <ul className="max-h-56 overflow-y-auto">
              {results.map(user => (
                <li 
                  key={user.id}
                  className="border-b border-indigo-900/30 last:border-0"
                >
                  <div className="p-3 hover:bg-indigo-900/20 flex items-center justify-between">
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-3">
                        <AvatarImage src={user.avatar_url || ''} />
                        <AvatarFallback className="bg-indigo-600">
                          {getInitials(user.username)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-white font-medium">
                          {user.display_name || user.username || 'Anonymous'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatWalletAddress(user.wallet_address)}
                        </p>
                      </div>
                    </div>
                    
                    {showButton && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onSelectUser && onSelectUser(user)}
                        className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/30"
                      >
                        {buttonText}
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
