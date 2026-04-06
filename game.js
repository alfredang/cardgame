// ============================================================
// Queue Number: The Great Allocation — Game Engine
// ============================================================
// Contains: card data, deck building, state machine, resolution,
// scoring, disruption effects, and UI rendering helpers.
// ============================================================

// ============================================================
// CARD DATA
// ============================================================

const CATEGORIES = ['housing', 'education', 'healthcare', 'transport', 'leisure', 'finance', 'food', 'tech'];

const OPPORTUNITY_CARDS = [
  // PRIORITY resolution (14 cards)
  { id: 'opp_01', name: 'Public Housing Unit', category: 'housing', resolution: 'priority', slots: 1, reward: { milestone: true, time: 0, score: 0 }, consolation: { time: 1 }, description: 'First in line gets the keys. Others get a consolation token.' },
  { id: 'opp_02', name: 'Clinic Appointment', category: 'healthcare', resolution: 'priority', slots: 1, reward: { milestone: true, time: 0, score: 0 }, consolation: { time: 1 }, description: 'Earliest queue number secures the slot.' },
  { id: 'opp_03', name: 'School Enrollment', category: 'education', resolution: 'priority', slots: 2, reward: { milestone: true, time: 0, score: 0 }, consolation: { time: 0 }, description: 'Two seats available. Lowest numbers get in.' },
  { id: 'opp_04', name: 'Bus Pass Renewal', category: 'transport', resolution: 'priority', slots: 1, reward: { milestone: false, time: 2, score: 1 }, consolation: { time: 0 }, description: 'Quick queue — first served gets a time bonus and a point.' },
  { id: 'opp_05', name: 'Gym Membership', category: 'leisure', resolution: 'priority', slots: 1, reward: { milestone: true, time: 0, score: 0 }, consolation: { time: 1 }, description: 'Limited spots at the community gym.' },
  { id: 'opp_06', name: 'Bank Account Opening', category: 'finance', resolution: 'priority', slots: 1, reward: { milestone: true, time: 1, score: 0 }, consolation: { time: 0 }, description: 'First customer of the day gets priority service.' },
  { id: 'opp_07', name: 'Fresh Market Stall', category: 'food', resolution: 'priority', slots: 2, reward: { milestone: false, time: 2, score: 2 }, consolation: { time: 1 }, description: 'Early birds get the best produce.' },
  { id: 'opp_08', name: 'Tech Workshop', category: 'tech', resolution: 'priority', slots: 1, reward: { milestone: true, time: 0, score: 0 }, consolation: { time: 1 }, description: 'Limited seating for the coding bootcamp.' },
  { id: 'opp_09', name: 'Parking Permit', category: 'transport', resolution: 'priority', slots: 1, reward: { milestone: false, time: 1, score: 2 }, consolation: { time: 0 }, description: 'Only one permit left this month.' },
  { id: 'opp_10', name: 'Library Card', category: 'education', resolution: 'priority', slots: 2, reward: { milestone: true, time: 0, score: 0 }, consolation: { time: 0 }, description: 'Two premium memberships available.' },
  { id: 'opp_11', name: 'Community Garden Plot', category: 'food', resolution: 'priority', slots: 1, reward: { milestone: true, time: 0, score: 0 }, consolation: { time: 1 }, description: 'A prized garden plot opens up.' },
  { id: 'opp_12', name: 'Dental Checkup', category: 'healthcare', resolution: 'priority', slots: 1, reward: { milestone: false, time: 2, score: 1 }, consolation: { time: 0 }, description: 'Walk-in slot — first come, first served.' },
  { id: 'opp_13', name: 'Childcare Slot', category: 'housing', resolution: 'priority', slots: 1, reward: { milestone: true, time: 0, score: 0 }, consolation: { time: 1 }, description: 'Precious childcare opening in the neighborhood.' },
  { id: 'opp_14', name: 'WiFi Hotspot Pass', category: 'tech', resolution: 'priority', slots: 2, reward: { milestone: false, time: 1, score: 1 }, consolation: { time: 0 }, description: 'Free high-speed passes for the first two.' },

  // AUCTION resolution (13 cards)
  { id: 'opp_15', name: 'Premium Apartment', category: 'housing', resolution: 'auction', slots: 1, reward: { milestone: true, time: 0, score: 2 }, consolation: { time: 0 }, description: 'Highest bidder wins this luxury unit.' },
  { id: 'opp_16', name: 'Private Tutor', category: 'education', resolution: 'auction', slots: 1, reward: { milestone: true, time: 0, score: 1 }, consolation: { time: 0 }, description: 'Invest time to secure the best tutor.' },
  { id: 'opp_17', name: 'Specialist Doctor', category: 'healthcare', resolution: 'auction', slots: 1, reward: { milestone: true, time: 0, score: 1 }, consolation: { time: 0 }, description: 'The renowned specialist sees the highest bidder.' },
  { id: 'opp_18', name: 'First Class Ticket', category: 'transport', resolution: 'auction', slots: 1, reward: { milestone: false, time: 3, score: 2 }, consolation: { time: 0 }, description: 'Bid high for the premium travel experience.' },
  { id: 'opp_19', name: 'VIP Concert Pass', category: 'leisure', resolution: 'auction', slots: 1, reward: { milestone: true, time: 0, score: 0 }, consolation: { time: 0 }, description: 'The front row goes to the highest bidder.' },
  { id: 'opp_20', name: 'Investment Seminar', category: 'finance', resolution: 'auction', slots: 1, reward: { milestone: true, time: 1, score: 0 }, consolation: { time: 0 }, description: 'Pay time to learn from the best.' },
  { id: 'opp_21', name: 'Gourmet Restaurant', category: 'food', resolution: 'auction', slots: 1, reward: { milestone: true, time: 0, score: 0 }, consolation: { time: 0 }, description: 'The exclusive table goes to the top bidder.' },
  { id: 'opp_22', name: 'Startup Incubator', category: 'tech', resolution: 'auction', slots: 1, reward: { milestone: true, time: 0, score: 2 }, consolation: { time: 0 }, description: 'Invest heavily to join the incubator program.' },
  { id: 'opp_23', name: 'Penthouse Viewing', category: 'housing', resolution: 'auction', slots: 1, reward: { milestone: false, time: 0, score: 4 }, consolation: { time: 0 }, description: 'A rare chance at the top floor.' },
  { id: 'opp_24', name: 'Executive Coaching', category: 'finance', resolution: 'auction', slots: 1, reward: { milestone: true, time: 0, score: 0 }, consolation: { time: 0 }, description: 'Premium career coaching for the highest bidder.' },
  { id: 'opp_25', name: 'Art Exhibition Pass', category: 'leisure', resolution: 'auction', slots: 1, reward: { milestone: true, time: 0, score: 0 }, consolation: { time: 0 }, description: 'Exclusive opening night requires investment.' },
  { id: 'opp_26', name: 'Research Grant', category: 'education', resolution: 'auction', slots: 1, reward: { milestone: true, time: 2, score: 0 }, consolation: { time: 0 }, description: 'Fund your research with the highest bid.' },
  { id: 'opp_27', name: 'Organic Farm Box', category: 'food', resolution: 'auction', slots: 1, reward: { milestone: false, time: 1, score: 2 }, consolation: { time: 0 }, description: 'Premium weekly delivery for the top bidder.' },

  // BALLOT resolution (13 cards)
  { id: 'opp_28', name: 'BTO Flat Ballot', category: 'housing', resolution: 'ballot', slots: 1, reward: { milestone: true, time: 0, score: 1 }, consolation: { time: 1 }, description: 'Everyone enters the draw. Luck decides.' },
  { id: 'opp_29', name: 'Scholarship Draw', category: 'education', resolution: 'ballot', slots: 1, reward: { milestone: true, time: 1, score: 0 }, consolation: { time: 0 }, description: 'A random student gets the scholarship.' },
  { id: 'opp_30', name: 'Vaccine Lottery', category: 'healthcare', resolution: 'ballot', slots: 2, reward: { milestone: true, time: 0, score: 0 }, consolation: { time: 1 }, description: 'Two lucky draws from the waiting list.' },
  { id: 'opp_31', name: 'ERP Rebate', category: 'transport', resolution: 'ballot', slots: 1, reward: { milestone: false, time: 3, score: 0 }, consolation: { time: 0 }, description: 'Random rebate for one lucky commuter.' },
  { id: 'opp_32', name: 'Festival Ticket', category: 'leisure', resolution: 'ballot', slots: 2, reward: { milestone: true, time: 0, score: 0 }, consolation: { time: 0 }, description: 'Two tickets drawn from the ballot pool.' },
  { id: 'opp_33', name: 'Tax Rebate', category: 'finance', resolution: 'ballot', slots: 1, reward: { milestone: false, time: 2, score: 1 }, consolation: { time: 0 }, description: 'One lucky taxpayer gets a windfall.' },
  { id: 'opp_34', name: 'Food Voucher Bundle', category: 'food', resolution: 'ballot', slots: 2, reward: { milestone: false, time: 1, score: 1 }, consolation: { time: 0 }, description: 'Two winners drawn for premium food vouchers.' },
  { id: 'opp_35', name: 'Hackathon Spot', category: 'tech', resolution: 'ballot', slots: 1, reward: { milestone: true, time: 0, score: 0 }, consolation: { time: 1 }, description: 'Random selection from all applicants.' },
  { id: 'opp_36', name: 'Community Center Slot', category: 'leisure', resolution: 'ballot', slots: 1, reward: { milestone: true, time: 0, score: 0 }, consolation: { time: 0 }, description: 'Drawn at random from the waitlist.' },
  { id: 'opp_37', name: 'Renovation Grant', category: 'housing', resolution: 'ballot', slots: 1, reward: { milestone: false, time: 0, score: 3 }, consolation: { time: 1 }, description: 'One household wins the renovation lottery.' },
  { id: 'opp_38', name: 'Health Screening', category: 'healthcare', resolution: 'ballot', slots: 2, reward: { milestone: false, time: 1, score: 1 }, consolation: { time: 0 }, description: 'Free screenings drawn by lot.' },
  { id: 'opp_39', name: 'Cloud Credits', category: 'tech', resolution: 'ballot', slots: 1, reward: { milestone: true, time: 1, score: 0 }, consolation: { time: 0 }, description: 'One lucky developer gets free cloud credits.' },
  { id: 'opp_40', name: 'Study Abroad Slot', category: 'education', resolution: 'ballot', slots: 1, reward: { milestone: true, time: 0, score: 1 }, consolation: { time: 0 }, description: 'Ballot determines who goes overseas.' },
];

