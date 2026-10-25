-- PRODUCTION seed: firm settings, practice areas, FAQs, categories and opening hours.
-- No sample articles and no placeholder testimonial. James must read and approve every practice area text and FAQ before launch.

-- Firm settings (the advocate edits these in /admin; unknown values left blank on purpose)
insert into public.site_settings (key, value) values
  ('firm', jsonb_build_object(
    'name', 'James Kale & Co. Advocates',
    'short_name', 'Kale & Co.',
    'tagline', 'Clear counsel. Careful representation.',
    'address', 'Lelbatai Building, 2nd Floor, Room 4, Kabarnet Town, Baringo County, Kenya',
    'lat', 0.492900,
    'lng', 35.742915,
    'phone', '',
    'whatsapp', '',
    'email', ''
  )),
  ('hours', jsonb_build_object('summary', 'Monday to Friday, 8:00 am – 5:00 pm. Closed on Saturdays and Sundays.')),
  ('advocate', jsonb_build_object(
    'name', 'James Kale',
    'title', 'Advocate of the High Court of Kenya',
    'qualifications', '',
    'admission_year', null,
    'years_experience', null,
    'bio', '',
    'photo_path', null
  )),
  ('memberships', '[]'::jsonb),
  ('courts', '[]'::jsonb),
  ('stats', jsonb_build_object('years', null, 'matters', null, 'areas_served', 'Kabarnet, Baringo County and the wider Rift Valley')),
  ('features', jsonb_build_object('show_testimonials', false, 'kiswahili', true))
on conflict (key) do nothing;

-- Practice areas
insert into public.practice_areas (slug, title, title_sw, summary, summary_sw, icon, body_md, how_we_help, seo_title, seo_description, sort_order) values
('conveyancing-land-law', 'Conveyancing & Land Law', 'Uhamisho wa Mali na Sheria ya Ardhi',
 'Safe land purchases, title searches, transfers, leases and boundary disputes.',
 'Ununuzi salama wa ardhi, utafutaji wa hati miliki, uhamisho, ukodishaji na migogoro ya mipaka.',
 'landmark',
 E'Land is most families'' largest asset. We help you verify ownership before you pay, draft sound agreements, and complete transfers properly.\n\nWe act for buyers, sellers, lenders and landowners across Baringo County and the wider Rift Valley.',
 '[{"title":"Verify","text":"Official search, ownership and encumbrance checks before any money moves."},{"title":"Draft","text":"Sale agreements, leases and charges that protect your position."},{"title":"Complete","text":"Consents, stamp duty, transfer and registration handled to the end."}]',
 'Conveyancing & Land Law Advocate in Kabarnet, Baringo', 'Land buying checks, title searches, transfers and land disputes in Kabarnet and Baringo County. Book a consultation with James Kale & Co. Advocates.', 1),
('family-succession', 'Family & Succession', 'Familia na Mirathi',
 'Wills, succession causes, guardianship and family matters handled with discretion.',
 'Wosia, kesi za mirathi, ulezi na masuala ya familia yanayoshughulikiwa kwa busara.',
 'users',
 E'Family and inheritance matters are personal and often urgent. We explain your options plainly and guide you through the court process where it is needed.',
 '[{"title":"Listen","text":"We understand the family, the assets and what you want to achieve."},{"title":"Advise","text":"A clear route: agreement, succession cause or other proceedings."},{"title":"Act","text":"Filing, representation and follow-through until the matter is closed."}]',
 'Family & Succession Lawyer in Kabarnet', 'Wills, succession causes and family law advice in Kabarnet, Baringo County.', 2),
('criminal-defence', 'Criminal Defence', 'Utetezi wa Kesi za Jinai',
 'Prompt, confidential representation from first arrest to final judgment.',
 'Uwakilishi wa haraka na wa siri kuanzia kukamatwa hadi hukumu ya mwisho.',
 'shield',
 E'You have constitutional rights from the moment of arrest. We act quickly on bail, plea and trial, and keep you informed at every step.',
 '[{"title":"Respond","text":"Urgent attendance and bail applications."},{"title":"Prepare","text":"Review of evidence, witnesses and defences."},{"title":"Defend","text":"Firm representation at trial and on appeal."}]',
 'Criminal Defence Advocate in Kabarnet', 'Bail, trial and appeal representation in Kabarnet and nearby courts.', 3),
('commercial-corporate', 'Commercial & Corporate', 'Biashara na Kampuni',
 'Business registration, contracts and advice for SMEs and growing enterprises.',
 'Usajili wa biashara, mikataba na ushauri kwa biashara ndogo na za kati.',
 'briefcase',
 E'From registering a company to drafting supplier and partnership agreements, we give small and growing businesses practical, enforceable paperwork.',
 '[{"title":"Structure","text":"The right vehicle: sole trader, partnership or company."},{"title":"Document","text":"Contracts, shareholder and partnership agreements."},{"title":"Support","text":"Ongoing advice as the business grows."}]',
 'Business & Commercial Lawyer in Kabarnet', 'Company registration, contracts and SME legal support in Baringo County.', 4),
