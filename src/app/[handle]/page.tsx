import MarkdownContent from "@/components/ui/MarkdownContent";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { UserRound, Images } from "lucide-react";
import { siteDatabase } from "@/lib/server/site-db";
import { profileHandle,PROFILE_SOCIAL_LABELS } from "@/lib/data/member-profile";
import BrandIcon from "@/components/ui/BrandIcon";
import MemberPlayerButton from "@/components/community/MemberPlayerButton";
import ContentImage from "@/components/hub/ContentImage";
import {contentImageUrl} from '@/lib/data/content-media';
import "@/components/account/account.css";
export const dynamic = "force-dynamic";
export default async function MemberProfile({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const username = profileHandle(handle);
  if (!username) notFound();
  const db = await siteDatabase();
  const member = (
    await db.query(
      `SELECT a.id,a.name,a.username,a.avatar,a.banner,a.bio,a.socials,l.username AS minecraft FROM site_accounts a LEFT JOIN site_minecraft_links l ON l.user_id=a.id WHERE lower(a.username)=lower($1) AND a.deleted_at IS NULL AND a.deletion_due_at IS NULL AND (a.banned_until IS NULL OR a.banned_until<=now())`,
      [username],
    )
  ).rows[0];
  if (!member) notFound();
  const badges=(await db.query("SELECT b.id,b.name,json_build_object('id',i.id,'width',i.width,'height',i.height) AS image FROM site_member_badges m JOIN site_badges b ON b.id=m.badge_id JOIN site_content_images i ON i.id=b.image_id WHERE m.user_id=$1 AND NOT b.archived ORDER BY m.awarded_at LIMIT 30",[member.id])).rows;
  const entries = (
    await db.query(
      `SELECT e.id,e.title,e.body,e.payload,e.created_at,CASE WHEN i.id IS NOT NULL THEN json_build_object('id',i.id,'width',i.width,'height',i.height) ELSE NULL END AS image FROM community_entries e LEFT JOIN site_content_images i ON i.id=e.image_id WHERE e.user_id=$1 AND e.kind='gallery' AND e.published AND e.moderation='approved' ORDER BY e.created_at DESC LIMIT 24`,
      [member.id],
    )
  ).rows;
  const [t, locale, common] = await Promise.all([
    getTranslations("account"),
    getLocale(),getTranslations("common"),
  ]);
  return (
    <main className="public-member-profile">
      <div className="member-profile-cover">
        {member.banner && (
          <Image unoptimized src={member.banner} fill alt="" priority />
        )}
      </div>
      <div className="member-profile-inner">
        <header className="member-profile-header">
          <div className="member-profile-avatar">
            {member.avatar ? (
              <Image
                unoptimized
                src={member.avatar}
                width={128}
                height={128}
                alt={member.name}
              />
            ) : (
              <UserRound size={56} />
            )}
          </div>
          <div>
            <h1>{member.name}</h1>
            <p className="account-help" dir="ltr">
              @{member.username}
            </p>
            {badges.length>0&&<div className='member-profile-badges' aria-label={t('badges')}>{badges.map(b=><span key={b.id} className='member-badge' title={b.name} tabIndex={0}><Image src={contentImageUrl(b.image)} width={30} height={30} unoptimized alt={b.name}/><span className='member-badge-tooltip' aria-hidden='true'>{b.name}</span></span>)}</div>}
          </div>
        </header>
        {member.bio && (
          <MarkdownContent className="member-profile-bio">{member.bio}</MarkdownContent>
        )}
        <div className="hub-actions member-profile-socials">
          {Object.entries(member.socials as Record<string, string>).map(
            ([platform, url]) => (
              <a
                key={platform}
                href={url}
                className="hub-button"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={platform==="website"?common("website"):PROFILE_SOCIAL_LABELS[platform]??platform}
                title={platform==="website"?common("website"):PROFILE_SOCIAL_LABELS[platform]??platform}
              >
                <BrandIcon slug={platform} size={19} />
              </a>
            ),
          )}
          <MemberPlayerButton linkedUsername={member.minecraft} />
        </div>
        <section className="mt-12">
          <h2 className="text-2xl font-semibold mb-6">{t("submissions")}</h2>
          {entries.length ? (
            <div className="member-submissions-grid">
              {entries.map((e) => (
                <article key={e.id} className="account-card">
                  <ContentImage image={e.image} title={e.title} />
                  <h3 dir="auto"><MarkdownContent inline>{e.title}</MarkdownContent></h3>
                  <MarkdownContent className="account-help">{e.body}</MarkdownContent>
                  <time
                    className="account-help"
                    dateTime={new Date(e.created_at).toISOString()}
                  >
                    {new Intl.DateTimeFormat(locale, {
                      dateStyle: "medium",
                    }).format(new Date(e.created_at))}
                  </time>
                </article>
              ))}
            </div>
          ) : (
            <div className="account-card flex items-center gap-3">
              <Images size={24} />
              <span>{t("noSubmissions")}</span>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