// Queue Cards: values 1-7, five of each = 35 cards
const QUEUE_CARDS = [];
const QUEUE_NAMES = [
  { value: 1, name: 'VIP Pass', effect: 'Lowest queue number. Best priority positioning.' },
  { value: 2, name: 'Early Bird', effect: 'Very low queue number. Strong priority advantage.' },
  { value: 3, name: 'Morning Rush', effect: 'Low queue number. Good position in line.' },
  { value: 4, name: 'Midday Queue', effect: 'Middle of the pack. Average positioning.' },
  { value: 5, name: 'Afternoon Slot', effect: 'Higher queue number. Moderate auction weight.' },
  { value: 6, name: 'Evening Line', effect: 'High queue number. Better for ballot weight.' },
  { value: 7, name: 'Last Call', effect: 'Highest number. Maximum ballot tickets but worst priority.' },
];

for (let copy = 0; copy < 5; copy++) {
  for (const q of QUEUE_NAMES) {
    QUEUE_CARDS.push({
      id: `q_${String(QUEUE_CARDS.length + 1).padStart(2, '0')}`,
      type: 'queue',
      value: q.value,
      name: q.name,
      effect: q.effect,
    });
  }
}

const MILESTONE_CARDS = [
  { id: 'ms_01', name: 'Homeowner', category: 'housing', condition: 'Collect 2+ housing opportunities', points: 4, setBonus: 'housing' },
  { id: 'ms_02', name: 'Scholar', category: 'education', condition: 'Collect 2+ education opportunities', points: 4, setBonus: 'education' },
  { id: 'ms_03', name: 'Wellness Champion', category: 'healthcare', condition: 'Collect 2+ healthcare opportunities', points: 4, setBonus: 'healthcare' },
  { id: 'ms_04', name: 'Commuter Pro', category: 'transport', condition: 'Collect 2+ transport opportunities', points: 3, setBonus: 'transport' },
  { id: 'ms_05', name: 'Social Butterfly', category: 'leisure', condition: 'Collect 2+ leisure opportunities', points: 3, setBonus: 'leisure' },
  { id: 'ms_06', name: 'Investor', category: 'finance', condition: 'Collect 2+ finance opportunities', points: 4, setBonus: 'finance' },
  { id: 'ms_07', name: 'Foodie', category: 'food', condition: 'Collect 2+ food opportunities', points: 3, setBonus: 'food' },
  { id: 'ms_08', name: 'Tech Maven', category: 'tech', condition: 'Collect 2+ tech opportunities', points: 4, setBonus: 'tech' },
  { id: 'ms_09', name: 'Diversifier', category: 'special', condition: 'Collect from 4+ different categories', points: 5, setBonus: null },
  { id: 'ms_10', name: 'Time Lord', category: 'special', condition: 'End with 8+ Time tokens', points: 5, setBonus: null },
  { id: 'ms_11', name: 'Hoarder', category: 'special', condition: 'Win 5+ total opportunities', points: 6, setBonus: null },
  { id: 'ms_12', name: 'Lucky Draw', category: 'special', condition: 'Win 2+ ballot opportunities', points: 4, setBonus: null },
  { id: 'ms_13', name: 'High Roller', category: 'special', condition: 'Win 2+ auction opportunities', points: 4, setBonus: null },
  { id: 'ms_14', name: 'Queue Master', category: 'special', condition: 'Win 3+ priority opportunities', points: 5, setBonus: null },
  { id: 'ms_15', name: 'Minimalist', category: 'special', condition: 'Win exactly 3 opportunities total', points: 4, setBonus: null },
  { id: 'ms_16', name: 'Renaissance Person', category: 'special', condition: 'Collect from 5+ different categories', points: 7, setBonus: null },
  { id: 'ms_17', name: 'Thrifty Planner', category: 'special', condition: 'Spend 3 or less Time total on auctions', points: 4, setBonus: null },
  { id: 'ms_18', name: 'Quick Starter', category: 'special', condition: 'Win an opportunity in rounds 1-2', points: 3, setBonus: null },
  { id: 'ms_19', name: 'Closer', category: 'special', condition: 'Win an opportunity in the final round', points: 3, setBonus: null },
  { id: 'ms_20', name: 'Balanced Life', category: 'special', condition: 'Have milestone + 5+ Time at end', points: 5, setBonus: null },
  { id: 'ms_21', name: 'Neighborhood Hero', category: 'housing', condition: 'Collect 3 housing opportunities', points: 6, setBonus: 'housing' },
  { id: 'ms_22', name: 'Lifelong Learner', category: 'education', condition: 'Collect 3 education opportunities', points: 6, setBonus: 'education' },
  { id: 'ms_23', name: 'Wellness Guru', category: 'healthcare', condition: 'Collect 3 healthcare opportunities', points: 6, setBonus: 'healthcare' },
  { id: 'ms_24', name: 'Digital Native', category: 'tech', condition: 'Collect 3 tech opportunities', points: 6, setBonus: 'tech' },
  { id: 'ms_25', name: 'Gourmand', category: 'food', condition: 'Collect 3 food opportunities', points: 5, setBonus: 'food' },
];

