
  const phases = [
    {
      id: 'phase1',
      title: 'Phase 1: Foundation',
      status: 'complete',
      description: 'Establishing the PXB platform and token distribution',
      timeframe: `${formatDate(phaseDates.phase1.start)} - ${formatDate(phaseDates.phase1.end)}`,
      milestones: [
        { id: 1, text: 'Platform MVP Launch', complete: true, date: '2025-01-15' },
        { id: 2, text: 'Complete Token Minting', complete: true, date: '2025-02-10' },
        { id: 3, text: 'Initial User Onboarding', complete: true, date: '2025-03-05' },
        { id: 4, text: 'Basic Trading Functionality', complete: true, date: '2025-04-01' }
      ],
      icon: <Rocket className="w-6 h-6" />
    },
    {
      id: 'phase2',
      title: 'Phase 2: Growth',
      status: isCurrentPhase('phase2') ? 'in-progress' : getDateStatus(phaseDates.phase2.start) === 'future' ? 'upcoming' : 'complete',
      description: 'Expanding platform capabilities and user base',
      timeframe: `${formatDate(phaseDates.phase2.start)} - ${formatDate(phaseDates.phase2.end)}`,
      milestones: [
        { id: 1, text: 'Enhanced Trading Simulator', complete: false, date: '2025-04-25' },
        { id: 2, text: '$POINT Pool Integration', complete: false, date: '2025-05-15' },
        { id: 3, text: 'Community Engagement Programs', complete: false, date: '2025-04-30' },
        { id: 4, text: 'Partner Integrations', complete: false, date: '2025-05-10' }
      ],
      icon: <Zap className="w-6 h-6" />
    },
    {
      id: 'phase3',
      title: 'Phase 3: Expansion',
      status: isCurrentPhase('phase3') ? 'in-progress' : getDateStatus(phaseDates.phase3.start) === 'future' ? 'upcoming' : 'complete',
      description: 'Scaling the ecosystem and introducing advanced features',
      timeframe: `${formatDate(phaseDates.phase3.start)} - ${formatDate(phaseDates.phase3.end)}`,
      milestones: [
        { id: 1, text: 'Cross-chain Paper Trading', complete: false, date: '2025-05-28' },
        { id: 2, text: 'Leverage Trading Simulator', complete: false, date: '2025-06-05' },
        { id: 3, text: 'Advanced Analytics Dashboard', complete: false, date: '2025-06-10' },
        { id: 4, text: 'DEX Simulator', complete: false, date: '2025-06-15' }
      ],
      icon: <Star className="w-6 h-6" />
    },
    {
      id: 'phase4',
      title: 'Phase 4: Maturity',
      status: 'upcoming',
      description: 'Establishing PXB as a key player in the ecosystem',
      timeframe: 'To Be Announced',
      milestones: [
        { id: 1, text: 'Marketing and Expansion', complete: false, date: 'TBA' },
        { id: 2, text: 'Financial Products and Ads', complete: false, date: 'TBA' },
        { id: 3, text: 'Enterprise Partnerships', complete: false, date: 'TBA' },
        { id: 4, text: 'Ecosystem Fund Launch', complete: false, date: 'TBA' }
      ],
      icon: <Trophy className="w-6 h-6" />
    }
  ];
