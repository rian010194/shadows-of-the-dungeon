# Shadows of the Dungeon - Game Vision

## Core Concept
A **social deduction dungeon crawler** where players explore a dungeon together, but some are secretly corrupted and working against the group.

## Game Flow

### Phase 1: Exploration (Day Phase)
- **Duration**: 1-2 minutes or until all players run out of stamina
- **Objective**: Explore dungeon, gather loot, find evidence of corruption
- **Actions Available**:
  - Move between rooms (costs stamina)
  - Search rooms for loot and evidence
  - Use items from inventory
  - Observe other players' behavior
  - Gather information about who might be corrupted

### Phase 2: Night Phase
- **Trigger**: When all players run out of stamina
- **Duration**: Until corrupted players take action
- **Corrupted Players**:
  - Get full stamina restored
  - Can move freely and take actions
  - Can attempt to murder other players
  - Can search for more loot
- **Innocent Players**: 
  - Are "asleep" and cannot act
  - Can only observe what happens

### Phase 3: Voting Phase
- **Trigger**: After night phase ends (corrupted player acts or time limit)
- **Duration**: 30 seconds for discussion and voting
- **Objective**: Vote out suspected corrupted players
- **Mechanics**:
  - Players can discuss and make accusations
  - Each player votes for one suspected corrupted player
  - Player with most votes is eliminated
  - If tied, no one is eliminated

### Phase 4: Check Win Conditions
- **Innocent Win**: All corrupted players eliminated
- **Corrupted Win**: Corrupted players equal or outnumber innocent players
- **Continue**: If neither condition met, return to Day Phase

## Win Conditions

### Innocent Players Win When:
- All corrupted players are eliminated (voted out or killed)
- At least one innocent player survives and escapes the dungeon

### Corrupted Players Win When:
- Corrupted players equal or outnumber innocent players
- All innocent players are eliminated

## Social Deduction Mechanics

### Evidence Gathering
- **Suspicious Behavior**: Players can observe others' actions
- **Murder Attempts**: Failed murder attempts reveal corrupted players
- **Stamina Anomalies**: Players who don't lose stamina at night are suspicious
- **Movement Patterns**: Unusual movement or actions

### Information Sharing
- **Public Discussion**: Players can discuss during voting phase
- **Observation**: Players can see what others are doing
- **Deduction**: Use logic to figure out who's corrupted

### Accusation System
- **Voting**: Each player votes for one suspected corrupted player
- **Majority Rule**: Player with most votes is eliminated
- **Tie Breaking**: If tied, no elimination occurs

## Game Balance

### Player Counts
- **4-6 Players**: 1 corrupted player
- **7-8 Players**: 2 corrupted players
- **9+ Players**: 3 corrupted players

### Action Economy
- **Stamina System**: Limits actions per day phase
- **Night Phase**: Gives corrupted players advantage
- **Voting**: Provides counter-balance for innocent players

### Progression
- **Loot System**: Rewards for surviving and escaping
- **Character Development**: Stats affect gameplay
- **Meta Progression**: Unlock new items and abilities

## Technical Implementation

### Game States
1. `exploration` - Day phase dungeon crawling
2. `night` - Corrupted players act
3. `voting` - Discussion and voting phase
4. `game_end` - Show results and rewards

### Data Structures
- Player roles (innocent/corrupted)
- Voting records
- Evidence/accusations
- Win condition tracking

### UI Requirements
- Voting interface
- Discussion chat
- Evidence display
- Win/loss screen
- Player elimination notifications