const DISRUPTION_CARDS = [
  { id: 'dis_01', name: 'System Outage', effect: 'skip_lowest', description: 'The player with the lowest queue number this round gets no reward.' },
  { id: 'dis_02', name: 'Time Tax', effect: 'time_tax', description: 'All players lose 1 Time token.' },
  { id: 'dis_03', name: 'Double Reward', effect: 'double_reward', description: 'All opportunity rewards are doubled this round.' },
  { id: 'dis_04', name: 'Queue Shuffle', effect: 'reverse_priority', description: 'Priority is reversed — highest queue number wins first.' },
  { id: 'dis_05', name: 'Overtime', effect: 'bonus_time', description: 'All players gain 1 Time token.' },
  { id: 'dis_06', name: 'Lucky Day', effect: 'extra_ballot_slot', description: 'Ballot opportunities have +1 slot this round.' },
  { id: 'dis_07', name: 'Budget Cuts', effect: 'auction_surcharge', description: 'Auction winners pay 1 extra Time.' },
  { id: 'dis_08', name: 'Express Lane', effect: 'express_lane', description: 'The first opportunity resolves with +1 slot.' },
  { id: 'dis_09', name: 'Maintenance', effect: 'remove_first', description: 'The first opportunity card is discarded without resolving.' },
  { id: 'dis_10', name: 'Windfall', effect: 'windfall', description: 'Players who don\'t win any opportunity this round gain 2 Time.' },
  { id: 'dis_11', name: 'Red Tape', effect: 'commit_limit', description: 'Each player can only commit to 1 opportunity this round.' },
  { id: 'dis_12', name: 'Flash Sale', effect: 'free_auction', description: 'Auction costs are halved (round down) this round.' },
  { id: 'dis_13', name: 'Power Surge', effect: 'no_consolation', description: 'No consolation rewards this round.' },
  { id: 'dis_14', name: 'Community Spirit', effect: 'community', description: 'All players who committed at least 1 card gain 1 Time.' },
  { id: 'dis_15', name: 'Peak Hour', effect: 'peek_hour', description: 'All queue numbers are treated as 1 higher (max 7).' },
  { id: 'dis_16', name: 'Off Peak', effect: 'off_peak', description: 'All queue numbers are treated as 1 lower (min 1).' },
  { id: 'dis_17', name: 'Wildcard', effect: 'wildcard', description: 'All ballot tickets count double.' },
  { id: 'dis_18', name: 'Surge Pricing', effect: 'surge', description: 'All auctions require a minimum bid of 2.' },
  { id: 'dis_19', name: 'Bonus Round', effect: 'bonus_round', description: 'All score rewards are +1 this round.' },
  { id: 'dis_20', name: 'Clear Skies', effect: 'none', description: 'No disruption this round. Smooth sailing!' },
];


// ============================================================
// DECK BUILDING & SHUFFLING
// ============================================================

function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function createShuffledDecks() {
  return {
    opportunityDeck: shuffleArray(OPPORTUNITY_CARDS),
    queueDeck: shuffleArray(QUEUE_CARDS),
    milestoneDeck: shuffleArray(MILESTONE_CARDS),
    disruptionDeck: shuffleArray(DISRUPTION_CARDS),
  };
}

function dealCards(deck, count) {
  return deck.splice(0, count);
}


// ============================================================
// RESOLUTION LOGIC (pure functions)
// ============================================================

/**
 * Priority Resolution: lowest queue number wins.
 * @param {Array} entries - [{ playerId, cardValue, timestamp }]
 * @param {number} slots - how many winners
 * @param {object} disruption - active disruption if any
 * @returns {{ winners: string[], losers: string[] }}
 */
function resolvePriority(entries, slots, disruption) {
  if (entries.length === 0) return { winners: [], losers: [] };

  let sorted;
  if (disruption && disruption.effect === 'reverse_priority') {
    // Reverse: highest wins
    sorted = [...entries].sort((a, b) => {
      let aVal = a.cardValue;
      let bVal = b.cardValue;
      return bVal - aVal || a.timestamp - b.timestamp;
    });
  } else {
    // Normal: lowest wins
    sorted = [...entries].sort((a, b) => {
      let aVal = a.cardValue;
      let bVal = b.cardValue;
      if (disruption && disruption.effect === 'peek_hour') {
        aVal = Math.min(aVal + 1, 7);
        bVal = Math.min(bVal + 1, 7);
      }
      if (disruption && disruption.effect === 'off_peak') {
        aVal = Math.max(aVal - 1, 1);
        bVal = Math.max(bVal - 1, 1);
      }
      return aVal - bVal || a.timestamp - b.timestamp;
    });
  }

  const winners = sorted.slice(0, slots).map(e => e.playerId);
  const losers = sorted.slice(slots).map(e => e.playerId);
  return { winners, losers };
}

/**
 * Auction Resolution: highest Time bid wins.
 * @param {Array} entries - [{ playerId, timeBid, cardValue, timestamp }]
 * @param {number} slots
 * @param {object} disruption
 * @returns {{ winners: Array<{playerId, cost}>, losers: string[] }}
 */
function resolveAuction(entries, slots, disruption) {
  if (entries.length === 0) return { winners: [], losers: [] };

  const sorted = [...entries].sort((a, b) => {
    return b.timeBid - a.timeBid || a.cardValue - b.cardValue || a.timestamp - b.timestamp;
  });

  const winners = sorted.slice(0, slots).map(e => {
    let cost = e.timeBid;
    if (disruption && disruption.effect === 'auction_surcharge') cost += 1;
    if (disruption && disruption.effect === 'free_auction') cost = Math.floor(cost / 2);
    return { playerId: e.playerId, cost };
  });
  const losers = sorted.slice(slots).map(e => e.playerId);
  return { winners, losers };
}

/**
 * Ballot Resolution: weighted random by card value.
 * Higher card value = more tickets in the draw.
 * @param {Array} entries - [{ playerId, cardValue }]
 * @param {number} slots
 * @param {object} disruption
 * @returns {{ winners: string[], losers: string[] }}
 */
function resolveBallot(entries, slots, disruption) {
  if (entries.length === 0) return { winners: [], losers: [] };

  // Build weighted pool
  const pool = [];
  for (const e of entries) {
    let tickets = e.cardValue;
    if (disruption && disruption.effect === 'wildcard') tickets *= 2;
    for (let i = 0; i < tickets; i++) {
      pool.push(e.playerId);
    }
  }

  let effectiveSlots = slots;
  if (disruption && disruption.effect === 'extra_ballot_slot') effectiveSlots += 1;

  const winners = new Set();
  const shuffledPool = shuffleArray(pool);
  for (const id of shuffledPool) {
    if (winners.size >= effectiveSlots) break;
    winners.add(id);
  }

  const winnerArr = [...winners];
  const loserArr = entries.filter(e => !winners.has(e.playerId)).map(e => e.playerId);
  return { winners: winnerArr, losers: loserArr };
}


// ============================================================
// SCORING
// ============================================================

/**
 * Calculate final score for a player.
 * @param {object} player - { milestones: [], wonOpportunities: [], time: number, auctionSpent: number }
 * @returns {object} { total, milestonePoints, setBonus, diversityBonus, lifeBalance, opportunityScore, details }
 */
function calculateScore(player) {
  let milestonePoints = 0;
  let setBonus = 0;
  let diversityBonus = 0;
  let lifeBalance = 0;
  let opportunityScore = 0;

  // 1. Direct score from won opportunities
  for (const opp of player.wonOpportunities) {
    opportunityScore += (opp.reward && opp.reward.score) || 0;
  }

  // 2. Milestone points (check conditions)
  const oppCategories = {};
  const oppResolutions = { priority: 0, auction: 0, ballot: 0 };
  for (const opp of player.wonOpportunities) {
    oppCategories[opp.category] = (oppCategories[opp.category] || 0) + 1;
    oppResolutions[opp.resolution] = (oppResolutions[opp.resolution] || 0) + 1;
  }

  const uniqueCategories = Object.keys(oppCategories).length;
  const totalWon = player.wonOpportunities.length;

  for (const ms of player.milestones) {
    let met = false;
    if (ms.setBonus && oppCategories[ms.setBonus] >= 2) met = true;
    if (ms.id === 'ms_09' && uniqueCategories >= 4) met = true;
    if (ms.id === 'ms_10' && player.time >= 8) met = true;
    if (ms.id === 'ms_11' && totalWon >= 5) met = true;
    if (ms.id === 'ms_12' && oppResolutions.ballot >= 2) met = true;
    if (ms.id === 'ms_13' && oppResolutions.auction >= 2) met = true;
    if (ms.id === 'ms_14' && oppResolutions.priority >= 3) met = true;
    if (ms.id === 'ms_15' && totalWon === 3) met = true;
    if (ms.id === 'ms_16' && uniqueCategories >= 5) met = true;
    if (ms.id === 'ms_17' && player.auctionSpent <= 3) met = true;
    if (ms.id === 'ms_18' && player.earlyWin) met = true;
    if (ms.id === 'ms_19' && player.finalRoundWin) met = true;
    if (ms.id === 'ms_20' && player.milestones.length > 0 && player.time >= 5) met = true;
    if (ms.id === 'ms_21' && oppCategories['housing'] >= 3) met = true;
    if (ms.id === 'ms_22' && oppCategories['education'] >= 3) met = true;
    if (ms.id === 'ms_23' && oppCategories['healthcare'] >= 3) met = true;
    if (ms.id === 'ms_24' && oppCategories['tech'] >= 3) met = true;
    if (ms.id === 'ms_25' && oppCategories['food'] >= 3) met = true;

    if (met) milestonePoints += ms.points;
  }

  // 3. Set bonus: pairs and triples of same category
  for (const cat of Object.keys(oppCategories)) {
    const count = oppCategories[cat];
    if (count >= 3) setBonus += 5;
    else if (count >= 2) setBonus += 2;
  }

  // 4. Diversity bonus
  if (uniqueCategories >= 5) diversityBonus = 10;
  else if (uniqueCategories >= 4) diversityBonus = 6;
  else if (uniqueCategories >= 3) diversityBonus = 3;

  // 5. Life Balance bonus
  if (uniqueCategories >= 3 && player.time >= 5) lifeBalance = 5;

  const total = milestonePoints + setBonus + diversityBonus + lifeBalance + opportunityScore;

  return {
    total,
    milestonePoints,
    setBonus,
    diversityBonus,
    lifeBalance,
    opportunityScore,
  };
}


