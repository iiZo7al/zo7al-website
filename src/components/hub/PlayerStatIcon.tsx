import { ArrowUp, Blocks, Clock3, Fish, Flame, Footprints, Heart, HeartCrack, Medal, Pickaxe, Shield, Skull, Sparkles, Swords, Trophy, XCircle, Zap } from "lucide-react";
import type { PlayerStatKey } from "@/lib/data/player-statistics";
const icons = {
  kills: Skull, deaths: HeartCrack, wins: Trophy, losses: XCircle, streak: Flame, bestStreak: Medal,
  playtimeSeconds: Clock3, mobKills: Swords, blocksBroken: Pickaxe, blocksPlaced: Blocks, jumps: ArrowUp,
  fishCaught: Fish, animalsBred: Heart, itemsEnchanted: Sparkles, damageDealt: Zap, damageTaken: Shield, distanceMeters: Footprints,
} satisfies Record<PlayerStatKey, typeof Skull>;
export default function PlayerStatIcon({ stat, size = 19 }: { stat: PlayerStatKey; size?: number }) {
  const Icon = icons[stat];
  return <Icon size={size} aria-hidden="true" />;
}