('employment-labour', 'Employment & Labour', 'Ajira na Kazi',
 'Contracts, terminations, terminal dues and workplace disputes for staff and employers.',
 'Mikataba, kusitishwa kazi, malipo ya mwisho na migogoro ya kazini kwa wafanyakazi na waajiri.',
 'handshake',
 E'We advise employees on unfair termination and unpaid dues, and employers on compliant contracts and fair procedure.',
 '[{"title":"Assess","text":"Review of contract, notice, procedure and dues."},{"title":"Negotiate","text":"Settlement where possible, quickly and fairly."},{"title":"Litigate","text":"Representation before the Employment and Labour Relations Court."}]',
 'Employment Lawyer in Kabarnet', 'Unfair termination, terminal dues and employment contracts in Baringo County.', 5),
('debt-recovery', 'Debt Recovery', 'Ukusanyaji wa Madeni',
 'Demand letters, negotiated settlements and court recovery of debts.',
 'Barua za madai, makubaliano ya malipo na ukusanyaji wa madeni kupitia mahakama.',
 'coins',
 E'Unpaid invoices and loans hurt cash flow. We pursue recovery firmly and lawfully, starting with demand and settlement before court where that serves you better.',
 '[{"title":"Demand","text":"A formal demand letter that gets attention."},{"title":"Negotiate","text":"Structured repayment agreements."},{"title":"Recover","text":"Suits, judgment and execution where needed."}]',
 'Debt Recovery Advocate in Kabarnet', 'Demand letters, settlements and court recovery of debts in Baringo County.', 6)
on conflict (slug) do nothing;

-- General FAQs
insert into public.faqs (practice_area_id, question, answer, sort_order) values
(null, 'How do I book a consultation?', 'Use the Book a Consultation page, choose a practice area and a time that suits you, and briefly describe your matter. We will confirm by phone or WhatsApp.', 1),
(null, 'What should I bring to the first meeting?', 'Any relevant documents: title deeds, agreements, court papers, letters, and your national ID. If you do not have them yet, come anyway and we will advise on what to gather.', 2),
(null, 'Is what I tell you confidential?', 'Yes. Once we are formally engaged, communications are protected by advocate-client confidentiality. Please note that using this website or sending a form does not by itself create an advocate-client relationship.', 3),
(null, 'Do you work outside Kabarnet?', 'Yes. We act across Baringo County and the wider Rift Valley, and appear in courts beyond Kabarnet when required.', 4);

-- Practice-specific FAQs
insert into public.faqs (practice_area_id, question, answer, sort_order)
select id, 'What checks should I do before buying land?', 'At minimum: an official search at the land registry, confirmation that the seller is the registered owner, checks for charges or caveats, and a visit to the parcel with a surveyor where boundaries matter. Do this before paying a deposit.', 1
from public.practice_areas where slug = 'conveyancing-land-law';

insert into public.faqs (practice_area_id, question, answer, sort_order)
select id, 'Do I need a lawyer to administer a deceased person''s estate?', 'Not always, but succession proceedings involve strict forms and timelines. An advocate helps avoid delays and disputes among beneficiaries.', 1
from public.practice_areas where slug = 'family-succession';

insert into public.faqs (practice_area_id, question, answer, sort_order)
select id, 'What should I do if I am arrested?', 'Stay calm, state that you wish to speak to an advocate, and do not sign statements you do not understand. Contact us as soon as you can.', 1
from public.practice_areas where slug = 'criminal-defence';

-- Blog categories
insert into public.categories (slug, name) values
('land', 'Land & Property'), ('family-succession', 'Family & Succession'), ('business', 'Business & Employment')
on conflict (slug) do nothing;

-- Availability: Mon-Fri 08:00-17:00, closed weekends. Lunch break 13:00-14:00 is an ASSUMPTION; adjust in /admin.
insert into public.availability (day_of_week, is_open, open_time, close_time, break_start, break_end, slot_minutes) values
(0, false, null, null, null, null, 60),
(1, true, '08:00', '17:00', '13:00', '14:00', 60),
(2, true, '08:00', '17:00', '13:00', '14:00', 60),
(3, true, '08:00', '17:00', '13:00', '14:00', 60),
(4, true, '08:00', '17:00', '13:00', '14:00', 60),
(5, true, '08:00', '17:00', '13:00', '14:00', 60),
(6, false, null, null, null, null, 60)
on conflict (day_of_week) do nothing;
