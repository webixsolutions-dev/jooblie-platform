-- Phase 1.9: fixed reference data for the global taxonomy and public sites.
-- IDs and slugs are URL/API contracts. Additive follow-up migrations must preserve them.

insert into public.sectors (id, slug, name, sort_order)
values
  (1, 'office-administration', 'Office & Administration', 10),
  (2, 'information-technology', 'Information Technology', 20),
  (3, 'hospitality-healthcare', 'Hospitality & Healthcare', 30),
  (4, 'transportation-farming', 'Transportation & Farming', 40),
  (5, 'general-services', 'General & Other', 50)
on conflict (id) do nothing;

insert into public.categories (id, sector_id, slug, name, sort_order, is_active)
values
  (101, 1, 'administrative-assistance', 'Administrative Assistance', 10, true),
  (102, 1, 'customer-service', 'Customer Service', 20, true),
  (103, 1, 'human-resources', 'Human Resources', 30, true),
  (104, 1, 'accounting-finance', 'Accounting & Finance', 40, true),
  (105, 1, 'sales-business-development', 'Sales & Business Development', 50, true),
  (106, 1, 'marketing-communications', 'Marketing & Communications', 60, true),
  (107, 1, 'legal-compliance', 'Legal & Compliance', 70, true),
  (108, 1, 'management-operations', 'Management & Operations', 80, true),

  (201, 2, 'software-development', 'Software Development', 10, true),
  (202, 2, 'data-analytics', 'Data & Analytics', 20, true),
  (203, 2, 'cybersecurity', 'Cybersecurity', 30, true),
  (204, 2, 'cloud-devops', 'Cloud & DevOps', 40, true),
  (205, 2, 'it-support', 'IT Support', 50, true),
  (206, 2, 'quality-assurance-testing', 'Quality Assurance & Testing', 60, true),
  (207, 2, 'product-project-management', 'Product & Project Management', 70, true),
  (208, 2, 'network-systems', 'Network & Systems Administration', 80, true),

  (301, 3, 'healthcare-clinical', 'Healthcare & Clinical', 10, true),
  (302, 3, 'nursing', 'Nursing', 20, true),
  (303, 3, 'allied-health', 'Allied Health', 30, true),
  (304, 3, 'caregiving-support', 'Caregiving & Support', 40, true),
  (305, 3, 'hospitality-guest-services', 'Hospitality & Guest Services', 50, true),
  (306, 3, 'food-beverage', 'Food & Beverage', 60, true),
  (307, 3, 'housekeeping-facilities', 'Housekeeping & Facilities', 70, true),
  (308, 3, 'recreation-wellness', 'Recreation & Wellness', 80, true),

  (401, 4, 'driving-delivery', 'Driving & Delivery', 10, true),
  (402, 4, 'logistics-warehousing', 'Logistics & Warehousing', 20, true),
  (403, 4, 'automotive-mechanics', 'Automotive & Mechanics', 30, true),
  (404, 4, 'aviation-marine', 'Aviation & Marine', 40, true),
  (405, 4, 'agriculture-farming', 'Agriculture & Farming', 50, true),
  (406, 4, 'forestry-environment', 'Forestry & Environment', 60, true),
  (407, 4, 'equipment-operations', 'Equipment Operations', 70, true),

  (501, 5, 'retail-sales', 'Retail Sales', 10, true),
  (502, 5, 'education-training', 'Education & Training', 20, true),
  (503, 5, 'manufacturing-production', 'Manufacturing & Production', 30, true),
  (504, 5, 'cleaning-janitorial', 'Cleaning & Janitorial', 40, true),
  (505, 5, 'general-labour', 'General Labour', 50, true),
  (506, 5, 'other', 'Other', 60, true),
  (507, 5, 'skilled-trades-construction', 'Skilled Trades & Construction', 70, true)
on conflict (id) do nothing;

insert into public.sites (
  id,
  slug,
  name,
  domain,
  site_type,
  sector_id,
  is_active
)
values
  (1, 'jooblie', 'Jooblie', 'jooblie.com', 'aggregator', null, true),
  (2, 'office-jobs', 'Office Jobs Jobline', 'office-jobline.vercel.app', 'sector', 1, true),
  (3, 'it-jobs', 'IT Jobs Jobline', 'it-jobs.placeholder.jooblie.com', 'sector', 2, true),
  (
    4,
    'hospitality-healthcare',
    'Hospitality & Healthcare Jobline',
    'hospitality-healthcare.placeholder.jooblie.com',
    'sector',
    3,
    true
  ),
  (
    5,
    'transport-farming',
    'Transportation & Farming Jobline',
    'transport-farming.placeholder.jooblie.com',
    'sector',
    4,
    true
  ),
  (
    6,
    'aboriginal',
    'Aboriginal Jobline',
    'aboriginal.placeholder.jooblie.com',
    'audience',
    null,
    true
  ),
  (
    7,
    'newcomers',
    'New Comers Jobline',
    'newcomers.placeholder.jooblie.com',
    'audience',
    null,
    true
  )
on conflict (id) do nothing;
