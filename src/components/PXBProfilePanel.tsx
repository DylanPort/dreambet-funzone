
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Trophy, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@solana/wallet-adapter-react';
import { UserProfile, LeaderboardEntry } from '@/types/pxb';
import { usePXBPoints } from '@/contexts/PXBPointsContext';

export interface PXBProfilePanelProps {
  userProfile: UserProfile;
  publicKey?: any;
  localPxbPoints?: number;
}

const PXBProfilePanel: React.FC<PXBProfilePanelProps> = ({ 
  userProfile, 
  publicKey,
  localPxbPoints 
}) => {
  const { leaderboard, isLeaderboardLoading } = usePXBPoints();
  const [rank, setRank] = React.useState<number | null>(null);
  
  React.useEffect(() => {
    // Find user's rank in the leaderboard
    if (leaderboard && leaderboard.length > 0 && userProfile) {
      const userInLeaderboard = leaderboard.find(
        (entry) => entry.id === userProfile.id
      );
      if (userInLeaderboard) {
        setRank(userInLeaderboard.rank);
      }
    }
  }, [leaderboard, userProfile]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="bg-black/60 border-dream-accent1/30">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center text-center space-y-2 mb-4">
          <Avatar className="w-20 h-20 border-2 border-dream-accent1/30">
            <AvatarImage 
              src={userProfile.avatar || "/lovable-uploads/be6baddd-a67e-4583-b969-a471b47274e1.png"} 
              alt={userProfile.username} 
            />
            <AvatarFallback className="bg-dream-accent1/20 text-lg">
              {userProfile.username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h2 className="text-xl font-semibold">
              {userProfile.displayName || userProfile.username}
            </h2>
            
            <div className="flex justify-center gap-2 mt-1">
              {rank !== null && (
                <Badge variant="outline" className="bg-dream-accent1/10">
                  Rank #{rank}
                </Badge>
              )}
              
              <Badge variant="outline" className="bg-dream-accent2/10">
                {userProfile.points || userProfile.pxbPoints} PXB
              </Badge>
            </div>
          </div>
        </div>
        
        {userProfile.bio && (
          <div className="mt-4 text-sm text-dream-foreground/80 text-center">
            {userProfile.bio}
          </div>
        )}
        
        <div className="mt-6 space-y-3">
          <div className="flex items-center text-sm">
            <CalendarDays className="w-4 h-4 mr-2 text-dream-accent1/70" />
            <span className="text-dream-foreground/60">Joined:</span>
            <span className="ml-auto">{formatDate(userProfile.createdAt)}</span>
          </div>
          
          <div className="flex items-center text-sm">
            <Trophy className="w-4 h-4 mr-2 text-dream-accent1/70" />
            <span className="text-dream-foreground/60">PXB Points:</span>
            <span className="ml-auto font-semibold">
              {localPxbPoints !== undefined 
                ? localPxbPoints.toLocaleString() 
                : userProfile.pxbPoints.toLocaleString()}
            </span>
          </div>
        </div>
        
        <div className="mt-6">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full border-dream-accent1/30 hover:bg-dream-accent1/10"
          >
            <PenLine className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PXBProfilePanel;
