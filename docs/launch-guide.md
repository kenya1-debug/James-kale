# Launch guide: James Kale & Co. Advocates

Follow the steps in order. Each step says **how essential it is**:

- **MUST**: do not launch without it
- **SHOULD**: strongly recommended, but the site works without it
- **OPTIONAL**: only if you want it

Commands are for Kali Linux (WSL). Anything in CAPITALS is a value you replace.

---

## Step 0. Decide who owns and pays for the accounts (MUST)

The site needs these services. Prices are what the providers published in 2026; please confirm on their pricing pages before quoting a client.

| Service | What it does | Plan needed | About |
|---|---|---|---|
| Vercel | Runs the website | **Pro** (the free Hobby plan is not allowed for business sites) | $20 per team member per month |
| Supabase | Stores bookings, messages, articles | **Pro** (the free plan pauses the project after a week without visitors, and has no automatic backups) | $25 per month |
| Resend | Sends the email notifications | Free plan is fine to start | check their pricing page |
| Domain name | The website address | Yearly fee at a registrar | varies |

**Recommended: you (the agency) own the accounts and charge James a monthly hosting and maintenance fee.** One Vercel Pro seat can host many client sites. You stay in control of updates. If James later wants full ownership, Vercel and Supabase both let you transfer a project to his account.

The alternative is James owning every account. That is cleaner for him, but Vercel may block deployments from people who are not members of the team, so you would need a paid seat for yourself too.

---

## Step 1. Put the code on GitHub (MUST)

1. Create a free account at github.com if you do not have one.
2. Create a **private** repository named `kale-advocates`. Do not tick "Add a README".
3. In Kali, tell git who you are (once):
```bash
git config --global user.name "YOUR NAME"
git config --global user.email "YOUR-EMAIL"
```
4. Create a key so GitHub trusts your computer (press Enter at every question):
```bash
ssh-keygen -t ed25519 -C "YOUR-EMAIL"
cat ~/.ssh/id_ed25519.pub
```
5. Copy the whole line that `cat` prints. On GitHub: your picture → Settings → SSH and GPG keys → New SSH key → paste → Save.
6. Test it:
```bash
ssh -T git@github.com
```
Type `yes` if asked. You should see "Hi YOUR-USERNAME! You've successfully authenticated".
7. Upload the project:
```bash
cd ~/projects/kale-advocates
git init -b main
git add .
git status --short | grep -i "\.env"
```
The last command must show **only** `.env.example`. If it shows `.env.local`, stop and tell me. Then:
```bash
git commit -m "James Kale & Co. Advocates website"
git remote add origin git@github.com:YOUR-USERNAME/kale-advocates.git
git push -u origin main
```
Refresh the repository page: you should see all the files. Under the "Actions" tab a check called "Checks" will run by itself.

---

## Step 2. Create the live database (MUST)

Do **not** launch on your test database: it contains your test booking and test accounts. Make a new one.

1. supabase.com → New project. Name: `kale-advocates-live`. Choose a region as close to Kenya as offered (an Africa or Europe region). Choose a strong database password and save it in a password manager.
2. Upgrade it to **Pro** (Project → Settings → Billing). This is what stops the project pausing and turns on daily backups.
3. SQL Editor → paste and run, **one at a time and in this order**:
   1. `supabase/migrations/0001_schema.sql`
   2. `supabase/migrations/0002_rate_limit.sql`
   3. `supabase/seed.production.sql` (not `seed.sql`: it has no sample articles)
4. Authentication → Sign In / Providers → Email → switch **off** "Allow new users to sign up" and save.
5. Authentication → Users → Add user → James's email and a strong password → tick auto-confirm.
6. SQL Editor, replace the email:
```sql
update public.profiles set role = 'admin', is_active = true
where id = (select id from auth.users where lower(email) = lower('JAMES-EMAIL'));
```
It must say 1 row affected.
7. Check security is on for every table:
```sql
select tablename, rowsecurity from pg_tables where schemaname = 'public' order by 1;
```
Every row must say `true`.
8. Project Settings → API: copy the **Project URL** and the **publishable key**. Never copy or use the `service_role` key anywhere.
9. Dashboard → Advisors → Security: read anything marked red and tell me what it says.

---

## Step 3. Resend email (MUST for notifications)

1. resend.com → API Keys → Create (sending access only). Copy it now; it is shown once.
2. Until the domain is verified (Step 6), Resend only lets you send from `onboarding@resend.dev` to the email address of the Resend account itself. That is enough for testing.

---

## Step 4. Publish on Vercel (MUST)

1. vercel.com → sign in with GitHub → Add New → Project → Import `kale-advocates`.
2. Framework: Next.js (detected automatically). Leave the build settings alone.
3. Open **Environment Variables** and add these:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL from Step 2 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | publishable key from Step 2 |
| `NEXT_PUBLIC_SITE_URL` | `https://YOUR-PROJECT.vercel.app` for now (you change it in Step 6) |
| `RESEND_API_KEY` | from Step 3 (mark as Sensitive) |
| `NOTIFY_EMAIL_TO` | the email that should receive booking alerts |
| `NOTIFY_EMAIL_FROM` | `onboarding@resend.dev` for now |
| `RATE_LIMIT_SALT` | a new random string: run `openssl rand -hex 24` |

