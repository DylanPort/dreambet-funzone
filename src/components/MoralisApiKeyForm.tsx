
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setMoralisApiKey, hasMoralisApiKey } from '@/services/moralisService';
import { Settings, Check, AlertCircle } from 'lucide-react';

const MoralisApiKeyForm = () => {
  const [apiKey, setApiKey] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    setHasKey(hasMoralisApiKey());
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMoralisApiKey(apiKey);
    setIsOpen(false);
    setHasKey(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`rounded-md flex items-center gap-2 ${hasKey ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30' : 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30'}`}
        >
          {hasKey ? (
            <>
              <Check size={14} />
              <span>Moralis API Set</span>
            </>
          ) : (
            <>
              <Settings size={14} />
              <span>Set Moralis API Key</span>
            </>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md bg-black/90 border border-indigo-900/50 text-white">
        <DialogHeader>
          <DialogTitle>Moralis API Key</DialogTitle>
          <DialogDescription className="text-gray-400">
            Enter your Moralis API key to enable token image fetching
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              placeholder="Enter your Moralis API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="bg-black/50 border-indigo-900/50"
            />
          </div>
          
          <div className="p-4 border border-blue-900/50 bg-blue-500/10 rounded-md">
            <div className="flex gap-2 items-start">
              <AlertCircle className="text-blue-400 mt-0.5" size={16} />
              <div className="text-xs text-blue-300">
                <p className="font-semibold">Get your Moralis API key:</p>
                <ol className="list-decimal ml-4 mt-1 space-y-1">
                  <li>Go to <a href="https://admin.moralis.io/web3apis" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">Moralis Web3 API Dashboard</a></li>
                  <li>Sign up or log in to your account</li>
                  <li>Create a new API key or use an existing one</li>
                  <li>Copy the API key and paste it here</li>
                </ol>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
              Save API Key
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MoralisApiKeyForm;
