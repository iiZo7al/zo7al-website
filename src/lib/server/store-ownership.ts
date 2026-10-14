import 'server-only';
import { readSyncedProfile } from './minecraft-bridge';
import { ownsRank } from '../data/rank-ownership';
import type { SiteAccount } from '../data/account';
export async function memberOwnsRank(member: SiteAccount, rank: string) { if (!member.minecraft)
    return false; const profile = await readSyncedProfile(member.minecraft.username); return profile?.uuid?.toLowerCase() === member.minecraft.uuid.toLowerCase() && ownsRank(profile.rank, rank); }