Do **not** add `LOW_MEMORY` or `CSP_REPORT_ONLY`. Optional ones (analytics, Turnstile) are listed in `.env.example`.
4. Click Deploy and wait about two minutes.
5. Project → Settings → Functions → set the region closest to your Supabase region (for example Frankfurt or London). Then redeploy once (Deployments → the latest → ⋯ → Redeploy). The default is Washington, which is slow for Kenya.
6. Project → Settings → General → Node.js Version: 22.

Open the `.vercel.app` address: the site should load.

---

## Step 5. Test the live site (MUST)

1. Home page loads. Switch to Kiswahili and back.
2. `/admin`: sign in as James. Sign out. Try a wrong password.
3. Site settings: enter phone, WhatsApp and email, then check the Call and WhatsApp buttons appear on the site.
4. Book a consultation from your phone. Check: (a) the success screen, (b) the request appears in Consultations, (c) the email arrives, (d) the booked time disappears from the form.
5. Send a message from the Contact page. Check it arrives too.
6. Write one test article in the admin, publish it, open it, then delete it.

---

## Step 6. Domain name and email address (MUST for the real launch)

1. Buy the domain (a `.co.ke` through a Kenyan registrar, or a `.com`).
2. Vercel → Project → Settings → Domains → Add the domain and the `www.` version.
3. Vercel shows what to change. The simplest way: at the registrar, change the **nameservers** to the two Vercel gives you (`ns1.vercel-dns.com` and `ns2.vercel-dns.com`). It can take from a few minutes to 48 hours.
   - **If James already has email on this domain** (Google Workspace, Zoho and so on), do not move the nameservers. Instead add the A and CNAME records Vercel shows at the registrar, so his email keeps working.
4. In Vercel, change `NEXT_PUBLIC_SITE_URL` to `https://THE-DOMAIN` and **redeploy**. This matters: the sitemap, share previews and Google data all use this address.
5. Resend → Domains → Add the domain. It shows a few DNS records. Add each one exactly as shown, in the same place where the domain's DNS lives (Vercel, if you moved the nameservers). Wait until Resend says Verified.
6. In Vercel set `NOTIFY_EMAIL_FROM` to `notifications@THE-DOMAIN` and redeploy. Now emails can go to any address, so you may also set `SEND_CLIENT_CONFIRMATION` to `true`.
7. Supabase → Authentication → URL Configuration → set Site URL to `https://THE-DOMAIN`.

---

## Step 7. The checks, in plain words

| Check | How essential | What it is and how to do it |
|---|---|---|
| **Security-rule check** | **MUST** | The site tells browsers what it may load. If we got it wrong, something (the map, an image) silently fails. Open the live site in Chrome, press F12, click **Console**, and visit: home, a practice area, an article, Contact, Booking. Red messages containing "Content Security Policy" mean something is blocked: copy the message to me. No such messages means all is well. |
| **James approves the legal pages and all text** | **MUST** | He is the lawyer. He reads the privacy policy, terms, disclaimer, every practice area text and every FAQ. He fixes them in the admin (practice areas, FAQs) or tells you what to change. |
| **Sitemap and robots** | SHOULD | Open `/sitemap.xml` and `/robots.txt` on the live site. You should see a list of pages. This is how Google finds everything. |
| **Google reads the site** | SHOULD | Paste the live home page into search.google.com/test/rich-results. It should find the firm and FAQ information. |
| **Speed and quality score** | SHOULD | After launch, open pagespeed.web.dev, test the home page, and aim for 90+ on each score. Send me the results if any are low. |
| **Kiswahili review** | SHOULD | Ask a fluent Kiswahili speaker to read the `/sw` pages once. Legal pages are English on purpose for now. |
| **Visitor statistics and cookie banner** | OPTIONAL | Only if James wants to see visitor numbers. Plausible is simple and paid; Google Analytics is free. If he does not want either, do nothing: no banner appears. |
| **Dark mode, stricter security rule, editable address in Google data** | OPTIONAL | Nothing to do. Ask me later if you ever want them. |

---

## Step 8. Get found on Google (SHOULD)

Follow `google-business-profile.md`: the Google Business Profile and Search Console. It brings the most local customers, and it is free.

---

## Step 9. Hand over to James (MUST)

Give him `handover-guide-for-james.md`. Sit with him for 30 minutes: he logs in, changes a phone number, writes and publishes an article, and blocks a date. Let him do it with you watching.

Tell him: use a strong, unique password; never share the login; tell you when staff leave.

---

## After launch: how updates work

- You change the code on your computer, then `git add .`, `git commit -m "what changed"`, `git push`. Vercel publishes it automatically in about two minutes.
- Every push to a branch other than `main` gets a private preview address, so you can show James changes before they go live.
- If a change breaks the site: Vercel → Deployments → pick the last good one → ⋯ → Promote to Production. That undoes it in seconds.
- Database changes (new SQL files) are run by hand in the live Supabase SQL Editor, after testing on the test project.
- Free uptime alert: uptimerobot.com can check the site every 5 minutes and email you if it is down.