// ============================================================
// GAME ENGINE
// ============================================================

class GameEngine {
  constructor(roomCode, playerId, isHost) {
    this.roomCode = roomCode;
    this.playerId = playerId;
    this.isHost = isHost;
    this.roomPath = `rooms/${roomCode}`;
    this.phase = 'reveal';
    this.round = 1;
    this.totalRounds = 8;
    this.listeners = [];

    // Local game state
    this.hand = [];
    this.selectedCardIndex = null;
    this.selectedOpportunityIndex = null;
    this.timeBid = 0;
    this.time = 10;
    this.milestones = [];
    this.wonOpportunities = [];
    this.auctionSpent = 0;
    this.earlyWin = false;
    this.finalRoundWin = false;

    // Shared state
    this.opportunityRow = [];
    this.disruption = null;
    this.players = {};
    this.submissions = {};
    this.scores = {};

    // Decks (host only)
    this.decks = null;
  }

  /** Initialize the game (host creates initial state) */
  async initGame(playerList) {
    const playerCount = Object.keys(playerList).length;
    this.totalRounds = playerCount >= 4 ? 7 : 8;
    const oppRowSize = playerCount >= 4 ? 4 : 3;

    if (this.isHost) {
      this.decks = createShuffledDecks();

      // Deal hands
      const hands = {};
      for (const pid of Object.keys(playerList)) {
        hands[pid] = { cards: dealCards(this.decks.queueDeck, 5) };
      }

      // Deal milestone choices (2 per player)
      const milestoneChoices = {};
      for (const pid of Object.keys(playerList)) {
        milestoneChoices[pid] = dealCards(this.decks.milestoneDeck, 2);
      }

      // Initial opportunity row
      const opportunityRow = dealCards(this.decks.opportunityDeck, oppRowSize);
      const disruption = dealCards(this.decks.disruptionDeck, 1)[0] || null;

      // Write initial game state to Firebase
      await FirebaseHelper.setData(`${this.roomPath}/gameState`, {
        round: 1,
        totalRounds: this.totalRounds,
        phase: 'milestone_choice',
        oppRowSize: oppRowSize,
        opportunityRow: opportunityRow,
        disruption: disruption,
        scores: {},
        log: [],
        milestoneChoices: milestoneChoices,
      });

      // Write hands
      for (const pid of Object.keys(hands)) {
        await FirebaseHelper.setData(`${this.roomPath}/hands/${pid}`, hands[pid]);
      }

      // Store remaining decks
      await FirebaseHelper.setData(`${this.roomPath}/decks`, {
        opportunityDeck: this.decks.opportunityDeck,
        queueDeck: this.decks.queueDeck,
        disruptionDeck: this.decks.disruptionDeck,
      });

      // Initialize player scores
      const scores = {};
      for (const pid of Object.keys(playerList)) {
        scores[pid] = {
          time: 10,
          score: 0,
          milestones: [],
          wonOpportunities: [],
          auctionSpent: 0,
          earlyWin: false,
          finalRoundWin: false,
        };
      }
      await FirebaseHelper.setData(`${this.roomPath}/gameState/scores`, scores);
    }

    this.startListeners();
  }

  /** Start listening to Firebase for game state changes */
  startListeners() {
    // Listen to game state
    const gsRef = FirebaseHelper.onValue(`${this.roomPath}/gameState`, (data) => {
      if (!data) return;
      this.onGameStateUpdate(data);
    });
    this.listeners.push(gsRef);

    // Listen to own hand
    const handRef = FirebaseHelper.onValue(`${this.roomPath}/hands/${this.playerId}`, (data) => {
      if (!data) return;
      this.hand = data.cards || [];
      this.renderHand();
    });
    this.listeners.push(handRef);

    // Host listens to all submissions
    if (this.isHost) {
      const subRef = FirebaseHelper.onValue(`${this.roomPath}/submissions`, (data) => {
        this.submissions = data || {};
        this.checkAllSubmitted();
      });
      this.listeners.push(subRef);
    }

    // Everyone listens to submission count for waiting display
    const subCountRef = FirebaseHelper.onValue(`${this.roomPath}/submissions`, (data) => {
      const subs = data || {};
      const count = Object.values(subs).filter(s => s && s.submitted).length;
      const total = Object.keys(this.players).length;
      this.updateWaitingDisplay(count, total);
    });
    this.listeners.push(subCountRef);

    // Host listens for milestone choices being completed
    if (this.isHost) {
      const msRef = FirebaseHelper.onValue(`${this.roomPath}/milestoneChoices`, (data) => {
        if (!data || this.phase !== 'milestone_choice') return;
        const playerIds = Object.keys(this.players);
        const allDone = playerIds.every(pid => data[pid] === 'done');
        if (allDone) {
          this.checkAllMilestonesChosen();
        }
      });
      this.listeners.push(msRef);
    }
  }

  /** Handle game state updates from Firebase */
  onGameStateUpdate(data) {
    const oldPhase = this.phase;
    this.phase = data.phase;
    this.round = data.round || 1;
    this.totalRounds = data.totalRounds || 8;
    // Firebase may convert arrays to objects — normalize
    let oppRow = data.opportunityRow || [];
    if (oppRow && typeof oppRow === 'object' && !Array.isArray(oppRow)) {
      oppRow = Object.values(oppRow);
    }
    this.opportunityRow = oppRow;
    this.disruption = data.disruption || null;
    this.scores = data.scores || {};

    // Update local player data from scores
    const myScore = this.scores[this.playerId];
    if (myScore) {
      this.time = myScore.time;
      this.milestones = myScore.milestones || [];
      this.wonOpportunities = myScore.wonOpportunities || [];
      this.auctionSpent = myScore.auctionSpent || 0;
      this.earlyWin = myScore.earlyWin || false;
      this.finalRoundWin = myScore.finalRoundWin || false;
    }

    // Milestone choice phase
    if (data.phase === 'milestone_choice' && data.milestoneChoices && !this.milestoneChosen) {
      let myChoices = data.milestoneChoices[this.playerId];
      // Firebase may convert arrays to objects — normalize
      if (myChoices && typeof myChoices === 'object' && !Array.isArray(myChoices) && myChoices !== 'done') {
        myChoices = Object.values(myChoices);
      }
      if (myChoices && myChoices !== 'done' && Array.isArray(myChoices)) {
        this.showMilestoneChoice(myChoices);
        // Auto-skip if player doesn't choose within 30 seconds
        clearTimeout(this._milestoneTimeout);
        this._milestoneTimeout = setTimeout(() => this.autoSkipMilestone(), 30000);
      }
    }

    // Render updates
    this.renderHeader();
    this.renderBoard();
    this.renderScores();
    this.renderDisruption();
    this.renderPlayerMilestones();
    this.updateActionBar();

    // Phase transition effects
    if (oldPhase !== data.phase) {
      this.onPhaseChange(data.phase, data);
    }

    // Check end game
    if (data.phase === 'gameover') {
      this.showGameOver(data);
    }
  }

