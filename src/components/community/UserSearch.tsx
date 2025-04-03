
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, User } from 'lucide-react';
import { searchUsers } from '@/services/communityService';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

interface UserSearchProps {
  onSelect?: (userId: string) => void;
  variant?: 'default' | 'compact';
  className?: string;
}

const UserSearch: React.FC<UserSearchProps> = ({ 
  onSelect, 
  variant = 'default',
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length >= 2) {
        setIsSearching(true);
        const users = await searchUsers(query);
        setResults(users);
        setShowResults(true);
        setIsSearching(false);
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 500);
    
    return () => clearTimeout(delayDebounceFn);
  }, [query]);
  
  const handleSelect = (userId: string) => {
    setShowResults(false);
    setQuery('');
    
    if (onSelect) {
      onSelect(userId);
    } else {
      navigate(`/community/profile/${userId}`);
    }
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.length >= 2) {
      navigate(`/community/search?q=${encodeURIComponent(query)}`);
      setShowResults(false);
    }
  };
  
  const getInitials = (username: string) => {
    return username?.substring(0, 2).toUpperCase() || 'AN';
  };
  
  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <form onSubmit={handleSearch} className="relative">
        <Input
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`pr-10 bg-[#191c31] border-indigo-900/30 placeholder-gray-500 text-white ${
            variant === 'compact' ? 'h-9 text-sm' : ''
          }`}
        />
        <Button 
          type="submit"
          variant="ghost" 
          size="icon" 
          className="absolute right-0 top-0 h-full text-gray-400"
        >
          <Search className="h-5 w-5" />
        </Button>
      </form>
      
      {showResults && (
        <div className="absolute z-20 mt-1 w-full bg-[#1a1d2d] shadow-lg rounded-md border border-indigo-900/50 max-h-80 overflow-y-auto">
          {isSearching ? (
            <div className="p-3 text-center text-gray-400">
              Searching...
            </div>
          ) : results.length > 0 ? (
            results.map((user) => (
              <div
                key={user.id}
                onClick={() => handleSelect(user.id)}
                className="p-2 hover:bg-indigo-900/20 cursor-pointer flex items-center"
              >
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src={user.avatar_url || ''} alt={user.username} />
                  <AvatarFallback className="bg-indigo-600">{getInitials(user.username || '')}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-white">
                    {user.display_name || user.username || 'Anonymous'}
                  </div>
                  {user.username && user.username !== user.display_name && (
                    <div className="text-xs text-gray-400">@{user.username}</div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-3 text-center text-gray-400">
              No users found
            </div>
          )}
          
          {results.length > 0 && (
            <div className="p-2 border-t border-indigo-900/30">
              <Link 
                to={`/community/search?q=${encodeURIComponent(query)}`}
                className="block text-center text-indigo-400 hover:text-indigo-300 text-sm"
                onClick={() => setShowResults(false)}
              >
                View all results
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserSearch;
