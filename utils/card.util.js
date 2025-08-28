const logger = require("./logger.util");

// Teen Patti card suits and values
const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// Card value mapping for Teen Patti
const CARD_VALUES = {
  'A': 14, // Ace is highest
  'K': 13,
  'Q': 12,
  'J': 11,
  '10': 10,
  '9': 9,
  '8': 8,
  '7': 7,
  '6': 6,
  '5': 5,
  '4': 4,
  '3': 3,
  '2': 2
};

/**
 * Generate a deck of 52 cards
 */
const generateDeck = () => {
  const deck = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({
        suit,
        value,
        display: `${value}${suit}`,
        numericValue: CARD_VALUES[value]
      });
    }
  }
  return deck;
};

/**
 * Shuffle the deck using Fisher-Yates algorithm
 */
const shuffleDeck = (deck) => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Deal 3 cards to each player
 */
const dealCards = (players) => {
  try {
    const deck = generateDeck();
    const shuffledDeck = shuffleDeck(deck);
    
    // Convert players array to plain objects to avoid circular reference issues
    const plainPlayers = players.map(player => {
      if (player.toJSON) {
        return player.toJSON();
      }
      return JSON.parse(JSON.stringify(player));
    });
    
    // Deal 3 cards to each player
    const playersWithCards = plainPlayers.map((player, index) => {
      const playerCards = shuffledDeck.slice(index * 3, (index * 3) + 3);
      const cardValue = calculateCardValue(playerCards);
      
      return {
        ...player,
        cards: playerCards,
        card_value: cardValue
      };
    });
    
    console.log(`Cards dealt to ${players.length} players.`);
    
    return {
      players: playersWithCards,
    };
    
  } catch (error) {
    console.error(`Error dealing cards: ${error.message}`);
    throw error;
  }
};

/**
 * Calculate total value of 3 cards for Teen Patti
 */
const calculateCardValue = (cards) => {
  if (!cards || cards.length !== 3) return 0;
  
  // For Teen Patti, we need to check for special combinations first
  const values = cards.map(card => card.numericValue).sort((a, b) => a - b);
  
  // Check for Trail (Three of a kind)
  if (values[0] === values[1] && values[1] === values[2]) {
    return 1000 + values[0]; // Trail with highest card value
  }
  
  // Check for Pure Sequence (Straight flush)
  const suits = cards.map(card => card.suit);
  const isSameSuit = suits[0] === suits[1] && suits[1] === suits[2];
  const isSequence = values[2] - values[1] === 1 && values[1] - values[0] === 1;
  
  if (isSameSuit && isSequence) {
    return 900 + values[2]; // Pure sequence with highest card
  }
  
  // Check for Sequence (Straight)
  if (isSequence) {
    return 800 + values[2]; // Sequence with highest card
  }
  
  // Check for Color (Flush)
  if (isSameSuit) {
    return 700 + values[2]; // Color with highest card
  }
  
  // Check for Pair
  if (values[0] === values[1] || values[1] === values[2]) {
    const pairValue = values[0] === values[1] ? values[0] : values[2];
    const kicker = values[0] === values[1] ? values[2] : values[0];
    return 600 + pairValue * 10 + kicker;
  }
  
  // High card
  return values[2] * 100 + values[1] * 10 + values[0];
};

/**
 * Get card display string for a player
 */
const getCardDisplay = (cards) => {
  if (!cards || cards.length === 0) return 'No cards';
  return cards.map(card => card.display).join(' ');
};

module.exports = {
  generateDeck,
  shuffleDeck,
  dealCards,
  calculateCardValue,
  getCardDisplay,
  SUITS,
  VALUES,
  CARD_VALUES
};