  onPhaseChange(phase, data) {
    // Reset selections on new commit phase
    if (phase === 'commit') {
      this.selectedCardIndex = null;
      this.selectedOpportunityIndex = null;
      this.timeBid = 0;
      this.hasSubmitted = false;
      this.renderHand();
      this.renderBoard();
      this.hideWaiting();
      Toast.show(`Round ${this.round} — pick your move!`, 'info');
    }

    if (phase === 'resolve') {
      this.hideWaiting();
      // Normalize roundResults from Firebase
      let results = data.roundResults || [];
      if (results && typeof results === 'object' && !Array.isArray(results)) {
        results = Object.values(results);
      }
      if (results.length > 0) {
        this.showRoundResults(results);
      }
    }

    if (phase === 'reveal') {
      Toast.show(`Round ${this.round} begins!`, 'info');
    }
  }

  // ============================================================
  // PLAYER ACTIONS
  // ============================================================

  selectCard(index) {
    if (this.phase !== 'commit' || this.hasSubmitted) return;
    if (this.selectedCardIndex === index) {
      this.selectedCardIndex = null;
    } else {
      this.selectedCardIndex = index;
      // Auto-navigate to Opportunities tab after picking a card
      if (this.selectedOpportunityIndex === null) {
        setTimeout(() => this.switchTab('tab-board'), 300);
        Toast.show('Now tap an Opportunity to target!', 'info');
      }
    }
    this.renderHand();
    this.updateActionBar();
    this.updateCommitReview();
  }

  selectOpportunity(index) {
    if (this.phase !== 'commit' || this.hasSubmitted) return;
    if (this.selectedOpportunityIndex === index) {
      this.selectedOpportunityIndex = null;
    } else {
      this.selectedOpportunityIndex = index;
      // If no card selected yet, nudge to My Cards tab
      if (this.selectedCardIndex === null) {
        setTimeout(() => this.switchTab('tab-hand'), 300);
        Toast.show('Pick a card from My Cards first!', 'info');
      }
    }
    this.renderBoard();
    this.updateActionBar();
    this.updateCommitReview();
  }

