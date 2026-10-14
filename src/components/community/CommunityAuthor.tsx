import Image from 'next/image';
import Link from 'next/link';
import {User} from 'lucide-react';
import type {CommunityEntry} from '@/lib/data/community';
export default function CommunityAuthor({entry}:{entry:CommunityEntry}){
 const profile=entry.authorProfile;
 const content=<>{profile?.avatar?<Image src={profile.avatar} width={26} height={26} alt="" unoptimized/>:<User size={16} aria-hidden="true"/>}<b dir="auto">{profile?.name??entry.author}</b></>;
 return profile?<Link href={'/@'+encodeURIComponent(profile.username)} className="community-author" data-cursor="link">{content}</Link>:<span className="community-author">{content}</span>;
}
