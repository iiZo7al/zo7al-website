# Zo7al auth emails

All 13 Supabase authentication and security notification templates share the website's dark surface, orange accent, cyan detail, logo, rounded cards and bilingual Arabic/English copy. Layout tables, inline styles and a 560px fluid container support mobile and common email clients.

`manifest.json` maps each Supabase template key to its HTML file and subject. Paste the subject and complete HTML into the corresponding Supabase Authentication → Emails template. Preserve Go template variables exactly. These files are not applied by a website deployment.

Magic link or OTP and reauthentication show `{{ .Token }}` without a sign-in link. Signup confirmation, invitations, email changes and password recovery retain `{{ .ConfirmationURL }}` for the website's existing PKCE flow. Security notifications show the relevant provider, factor or changed contact information and link to account security/support.

The hosted Free project currently blocks subject/body edits until custom SMTP is configured (or Pro is enabled). Configure an authorized SMTP sender through Supabase's secure settings; do not put SMTP passwords or API credentials in source control or chat. Disable provider click tracking for authentication links. After applying templates, confirm numeric OTP delivery and one-time verification, confirmation and recovery callbacks, and each enabled security notification before marking the rollout complete.

Sources: https://supabase.com/docs/guides/auth/auth-email-templates and https://supabase.com/docs/guides/local-development/customizing-email-templates.