  /** Switch to a tab programmatically */
  switchTab(tabId) {
    document.querySelectorAll('.nav-tab').forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-tab') === tabId);
    });
    document.querySelectorAll('.tab-content').forEach(tc => {
      tc.classList.toggle('active', tc.id === tabId);
    });
  }

  setTimeBid(value) {
    this.timeBid = Math.min(value, this.time);
    this.updateCommitReview();
  }

  async submitCommitment() {
    if (this.selectedCardIndex === null || this.selectedOpportunityIndex === null) return;
    if (this.hasSubmitted) return;

    const card = this.hand[this.selectedCardIndex];
    const opp = this.opportunityRow[this.selectedOpportunityIndex];

    // Enforce minimum bid for surge pricing
    if (this.disruption && this.disruption.effect === 'surge' && opp.resolution === 'auction' && this.timeBid < 2) {
      Toast.show('Surge pricing: minimum bid is 2 Time!', 'error');
      return;
    }

    await FirebaseHelper.setData(`${this.roomPath}/submissions/${this.playerId}`, {
      cardIndex: this.selectedCardIndex,
      cardValue: card.value,
      cardId: card.id,
      targetOpportunity: this.selectedOpportunityIndex,
      timeBid: opp.resolution === 'auction' ? this.timeBid : 0,
      submitted: true,
      timestamp: firebase.database.ServerValue.TIMESTAMP,
    });

    this.hasSubmitted = true;
    Toast.show('Commitment submitted!', 'success');
    this.updateActionBar();
    this.showWaiting();
  }

  async chooseMilestone(milestoneIndex, choices) {
    const chosen = choices[milestoneIndex];
    this.milestoneChosen = true;

    // Update player's milestones in scores
    await FirebaseHelper.updateData(`${this.roomPath}/gameState/scores/${this.playerId}`, {
      milestones: [chosen],
    });

    // Mark choice as done at the root milestoneChoices path
    await FirebaseHelper.setData(`${this.roomPath}/milestoneChoices/${this.playerId}`, 'done');

    document.getElementById('milestone-modal').close();
    Toast.show(`Milestone chosen: ${chosen.name}`, 'success');

    // All players notify host to check (host may also be this player)
    if (this.isHost) {
      setTimeout(() => this.checkAllMilestonesChosen(), 500);
    }
  }

  /** Auto-skip milestone choice if modal never appeared */
  async autoSkipMilestone() {
    if (this.milestoneChosen) return;
    this.milestoneChosen = true;

    // Pick the first milestone automatically
    const data = await FirebaseHelper.getData(`${this.roomPath}/gameState/milestoneChoices`);
    let myChoices = data && data[this.playerId];
    if (myChoices && typeof myChoices === 'object' && !Array.isArray(myChoices)) {
      myChoices = Object.values(myChoices);
    }
    const chosen = Array.isArray(myChoices) && myChoices.length > 0 ? myChoices[0] : { id: 'ms_09', name: 'Diversifier', category: 'special', condition: 'Collect from 4+ different categories', points: 5, setBonus: null };

    await FirebaseHelper.updateData(`${this.roomPath}/gameState/scores/${this.playerId}`, {
      milestones: [chosen],
    });
    await FirebaseHelper.setData(`${this.roomPath}/milestoneChoices/${this.playerId}`, 'done');

    Toast.show(`Auto-assigned milestone: ${chosen.name}`, 'info');
    try { document.getElementById('milestone-modal').close(); } catch(e) {}

    if (this.isHost) {
      setTimeout(() => this.checkAllMilestonesChosen(), 500);
    }
  }

  // ============================================================
  // HOST RESOLUTION
  // ============================================================

  async checkAllSubmitted() {
    if (!this.isHost || this.phase !== 'commit') return;
    if (this._resolving) return; // prevent double resolution

    const playerIds = Object.keys(this.players);
    const submittedCount = Object.values(this.submissions).filter(s => s && s.submitted).length;

    if (submittedCount >= playerIds.length && playerIds.length > 0) {
      this._resolving = true;
      try {
        await this.resolveRound();
      } catch (e) {
        console.error('Resolution error:', e);
        Toast.show('Error resolving round. Retrying...', 'error');
        setTimeout(() => { this._resolving = false; this.checkAllSubmitted(); }, 2000);
      }
    }
  }

  async checkAllMilestonesChosen() {
    if (!this.isHost) return;

    const data = await FirebaseHelper.getData(`${this.roomPath}/milestoneChoices`);
    if (!data) return;

    const playerIds = Object.keys(this.players);
    const allChosen = playerIds.every(pid => data[pid] === 'done');

    if (allChosen) {
      // Transition directly to commit phase so players can act
      await FirebaseHelper.updateData(`${this.roomPath}/gameState`, { phase: 'commit' });
      await this.addLog('Game started! Round 1 begins.');
    }
  }

  async resolveRound() {
    const results = [];
    const playerUpdates = {};
    const playerIds = Object.keys(this.players);

    // Initialize updates for all players
    for (const pid of playerIds) {
      playerUpdates[pid] = {
        timeChange: 0,
        scoreChange: 0,
        wonOpp: null,
        cardPlayed: null,
      };
    }

    // Apply time tax disruption first
    if (this.disruption && this.disruption.effect === 'time_tax') {
      for (const pid of playerIds) {
        playerUpdates[pid].timeChange -= 1;
      }
    }
    if (this.disruption && this.disruption.effect === 'bonus_time') {
      for (const pid of playerIds) {
        playerUpdates[pid].timeChange += 1;
      }
    }

    // Check community spirit
    if (this.disruption && this.disruption.effect === 'community') {
      for (const pid of playerIds) {
        if (this.submissions[pid] && this.submissions[pid].submitted) {
          playerUpdates[pid].timeChange += 1;
        }
      }
    }

    // Handle remove_first disruption
    let startIndex = 0;
    if (this.disruption && this.disruption.effect === 'remove_first') {
      startIndex = 1;
      results.push({
        opportunityName: this.opportunityRow[0].name,
        resolution: 'discarded',
        winners: [],
        losers: [],
        message: 'Discarded due to Maintenance!',
      });
    }

    // Resolve each opportunity left to right
    const winnerThisRound = new Set();

    for (let i = startIndex; i < this.opportunityRow.length; i++) {
      const opp = this.opportunityRow[i];

      // Gather entries targeting this opportunity
      const entries = [];
      for (const pid of playerIds) {
        const sub = this.submissions[pid];
        if (sub && sub.submitted && sub.targetOpportunity === i) {
          entries.push({
            playerId: pid,
            cardValue: sub.cardValue,
            timeBid: sub.timeBid || 0,
            timestamp: sub.timestamp || 0,
          });
          playerUpdates[pid].cardPlayed = { value: sub.cardValue, name: QUEUE_NAMES.find(q => q.value === sub.cardValue)?.name };
        }
      }

      let effectiveSlots = opp.slots;
      if (this.disruption && this.disruption.effect === 'express_lane' && i === startIndex) {
        effectiveSlots += 1;
      }

      let result;
      if (opp.resolution === 'priority') {
        result = resolvePriority(entries, effectiveSlots, this.disruption);
      } else if (opp.resolution === 'auction') {
        result = resolveAuction(entries, effectiveSlots, this.disruption);
      } else {
        result = resolveBallot(entries, effectiveSlots, this.disruption);
      }

      // Apply skip_lowest disruption
      if (this.disruption && this.disruption.effect === 'skip_lowest' && opp.resolution === 'priority') {
        // Remove the first winner (lowest queue) from winners
        if (result.winners && result.winners.length > 0) {
          const skipped = result.winners.shift();
          if (typeof skipped === 'object') {
            result.losers.push(skipped.playerId);
          } else {
            result.losers.push(skipped);
          }
        }
      }

      // Process winners
      const winnerIds = result.winners.map(w => typeof w === 'object' ? w.playerId : w);
      for (const winnerId of winnerIds) {
        winnerThisRound.add(winnerId);

        let rewardMultiplier = 1;
        if (this.disruption && this.disruption.effect === 'double_reward') rewardMultiplier = 2;

        let scoreAdd = ((opp.reward && opp.reward.score) || 0) * rewardMultiplier;
        if (this.disruption && this.disruption.effect === 'bonus_round') scoreAdd += 1;

        playerUpdates[winnerId].scoreChange += scoreAdd;
        playerUpdates[winnerId].timeChange += ((opp.reward && opp.reward.time) || 0) * rewardMultiplier;
        playerUpdates[winnerId].wonOpp = opp;

        // Auction cost
        if (opp.resolution === 'auction') {
          const winEntry = result.winners.find(w => (typeof w === 'object' ? w.playerId : w) === winnerId);
          const cost = typeof winEntry === 'object' ? winEntry.cost : 0;
          playerUpdates[winnerId].timeChange -= cost;
          playerUpdates[winnerId].auctionCost = cost;
        }
      }

      // Process losers — consolation
      if (opp.consolation && opp.consolation.time > 0 && !(this.disruption && this.disruption.effect === 'no_consolation')) {
        for (const loserId of result.losers) {
          playerUpdates[loserId].timeChange += opp.consolation.time;
        }
      }

      results.push({
        opportunityName: opp.name,
        resolution: opp.resolution,
        winners: winnerIds.map(id => ({ playerId: id, name: this.players[id]?.name || id })),
        losers: result.losers.map(id => ({ playerId: id, name: this.players[id]?.name || id })),
      });
    }

    // Windfall: players who didn't win get 2 Time
    if (this.disruption && this.disruption.effect === 'windfall') {
      for (const pid of playerIds) {
        if (!winnerThisRound.has(pid)) {
          playerUpdates[pid].timeChange += 2;
        }
      }
    }

    // Apply updates to Firebase scores
    const currentScores = this.scores;
    for (const pid of playerIds) {
      const update = playerUpdates[pid];
      const current = currentScores[pid] || { time: 10, score: 0, milestones: [], wonOpportunities: [], auctionSpent: 0 };

      current.time = Math.max(0, (current.time || 0) + update.timeChange);
      current.score = (current.score || 0) + update.scoreChange;

      if (update.wonOpp) {
        if (!current.wonOpportunities) current.wonOpportunities = [];
        current.wonOpportunities.push(update.wonOpp);

        // Track milestone reward
        if (update.wonOpp.reward && update.wonOpp.reward.milestone) {
          // Milestones are already held — this opportunity counts toward milestone conditions
        }
      }

      if (update.auctionCost) {
        current.auctionSpent = (current.auctionSpent || 0) + update.auctionCost;
      }

      // Track early/final round wins
      if (update.wonOpp && this.round <= 2) current.earlyWin = true;
      if (update.wonOpp && this.round >= this.totalRounds) current.finalRoundWin = true;

      currentScores[pid] = current;
    }

    // Remove played cards from hands
    for (const pid of playerIds) {
      const sub = this.submissions[pid];
      if (sub && sub.submitted) {
        const handData = await FirebaseHelper.getData(`${this.roomPath}/hands/${pid}`);
        if (handData && handData.cards) {
          handData.cards.splice(sub.cardIndex, 1);

          // Draw back up to 5
          const decks = await FirebaseHelper.getData(`${this.roomPath}/decks`);
          while (handData.cards.length < 5 && decks.queueDeck && decks.queueDeck.length > 0) {
            handData.cards.push(decks.queueDeck.shift());
          }

          await FirebaseHelper.setData(`${this.roomPath}/hands/${pid}`, handData);
          await FirebaseHelper.setData(`${this.roomPath}/decks/queueDeck`, decks.queueDeck);
        }
      }
    }

    // Build round summary log
    const logEntries = results.map(r => {
      if (r.resolution === 'discarded') return `${r.opportunityName}: ${r.message}`;
      const winnerNames = r.winners.map(w => w.name).join(', ') || 'No one';
      return `${r.opportunityName} (${r.resolution}): Won by ${winnerNames}`;
    });

    // Write results and transition
    await FirebaseHelper.updateData(`${this.roomPath}/gameState`, {
      scores: currentScores,
      roundResults: results,
      phase: 'resolve',
    });

    await this.addLog(`Round ${this.round}: ${logEntries.join(' | ')}`);

    // Clear submissions
    await FirebaseHelper.removeData(`${this.roomPath}/submissions`);
    this._resolving = false;
  }

  /** Advance to next round (called after results are shown) */
  async advanceRound() {
    if (!this.isHost) return;

    if (this.round >= this.totalRounds) {
      await this.endGame();
      return;
    }

    const decks = await FirebaseHelper.getData(`${this.roomPath}/decks`);
    const oppRowSize = (await FirebaseHelper.getData(`${this.roomPath}/gameState/oppRowSize`)) || 3;

    const newOppRow = [];
    for (let i = 0; i < oppRowSize && decks.opportunityDeck.length > 0; i++) {
      newOppRow.push(decks.opportunityDeck.shift());
    }

    const newDisruption = decks.disruptionDeck.length > 0 ? decks.disruptionDeck.shift() : null;

    await FirebaseHelper.setData(`${this.roomPath}/decks/opportunityDeck`, decks.opportunityDeck);
    await FirebaseHelper.setData(`${this.roomPath}/decks/disruptionDeck`, decks.disruptionDeck);

    await FirebaseHelper.updateData(`${this.roomPath}/gameState`, {
      round: this.round + 1,
      phase: 'commit',
      opportunityRow: newOppRow,
      disruption: newDisruption,
      roundResults: null,
    });
  }

  async endGame() {
    // Calculate final scores
    const finalScores = {};
    for (const pid of Object.keys(this.scores)) {
      const playerData = this.scores[pid];
      const score = calculateScore({
        milestones: playerData.milestones || [],
        wonOpportunities: playerData.wonOpportunities || [],
        time: playerData.time || 0,
        auctionSpent: playerData.auctionSpent || 0,
        earlyWin: playerData.earlyWin || false,
        finalRoundWin: playerData.finalRoundWin || false,
      });
      finalScores[pid] = {
        ...playerData,
        finalScore: score,
      };
    }

    await FirebaseHelper.updateData(`${this.roomPath}/gameState`, {
      phase: 'gameover',
      finalScores: finalScores,
    });

    await FirebaseHelper.updateData(`${this.roomPath}/meta`, { status: 'finished' });
    await this.addLog('Game over! Final scores calculated.');
  }

  async addLog(message) {
    const logRef = db.ref(`${this.roomPath}/gameState/log`);
    await logRef.push({
      round: this.round,
      message: message,
      timestamp: firebase.database.ServerValue.TIMESTAMP,
    });
  }

  // ============================================================
  // UI RENDERING
  // ============================================================

  renderHeader() {
    const roundEl = document.getElementById('game-round');
    const phaseEl = document.getElementById('game-phase');
    const timeEl = document.getElementById('game-time-tokens');
    const codeEl = document.getElementById('game-room-code');

    if (roundEl) roundEl.textContent = `Round ${this.round}/${this.totalRounds}`;
    if (phaseEl) {
      const displayPhase = this.phase === 'milestone_choice' ? 'SETUP' : this.phase.toUpperCase();
      phaseEl.textContent = displayPhase;
      phaseEl.className = 'game-phase-badge';
      if (this.phase === 'reveal' || this.phase === 'milestone_choice') phaseEl.classList.add('phase-reveal');
      else if (this.phase === 'commit') phaseEl.classList.add('phase-commit');
      else if (this.phase === 'resolve') phaseEl.classList.add('phase-resolve');
      else if (this.phase === 'refresh') phaseEl.classList.add('phase-refresh');
    }
    if (timeEl) timeEl.textContent = this.time;
    if (codeEl) codeEl.textContent = this.roomCode;
  }

  renderBoard() {
    const row = document.getElementById('opportunity-row');
    if (!row) return;

    row.innerHTML = '';
    this.opportunityRow.forEach((opp, index) => {
      const card = document.createElement('div');
      card.className = 'opportunity-card';
      if (this.selectedOpportunityIndex === index) card.classList.add('selected');

      card.innerHTML = `
        <div class="opp-header">
          <span class="opp-title">${opp.name}</span>
          <span class="opp-type-badge type-${opp.resolution}">${opp.resolution}</span>
        </div>
        <p class="opp-description">${opp.description}</p>
        <div class="opp-details">
          <span class="opp-detail">Slots: <span class="value">${opp.slots}</span></span>
          ${opp.reward.score ? `<span class="opp-detail">Score: <span class="value">+${opp.reward.score}</span></span>` : ''}
          ${opp.reward.time ? `<span class="opp-detail">Time: <span class="value">+${opp.reward.time}</span></span>` : ''}
          ${opp.reward.milestone ? `<span class="opp-detail badge-success" style="padding:0.15rem 0.5rem;border-radius:100px">Milestone</span>` : ''}
          ${opp.consolation && opp.consolation.time ? `<span class="opp-detail">Consolation: <span class="value">+${opp.consolation.time}T</span></span>` : ''}
        </div>
      `;

      card.addEventListener('click', () => {
        if (this.phase === 'commit') {
          this.selectOpportunity(index);
        } else {
          this.openCardModal(opp, 'opportunity');
        }
      });

      row.appendChild(card);
    });
  }

  renderHand() {
    const carousel = document.getElementById('card-carousel');
    const countEl = document.getElementById('hand-count');
    if (!carousel) return;

    carousel.innerHTML = '';
    if (countEl) countEl.textContent = `${this.hand.length} cards`;

    this.hand.forEach((card, index) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'game-card queue-card';
      if (this.selectedCardIndex === index) cardEl.classList.add('selected');

      cardEl.innerHTML = `
        <span class="card-type-label">Queue</span>
        <div class="card-number">${card.value}</div>
        <div class="card-name">${card.name}</div>
        <div class="card-effect">${card.effect}</div>
      `;

      cardEl.addEventListener('click', () => {
        if (this.phase === 'commit') {
          this.selectCard(index);
        } else {
          this.openCardModal(card, 'queue');
        }
      });

      carousel.appendChild(cardEl);
    });
  }

  renderDisruption() {
    const banner = document.getElementById('disruption-banner');
    if (!banner) return;

    if (this.disruption && this.disruption.effect !== 'none') {
      banner.classList.remove('hidden');
      document.getElementById('disruption-name').textContent = this.disruption.name;
      document.getElementById('disruption-text').textContent = this.disruption.description;
    } else {
      banner.classList.add('hidden');
    }
  }

  renderScores() {
    const tbody = document.getElementById('score-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    const playerIds = Object.keys(this.players);

    // Sort by score descending
    const sortedPlayers = playerIds.sort((a, b) => {
      const scoreA = this.scores[a] ? (this.scores[a].score || 0) : 0;
      const scoreB = this.scores[b] ? (this.scores[b].score || 0) : 0;
      return scoreB - scoreA;
    });

    sortedPlayers.forEach((pid, i) => {
      const player = this.players[pid];
      const score = this.scores[pid] || {};
      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td>
          <div class="score-player-cell">
            <div class="score-mini-avatar player-avatar-${i % 5}">${(player?.name || '?')[0].toUpperCase()}</div>
            <span>${player?.name || 'Unknown'}</span>
          </div>
        </td>
        <td>${(score.milestones || []).length}</td>
        <td>${score.time || 0}</td>
        <td class="score-value">${score.score || 0}</td>
      `;

      tbody.appendChild(tr);
    });
  }

  renderPlayerMilestones() {
    const container = document.getElementById('player-milestones');
    if (!container) return;

    container.innerHTML = '';
    if (this.milestones.length === 0) {
      container.innerHTML = '<p class="text-muted" style="font-size:0.85rem">No milestones yet</p>';
      return;
    }

    this.milestones.forEach(ms => {
      const item = document.createElement('div');
      item.className = 'milestone-item';
      item.innerHTML = `
        <div class="milestone-points">${ms.points}</div>
        <div class="milestone-info">
          <div class="milestone-title">${ms.name}</div>
          <div class="milestone-condition">${ms.condition}</div>
        </div>
      `;
      container.appendChild(item);
    });
  }

  renderLog() {
    // Log is updated via Firebase listener in app.js
  }

  updateActionBar() {
    const btn = document.getElementById('btn-action');
    const bar = document.getElementById('action-bar');
    if (!btn || !bar) return;

    if (this.phase === 'commit' && !this.hasSubmitted) {
      const canSubmit = this.selectedCardIndex !== null && this.selectedOpportunityIndex !== null;
      btn.disabled = !canSubmit;

      if (canSubmit) {
        btn.textContent = 'Ready! Tap Submit to commit your move';
        btn.className = 'btn btn-primary btn-full';
      } else if (this.selectedCardIndex !== null) {
        btn.textContent = 'Step 2: Tap an Opportunity to target';
        btn.className = 'btn btn-secondary btn-full';
        btn.disabled = true;
      } else {
        btn.textContent = 'Step 1: Go to My Cards and pick one';
        btn.className = 'btn btn-secondary btn-full';
        btn.disabled = true;
      }

      // Show time bid control for auction targets
      if (this.selectedOpportunityIndex !== null) {
        const opp = this.opportunityRow[this.selectedOpportunityIndex];
        if (opp && opp.resolution === 'auction') {
          this.showTimeBidControl(true);
        } else {
          this.showTimeBidControl(false);
        }
      } else {
        this.showTimeBidControl(false);
      }
    } else if (this.phase === 'resolve') {
      if (this.isHost) {
        btn.textContent = 'Next Round';
        btn.className = 'btn btn-primary btn-full';
        btn.disabled = false;
      } else {
        btn.textContent = 'Round results are in! Check who won';
        btn.className = 'btn btn-secondary btn-full';
        btn.disabled = true;
      }
    } else if (this.phase === 'milestone_choice') {
      btn.textContent = 'Choose your milestone above';
      btn.className = 'btn btn-secondary btn-full';
      btn.disabled = true;
    } else {
      btn.textContent = this.hasSubmitted ? 'Waiting for other players...' : 'Waiting...';
      btn.className = 'btn btn-secondary btn-full';
      btn.disabled = true;
    }
  }

  showTimeBidControl(show) {
    let control = document.getElementById('time-bid-wrapper');
    const bar = document.getElementById('action-bar');

    if (show) {
      if (!control) {
        control = document.createElement('div');
        control.id = 'time-bid-wrapper';
        control.className = 'time-bid-control';
        control.innerHTML = `
          <label>Bid:</label>
          <input type="range" min="0" max="${this.time}" value="${this.timeBid}" id="time-bid-slider">
          <span class="time-bid-value" id="time-bid-display">${this.timeBid}</span>
        `;
        bar.insertBefore(control, bar.firstChild);

        document.getElementById('time-bid-slider').addEventListener('input', (e) => {
          this.setTimeBid(parseInt(e.target.value));
          document.getElementById('time-bid-display').textContent = this.timeBid;
        });
      } else {
        const slider = document.getElementById('time-bid-slider');
        if (slider) slider.max = this.time;
      }
    } else if (control) {
      control.remove();
    }
  }

  updateCommitReview() {
    const review = document.getElementById('commit-review');
    const summary = document.getElementById('commit-summary');
    if (!review || !summary) return;

    if (this.selectedCardIndex !== null && this.selectedOpportunityIndex !== null) {
      review.classList.remove('hidden');
      const card = this.hand[this.selectedCardIndex];
      const opp = this.opportunityRow[this.selectedOpportunityIndex];

      summary.innerHTML = `
        <div class="commit-summary-item">
          <span>Card</span>
          <span>${card.name} (#${card.value})</span>
        </div>
        <div class="commit-summary-item">
          <span>Target</span>
          <span>${opp.name}</span>
        </div>
        <div class="commit-summary-item">
          <span>Resolution</span>
          <span style="text-transform:capitalize">${opp.resolution}</span>
        </div>
        ${opp.resolution === 'auction' ? `
          <div class="commit-summary-item">
            <span>Time Bid</span>
            <span>${this.timeBid}</span>
          </div>
        ` : ''}
      `;
    } else {
      review.classList.add('hidden');
    }
  }

  showMilestoneChoice(choices) {
    const modal = document.getElementById('milestone-modal');
    const container = document.getElementById('milestone-choice');
    const confirmBtn = document.getElementById('btn-confirm-milestone');
    if (!modal || !container) return;

    let selectedIndex = null;
    container.innerHTML = '';

    choices.forEach((ms, index) => {
      const card = document.createElement('div');
      card.className = 'milestone-choice-card';
      card.innerHTML = `
        <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.5rem">
          <span style="font-size:1.5rem;font-weight:800;color:var(--card-milestone)">${ms.points}</span>
          <span style="font-weight:700">${ms.name}</span>
        </div>
        <p style="font-size:0.85rem;color:var(--text-secondary)">${ms.condition}</p>
        ${ms.setBonus ? `<span class="badge badge-warning" style="margin-top:0.5rem">Set bonus: ${ms.setBonus}</span>` : ''}
      `;

      card.addEventListener('click', () => {
        container.querySelectorAll('.milestone-choice-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedIndex = index;
        confirmBtn.disabled = false;
      });

      container.appendChild(card);
    });

    confirmBtn.onclick = () => {
      if (selectedIndex !== null) {
        this.chooseMilestone(selectedIndex, choices);
      }
    };

    modal.showModal();
  }

  showRoundResults(results) {
    const modal = document.getElementById('results-modal');
    const content = document.getElementById('results-content');
    if (!modal || !content) return;

    content.innerHTML = '';
    results.forEach(r => {
      const item = document.createElement('div');
      item.className = 'result-item';

      const winnersHTML = r.winners.length > 0
        ? r.winners.map(w => `<span class="result-winner">&#10003; ${w.name}</span>`).join('')
        : '<span class="text-muted">No one committed</span>';

      item.innerHTML = `
        <div class="result-opp-name">${r.opportunityName} <span class="badge badge-accent">${r.resolution}</span></div>
        ${winnersHTML}
        ${r.losers.length > 0 ? `<div class="result-participants">Also committed: ${r.losers.map(l => l.name).join(', ')}</div>` : ''}
      `;

      content.appendChild(item);
    });

    modal.showModal();
  }

  showWaiting() {
    const overlay = document.getElementById('waiting-overlay');
    if (overlay) overlay.classList.remove('hidden');
  }

  hideWaiting() {
    const overlay = document.getElementById('waiting-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  updateWaitingDisplay(count, total) {
    const countEl = document.getElementById('waiting-count');
    if (countEl) countEl.textContent = `${count} / ${total} submitted`;
  }

  showGameOver(data) {
    const finalScores = data.finalScores || {};
    const entries = Object.entries(finalScores).map(([pid, d]) => ({
      playerId: pid,
      name: this.players[pid]?.name || pid,
      score: d.finalScore ? d.finalScore.total : 0,
      breakdown: d.finalScore || {},
      time: d.time || 0,
    }));

    // Sort by score desc, tiebreak by time desc
    entries.sort((a, b) => b.score - a.score || b.time - a.time);

    const winner = entries[0];

    document.getElementById('gameover-winner').textContent = winner ? winner.name : 'No winner';
    document.getElementById('gameover-score').textContent = winner ? winner.score : 0;

    // Breakdown
    const breakdownEl = document.getElementById('gameover-breakdown');
    if (breakdownEl && winner) {
      const bd = winner.breakdown;
      breakdownEl.innerHTML = `
        <div class="breakdown-item"><span class="breakdown-label">Opportunity Points</span><span class="breakdown-value">${bd.opportunityScore || 0}</span></div>
        <div class="breakdown-item"><span class="breakdown-label">Milestone Points</span><span class="breakdown-value">${bd.milestonePoints || 0}</span></div>
        <div class="breakdown-item"><span class="breakdown-label">Set Bonus</span><span class="breakdown-value">${bd.setBonus || 0}</span></div>
        <div class="breakdown-item"><span class="breakdown-label">Diversity Bonus</span><span class="breakdown-value">${bd.diversityBonus || 0}</span></div>
        <div class="breakdown-item"><span class="breakdown-label">Life Balance</span><span class="breakdown-value">${bd.lifeBalance || 0}</span></div>
        <div class="breakdown-item"><span class="breakdown-label">Remaining Time</span><span class="breakdown-value">${winner.time}</span></div>
      `;
    }

    // Rankings
    const rankingsEl = document.getElementById('gameover-rankings');
    if (rankingsEl) {
      rankingsEl.innerHTML = '';
      entries.forEach((entry, i) => {
        const item = document.createElement('div');
        item.className = 'ranking-item';
        const medals = ['&#129351;', '&#129352;', '&#129353;'];
        item.innerHTML = `
          <span class="ranking-position">${medals[i] || (i + 1)}</span>
          <span class="ranking-name">${entry.name}</span>
          <span class="ranking-score">${entry.score}</span>
        `;
        rankingsEl.appendChild(item);
      });
    }

    // Switch to game over screen
    App.showScreen('screen-gameover');
  }

  openCardModal(card, type) {
    const modal = document.getElementById('card-modal');
    if (!modal) return;

    document.getElementById('modal-card-type').textContent = type.toUpperCase() + ' CARD';
    document.getElementById('modal-card-title').textContent = card.name;

    let bodyHTML = '';
    let statsHTML = '';

    if (type === 'queue') {
      bodyHTML = `<p>${card.effect}</p>`;
      statsHTML = `
        <div class="modal-stat">
          <div class="modal-stat-label">Queue Number</div>
          <div class="modal-stat-value">${card.value}</div>
        </div>
        <div class="modal-stat">
          <div class="modal-stat-label">Priority</div>
          <div class="modal-stat-value">${card.value <= 3 ? 'High' : card.value <= 5 ? 'Mid' : 'Low'}</div>
        </div>
        <div class="modal-stat">
          <div class="modal-stat-label">Ballot Weight</div>
          <div class="modal-stat-value">${card.value} tickets</div>
        </div>
      `;
    } else if (type === 'opportunity') {
      bodyHTML = `<p>${card.description}</p>`;
      statsHTML = `
        <div class="modal-stat">
          <div class="modal-stat-label">Resolution</div>
          <div class="modal-stat-value" style="text-transform:capitalize">${card.resolution}</div>
        </div>
        <div class="modal-stat">
          <div class="modal-stat-label">Slots</div>
          <div class="modal-stat-value">${card.slots}</div>
        </div>
        ${card.reward.score ? `<div class="modal-stat"><div class="modal-stat-label">Score</div><div class="modal-stat-value">+${card.reward.score}</div></div>` : ''}
        ${card.reward.time ? `<div class="modal-stat"><div class="modal-stat-label">Time</div><div class="modal-stat-value">+${card.reward.time}</div></div>` : ''}
      `;
    }

    document.getElementById('modal-card-body').innerHTML = bodyHTML;
    document.getElementById('modal-card-stats').innerHTML = statsHTML;

    modal.showModal();
  }

  /** Cleanup listeners */
  destroy() {
    this.listeners.forEach(ref => ref.off());
    this.listeners = [];
  }
}
