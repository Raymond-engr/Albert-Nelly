-- ============================================================================
-- Phase 2: Seed Default Content and Configuration
-- ============================================================================

-- Seed Default Settings
insert into public.settings (id, whatsapp_number, birthday_discount, commission_min, commission_max)
values (true, '2340000000000', 10, 5.0, 10.0)
on conflict (id) do nothing;

-- Seed Default Message Templates
insert into public.message_templates (type, label, body) values
  ('hire', 'Hire Inquiry Response', 'Hi {name}, thanks for reaching out about {service}. We would love to discuss your vision.'),
  ('refer', 'Referral Welcome', 'Hi {name}, welcome as an Albert Nelly referral partner. Introduce your contact and follow the chat to earn up to 10%.'),
  ('partner', 'Partner Collaboration', 'Hi {name}, thanks for your interest in partnering with Albert Nelly for {business}.'),
  ('update', 'Community Welcome', 'Hi {name}, thanks for staying in touch with Albert Nelly. We will share curated design and development updates.'),
  ('birthday', 'Birthday Greeting', 'Happy birthday, {name}! Enjoy {discount}% off your next creative or digital project with Albert Nelly.')
on conflict (type) do nothing;

-- Seed Services
insert into public.services (position, scene, title, description, audience, badge, price, published) values
  (1, 'cv', 'Art and Painting', 'Custom pieces and portraits, painted by our partner artists.', 'Anyone with a wall or a gift to give', 'with our partners', '{"kind":"none"}'::jsonb, true),
  (2, 'wire', 'UI/UX Design', 'Apps and websites people understand on the first tap.', 'Founders and product teams', '', '{"kind":"from","amount":500000}'::jsonb, true),
  (3, 'dev', 'Web and Mobile Development', 'Fast sites and apps, built to grow with you.', 'Founders and growing businesses', '', '{"kind":"custom"}'::jsonb, true),
  (4, 'shp', 'Graphics Design', 'Logos, flyers and brand kits that look like you meant it.', 'Individuals and small businesses', '', '{"kind":"range","min":150000,"max":600000}'::jsonb, true),
  (5, 'sch', 'School Websites', 'A clear, modern site for your school, with report cards and tests when you’re ready.', 'School owners and administrators', '', '{"kind":"perStudent","amount":1500}'::jsonb, true)
on conflict do nothing;

-- Seed School Packages
insert into public.packages (position, name, description, audience, price, featured, features, more) values
  (1, 'Starter', 'A clear, modern school website.', 'Schools starting online', '{"kind":"exact","amount":450000}'::jsonb, false,
   array['Home, About and Academics pages', 'Gallery', 'News and events', 'Contact page', 'Inquiry or application form'],
   array['Easy editing panel for staff', 'Fast, mobile-first design', 'WhatsApp chat button']),
  (2, 'Smart School Portal', 'Starter, plus report cards, tests and fee tracking.', 'Schools ready to go paperless', '{"kind":"from","amount":850000}'::jsonb, true,
   array['Everything in Starter', 'Termly report cards parents can print', 'Teacher portal for scores and comments', 'Computer-based tests, marked automatically', 'AI assistant'],
   array['Online fee tracking with receipts']),
  (3, 'Custom Suite', 'Everything, plus features built with your school.', 'Larger or multi-campus schools', '{"kind":"custom"}'::jsonb, false,
   array['Everything in Smart School Portal', 'Several campuses', 'Staff payroll', 'Library tools'],
   array['Mobile apps', 'Anything else we design together'])
on conflict do nothing;

-- Seed Running Costs
insert into public.running_costs (position, item, amount) values
  (1, 'Domain', 15000),
  (2, 'Hosting', 85000),
  (3, 'AI and messaging usage', 60000),
  (4, 'Support', 120000)
on conflict do nothing;

-- Seed Selected Work Items
insert into public.work_items (position, category, title, challenge, result, published) values
  (1, 'Design', 'Project one', 'Challenge: one line on the problem.', 'Result: one number goes here.', true),
  (2, 'Design', 'Project two', 'Challenge: one line on the problem.', 'Result: one number goes here.', true),
  (3, 'Development', 'Project three', 'Challenge: one line on the problem.', 'Result: one number goes here.', true),
  (4, 'Development', 'Project four', 'Challenge: one line on the problem.', 'Result: one number goes here.', true)
on conflict do nothing;

-- Seed Creative Partners
insert into public.partners (position, name, category, note, link, status, published) values
  (1, 'Lekki Lens Studio', 'Photography', 'Campus shoots and portraits', 'https://example.com', 'active', true),
  (2, 'Vibrant Prints', 'Print', 'School prospectuses and banners', 'https://example.com', 'active', true),
  (3, 'Canvas & Brush Arts', 'Portrait art', 'Hand-painted celebration portraits', 'https://example.com', 'active', true)
on conflict do nothing;
