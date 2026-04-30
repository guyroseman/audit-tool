// ─── Programmatic SEO data ───────────────────────────────────────────────────
// Drives: app/[locationSlug]/page.tsx (city/vertical/competitor pages)
// Drives: app/sitemap.ts, app/llms.txt/route.ts

export type Country = "US" | "UK" | "AU" | "CA" | "IE" | "NZ" | "SG";

export interface CityCard {
  heading: string;
  body: string;
}

export interface City {
  slug: string;        // url segment, no `-website-audit` suffix
  name: string;        // e.g. "Los Angeles"
  short?: string;      // e.g. "LA" — used in body copy when present
  region: string;      // e.g. "California"
  country: Country;
  currency: "USD" | "GBP" | "AUD" | "CAD" | "EUR" | "NZD" | "SGD";
  cards?: CityCard[];  // optional override; else generated from country preset
}

export interface Vertical {
  slug: string;        // e.g. "shopify"
  name: string;        // e.g. "Shopify"
  noun: string;        // e.g. "store" / "site" / "practice"
  heroLine: string;    // sub-headline
  cardsHeading: string;
  cards: CityCard[];
  stats?: { value: string; label: string }[];
  ctaLabel: string;
}

export interface Competitor {
  slug: string;          // e.g. "gtmetrix"  → /nexus-vs-gtmetrix
  name: string;          // e.g. "GTmetrix"
  tagline: string;
  rows: { feature: string; them: string; us: string }[];
  summary: string;
}

// ─── Country presets (used when a City has no custom cards) ──────────────────

const cardsForCountry = (city: City): CityCard[] => {
  const n = city.short ?? city.name;
  const region = city.region;

  const usAda: CityCard = {
    heading: "ADA Lawsuit Exposure Is Real",
    body: `${region} courts process a significant volume of ADA website lawsuits each year. WCAG 2.1 AA compliance is the de-facto standard. Average settlement is $25,000–$50,000 — usually triggered by missing alt text, unlabelled forms, or contrast failures.`,
  };
  const usAds: CityCard = {
    heading: `${n} Is a High-CPC Google Ads Market`,
    body: `${city.name} is among the more competitive Google Ads markets in the US. A poor landing page Quality Score from slow page speed means paying 40–90% more per click than competitors with optimised, fast sites.`,
  };
  const usMobile: CityCard = {
    heading: "Mobile-First Search Behaviour",
    body: `${n} consumers run the majority of local searches on mobile. A site loading in 5 seconds on mobile loses over 60% of visitors before they reach your offer or contact form.`,
  };
  const usLocal: CityCard = {
    heading: "Local Pack Drives Inbound",
    body: `For ${n}-area service businesses, the Google Maps local 3-pack drives a large share of inbound calls. Site speed, structured data, and review signals all influence whether you appear there.`,
  };

  const ukEquality: CityCard = {
    heading: "UK Equality Act Compliance",
    body: `The Equality Act 2010 requires websites to be accessible to disabled users. WCAG 2.1 AA is the applied standard. Most ${n} SME websites fail at least 3 of the most cited criteria — fixable in days, not months.`,
  };
  const ukAds: CityCard = {
    heading: `${n} Google Ads CPCs Are Climbing`,
    body: `${n} businesses are spending more on paid search year-on-year. A poor Quality Score from slow page speed means paying 40–90% more per click — money saved by fixing the underlying site, not by adjusting bids.`,
  };
  const ukAi: CityCard = {
    heading: "AI Search Is Reshaping Discovery",
    body: `When someone asks an AI assistant for the best provider in ${n}, it cites authoritative, structured sites. If yours has no schema markup or question-based content, you're invisible to ChatGPT, Perplexity, and Gemini.`,
  };
  const ukLocal: CityCard = {
    heading: "Local SEO Gaps Cost Leads",
    body: `${n} searchers use local intent queries constantly. Missing structured data, NAP inconsistency, and slow mobile speed all suppress local pack and organic visibility — the leak compounds over months.`,
  };

  const auDda: CityCard = {
    heading: "Disability Discrimination Act Applies",
    body: `Australia's Disability Discrimination Act 1992 covers websites. The 2000 Maguire v SOCOG case established that inaccessible sites can attract complaints. WCAG 2.1 AA is the standard applied by Australian Human Rights Commission decisions.`,
  };
  const auAds: CityCard = {
    heading: `${n} Is Among Australia's Costliest Ad Markets`,
    body: `${n} consistently ranks in Australia's top Google Ads markets by CPC. A poor landing page Quality Score from slow page speed means paying meaningfully more per click than competitors with fast, optimised sites.`,
  };
  const auMobile: CityCard = {
    heading: "Mobile Search Dominates Locally",
    body: `${n} has among the highest mobile search rates in Australia. A 5-second mobile load time loses the majority of users before they engage with your offer or contact form.`,
  };
  const auLocal: CityCard = {
    heading: "Local Pack Visibility Drives Calls",
    body: `For ${n}-area service businesses, Google's local 3-pack drives a significant share of inbound enquiries. Site speed, structured data, and review depth all affect placement.`,
  };

  const caAoda: CityCard = {
    heading: "AODA & ACA Compliance",
    body: `Ontario's AODA (Accessibility for Ontarians with Disabilities Act) and Canada's federal Accessible Canada Act both mandate WCAG-aligned web accessibility. Enforcement and reporting requirements are tightening through 2026 — most ${n} SME sites have material gaps.`,
  };
  const caAds: CityCard = {
    heading: `${n} Google Ads Costs Are Rising`,
    body: `${n} businesses face climbing CPCs across professional services, real estate, and ecommerce. A poor Quality Score from slow page speed means overpaying 40–90% per click vs faster competitors.`,
  };
  const caBilingual: CityCard = {
    heading: "Bilingual & Provincial Search",
    body: `${region} searchers blend English and French queries; missing hreflang tags or untranslated meta descriptions suppress organic reach. Schema and structured data help AI assistants serve the correct language version.`,
  };
  const caLocal: CityCard = {
    heading: "Local Pack Visibility",
    body: `Local 3-pack placement in ${n} drives a meaningful share of inbound calls for service businesses. Page speed, structured data, and review velocity all affect whether you appear above the fold.`,
  };

  switch (city.country) {
    case "US": return [usAds, usAda, usMobile, usLocal];
    case "UK": return [ukAds, ukEquality, ukAi, ukLocal];
    case "IE": return [ukAds, ukEquality, ukAi, ukLocal];
    case "AU": return [auAds, auDda, auMobile, auLocal];
    case "NZ": return [auAds, auDda, auMobile, auLocal];
    case "CA": return [caAds, caAoda, caBilingual, caLocal];
    case "SG": return [
      { heading: `${n} Is a High-CPC Search Market`, body: `${n}'s digital ad market is dense and competitive. Slow landing pages translate directly into higher CPC and lower share of voice — Quality Score penalties scale with site speed.` },
      { heading: "Mobile-First Local Audience", body: `${n} has among the highest mobile internet usage rates globally. A 4-second mobile load time loses most visitors before they reach your offer.` },
      { heading: "AI Search Is Already Mainstream", body: `${n} users adopt AI search faster than most regions. Structured data, FAQ schema, and authoritative content are required to be cited by ChatGPT, Perplexity, and Gemini.` },
      { heading: "Multilingual Search Considerations", body: `English, Mandarin, Malay, and Tamil queries each behave differently in Google. Missing hreflang or non-translated structured data suppresses organic reach across the city's audience segments.` },
    ];
  }
};

export const getCityCards = (city: City) => city.cards ?? cardsForCountry(city);

// ─── Cities ──────────────────────────────────────────────────────────────────

export const cities: City[] = [
  // United States
  { slug: "new-york", name: "New York", short: "NYC", region: "New York", country: "US", currency: "USD", cards: [
    { heading: "ADA Lawsuits Are Filed Daily in NYC", body: "New York leads the US in ADA website lawsuits. The Southern District of New York processes more accessibility cases than any other federal district. If your site isn't WCAG 2.1 compliant, you're exposed." },
    { heading: "NYC Google Ads Are Expensive", body: "New York is one of the highest-CPC Google Ads markets globally. A poor Quality Score from slow page speed means paying 40–90% more per click than competitors with optimised landing pages." },
    { heading: "Mobile Performance Is Non-Negotiable", body: "NYC consumers have the highest mobile search rates in the country. A site loading in 5 seconds on mobile loses over 60% of visitors before they see a single word of your content." },
    { heading: "Local Pack Visibility Drives Revenue", body: "For any NYC service business, the Google local 3-pack drives the majority of inbound calls. Structured data, site speed, and technical SEO all influence whether you appear there." },
  ] },
  { slug: "los-angeles", name: "Los Angeles", short: "LA", region: "California", country: "US", currency: "USD", cards: [
    { heading: "LA Is One of the Highest-CPC Markets in the US", body: "Los Angeles is among the top 5 most expensive Google Ads markets nationally. A poor Quality Score from slow page speed means paying 40–90% more per click — in a market where CPCs are already high." },
    { heading: "Mobile-First Market", body: "LA consumers are among the highest mobile search users in the US. A site loading in 5 seconds on mobile loses over 60% of visitors before they engage with your content or offer." },
    { heading: "ADA Litigation Is Active in California", body: "California leads the US in ADA accessibility lawsuits under both the federal ADA and California's Unruh Act, which adds statutory damages of $4,000 per violation. WCAG 2.1 compliance is essential." },
    { heading: "Competitive Local Pack", body: "Every LA service category has intense local pack competition. Structured data, fast mobile speed, and strong review signals are the levers that separate the top 3 from page 2." },
  ] },
  { slug: "chicago", name: "Chicago", region: "Illinois", country: "US", currency: "USD", cards: [
    { heading: "Chicago Is a High-Competition Ad Market", body: "Chicago is one of the top 10 most competitive Google Ads markets in the US. Without an optimised landing page Quality Score, businesses routinely overpay 40–90% per click compared to competitors with faster sites." },
    { heading: "ADA Exposure Is Growing", body: "Illinois businesses have faced rising ADA website enforcement. Federal courts in the Northern District of Illinois process a significant volume of digital accessibility cases each year." },
    { heading: "B2B and Professional Services Dominate", body: "Chicago's economy is driven by professional services, finance, and B2B. These sectors have high-value leads — which makes conversion rate loss from slow load times especially costly." },
    { heading: "Local Pack Drives Inbound", body: "For any Chicago service business, the Google Maps local 3-pack drives a significant share of inbound calls and leads. Structured data, site speed, and review signals all affect your local pack ranking." },
  ] },
  { slug: "houston", name: "Houston", region: "Texas", country: "US", currency: "USD" },
  { slug: "phoenix", name: "Phoenix", region: "Arizona", country: "US", currency: "USD" },
  { slug: "philadelphia", name: "Philadelphia", short: "Philly", region: "Pennsylvania", country: "US", currency: "USD" },
  { slug: "san-antonio", name: "San Antonio", region: "Texas", country: "US", currency: "USD" },
  { slug: "san-diego", name: "San Diego", region: "California", country: "US", currency: "USD" },
  { slug: "dallas", name: "Dallas", region: "Texas", country: "US", currency: "USD" },
  { slug: "austin", name: "Austin", region: "Texas", country: "US", currency: "USD" },
  { slug: "san-jose", name: "San Jose", region: "California", country: "US", currency: "USD" },
  { slug: "san-francisco", name: "San Francisco", short: "SF", region: "California", country: "US", currency: "USD" },
  { slug: "seattle", name: "Seattle", region: "Washington", country: "US", currency: "USD" },
  { slug: "denver", name: "Denver", region: "Colorado", country: "US", currency: "USD" },
  { slug: "boston", name: "Boston", region: "Massachusetts", country: "US", currency: "USD" },
  { slug: "miami", name: "Miami", region: "Florida", country: "US", currency: "USD" },
  { slug: "atlanta", name: "Atlanta", region: "Georgia", country: "US", currency: "USD" },
  { slug: "portland", name: "Portland", region: "Oregon", country: "US", currency: "USD" },
  { slug: "las-vegas", name: "Las Vegas", region: "Nevada", country: "US", currency: "USD" },
  { slug: "nashville", name: "Nashville", region: "Tennessee", country: "US", currency: "USD" },
  { slug: "charlotte", name: "Charlotte", region: "North Carolina", country: "US", currency: "USD" },
  { slug: "detroit", name: "Detroit", region: "Michigan", country: "US", currency: "USD" },
  { slug: "minneapolis", name: "Minneapolis", region: "Minnesota", country: "US", currency: "USD" },
  { slug: "tampa", name: "Tampa", region: "Florida", country: "US", currency: "USD" },
  { slug: "orlando", name: "Orlando", region: "Florida", country: "US", currency: "USD" },
  { slug: "pittsburgh", name: "Pittsburgh", region: "Pennsylvania", country: "US", currency: "USD" },
  { slug: "washington-dc", name: "Washington DC", short: "DC", region: "District of Columbia", country: "US", currency: "USD" },
  { slug: "indianapolis", name: "Indianapolis", region: "Indiana", country: "US", currency: "USD" },
  { slug: "columbus", name: "Columbus", region: "Ohio", country: "US", currency: "USD" },

  // United Kingdom
  { slug: "london", name: "London", region: "England", country: "UK", currency: "GBP", cards: [
    { heading: "Google Ads CPCs Are High in London", body: "London is one of the most competitive Google Ads markets in the UK. A poor Quality Score from slow page speed means you pay 40–90% more per click than competitors with faster sites." },
    { heading: "ADA Risk Is Growing", body: "Accessibility lawsuits have reached UK shores. WCAG 2.1 compliance is now required under the Equality Act. Most London SME websites fail on at least 3 of the most-cited criteria." },
    { heading: "AI Search Is Changing Discovery", body: "When someone asks ChatGPT 'best agency in London', AI systems cite structured, authoritative sites. If yours isn't one of them, you're invisible to that channel entirely." },
    { heading: "Local SEO Gaps Cost Leads", body: "London searchers use location queries constantly. Missing structured data, inconsistent NAP, or slow mobile load times all suppress your local pack and organic visibility." },
  ] },
  { slug: "manchester", name: "Manchester", region: "England", country: "UK", currency: "GBP", cards: [
    { heading: "Manchester's Digital Economy Is Competitive", body: "Manchester is the UK's fastest-growing tech and digital hub outside London. Standing out in Google search results means faster sites, stronger technical SEO, and better AI search visibility than competitors." },
    { heading: "UK Equality Act Compliance", body: "The Equality Act 2010 requires websites to be accessible to disabled users. WCAG 2.1 AA is the applied standard. Most Manchester SME websites fail on at least 3 of the most commonly cited criteria." },
    { heading: "Google Ads CPCs Are Rising", body: "Manchester-based businesses are spending more on Google Ads year-on-year. A poor Quality Score from slow page speed means paying 40–90% more per click — money that could be saved by fixing the underlying site performance." },
    { heading: "AI Search Is Changing Discovery", body: "When someone asks an AI assistant 'best agency in Manchester', structured and authoritative sites get cited. If yours isn't optimised for AI visibility, you're invisible to that channel entirely." },
  ] },
  { slug: "birmingham", name: "Birmingham", region: "England", country: "UK", currency: "GBP" },
  { slug: "glasgow", name: "Glasgow", region: "Scotland", country: "UK", currency: "GBP" },
  { slug: "edinburgh", name: "Edinburgh", region: "Scotland", country: "UK", currency: "GBP" },
  { slug: "leeds", name: "Leeds", region: "England", country: "UK", currency: "GBP" },
  { slug: "liverpool", name: "Liverpool", region: "England", country: "UK", currency: "GBP" },
  { slug: "bristol", name: "Bristol", region: "England", country: "UK", currency: "GBP" },
  { slug: "sheffield", name: "Sheffield", region: "England", country: "UK", currency: "GBP" },
  { slug: "cardiff", name: "Cardiff", region: "Wales", country: "UK", currency: "GBP" },
  { slug: "belfast", name: "Belfast", region: "Northern Ireland", country: "UK", currency: "GBP" },
  { slug: "newcastle", name: "Newcastle", region: "England", country: "UK", currency: "GBP" },

  // Australia / New Zealand
  { slug: "sydney", name: "Sydney", region: "New South Wales", country: "AU", currency: "AUD" },
  { slug: "melbourne", name: "Melbourne", region: "Victoria", country: "AU", currency: "AUD" },
  { slug: "brisbane", name: "Brisbane", region: "Queensland", country: "AU", currency: "AUD" },
  { slug: "perth", name: "Perth", region: "Western Australia", country: "AU", currency: "AUD" },
  { slug: "adelaide", name: "Adelaide", region: "South Australia", country: "AU", currency: "AUD" },
  { slug: "auckland", name: "Auckland", region: "New Zealand", country: "NZ", currency: "NZD" },
  { slug: "wellington", name: "Wellington", region: "New Zealand", country: "NZ", currency: "NZD" },

  // Canada
  { slug: "toronto", name: "Toronto", region: "Ontario", country: "CA", currency: "CAD" },
  { slug: "vancouver", name: "Vancouver", region: "British Columbia", country: "CA", currency: "CAD" },
  { slug: "montreal", name: "Montréal", region: "Québec", country: "CA", currency: "CAD" },
  { slug: "calgary", name: "Calgary", region: "Alberta", country: "CA", currency: "CAD" },
  { slug: "ottawa", name: "Ottawa", region: "Ontario", country: "CA", currency: "CAD" },

  // Ireland & Singapore
  { slug: "dublin", name: "Dublin", region: "Ireland", country: "IE", currency: "EUR" },
  { slug: "singapore", name: "Singapore", region: "Singapore", country: "SG", currency: "SGD" },
];

// ─── Verticals ───────────────────────────────────────────────────────────────

export const verticals: Vertical[] = [
  {
    slug: "shopify",
    name: "Shopify",
    noun: "store",
    heroLine: "See exactly how your store's speed, Google Shopping Quality Score, ADA risk, and SEO gaps are costing you sales — in 60 seconds, no sign-up required.",
    cardsHeading: "THE BIGGEST ISSUES ON SHOPIFY STORES",
    ctaLabel: "AUDIT MY STORE →",
    stats: [
      { value: "30–55", label: "typical PageSpeed score for default Shopify stores with a standard app stack" },
      { value: "60%+", label: "of mobile shoppers leave a Shopify store taking more than 3 seconds to load" },
      { value: "2.7×", label: "higher conversion rate for stores loading under 1 second vs 5 seconds" },
      { value: "6–12", label: "average number of apps installed on active Shopify stores — each adds load time" },
    ],
    cards: [
      { heading: "App Bloat", body: "Every app installed on your Shopify store that loads on the storefront adds JavaScript and HTTP requests. 6–12 apps can add 2–4 seconds to page load — the single biggest source of slow Shopify stores." },
      { heading: "Unoptimised Product Images", body: "Large product image files are almost always the LCP element on Shopify product pages. Uploading 3–5MB source images means slow LCP even after Shopify's automatic WebP conversion." },
      { heading: "Google Shopping CPCs", body: "Shopify product pages are direct landing pages for Google Shopping campaigns. A slow page reduces landing page Quality Score and increases your cost per click — you pay more for every sale." },
      { heading: "Accessibility Lawsuits Target Ecommerce", body: "US ecommerce stores are the most frequently targeted businesses in ADA accessibility lawsuits. Inaccessible checkout flows and unlabelled form fields are the most commonly cited failures." },
    ],
  },
  {
    slug: "woocommerce",
    name: "WooCommerce",
    noun: "store",
    heroLine: "See your WooCommerce store's Core Web Vitals, plugin bloat impact, ADA exposure, and SEO gaps — in 60 seconds, no sign-up required.",
    cardsHeading: "WHAT BREAKS WOOCOMMERCE PERFORMANCE",
    ctaLabel: "AUDIT MY STORE →",
    cards: [
      { heading: "Plugin Bloat", body: "The average WooCommerce store runs 20+ active plugins. Each plugin adds queries, scripts, and CSS that compound into multi-second page load times — usually the single biggest performance issue." },
      { heading: "Unoptimised Hosting", body: "Shared WordPress hosting can't handle WooCommerce's database overhead. TTFB above 600ms is common — and Google penalises slow server response in landing page Quality Score." },
      { heading: "Image Pipeline Gaps", body: "Without WebP conversion, lazy loading, and a CDN, product images become the LCP bottleneck on every page. A typical fix recovers 1–3 seconds of LCP across the catalogue." },
      { heading: "Checkout Accessibility", body: "WooCommerce's default checkout fails several WCAG 2.1 criteria — unlabelled fields, contrast issues, and missing focus states. Each failure is a documented lawsuit trigger in the US." },
    ],
  },
  {
    slug: "ecommerce",
    name: "Ecommerce",
    noun: "store",
    heroLine: "See exactly how much your store's speed, SEO gaps, and accessibility failures are costing you in lost sales and ad overspend — in 60 seconds, no sign-up required.",
    cardsHeading: "WHAT HURTS ECOMMERCE STORES MOST",
    ctaLabel: "AUDIT MY STORE →",
    stats: [
      { value: "53%", label: "of mobile shoppers leave a page taking more than 3 seconds to load" },
      { value: "$2,400", label: "average monthly Google Ads overspend for ecommerce sites scoring below 50/100" },
      { value: "2.7×", label: "higher conversion rate for sites loading in under 1 second vs 5 seconds" },
      { value: "4,000+", label: "ADA accessibility lawsuits filed against ecommerce stores annually in the US" },
    ],
    cards: [
      { heading: "Product Image Weight", body: "Large, unoptimised product images are the single biggest cause of slow load times on ecommerce sites. A product gallery page with 12 JPEGs can load 8–15 seconds without optimisation. Each second costs conversions." },
      { heading: "Google Shopping Quality Score", body: "Google Shopping campaigns are also affected by landing page quality. Slow product pages mean higher CPCs and lower impression share — you're bidding against yourself by not fixing the underlying speed." },
      { heading: "Cart and Checkout Accessibility", body: "ADA lawsuits against ecommerce stores frequently cite inaccessible checkout flows — unlabelled form fields, no keyboard navigation in address forms, and modals that trap keyboard focus." },
      { heading: "Missing Product Schema", body: "Product pages without structured data (Product schema with price, availability, and reviews) miss out on Google Shopping rich results, review stars in organic results, and AI search citations." },
    ],
  },
  {
    slug: "saas",
    name: "SaaS",
    noun: "site",
    heroLine: "See exactly what's eating your SaaS marketing site's conversion rate — Core Web Vitals, AI search visibility, accessibility, and SEO gaps in 60 seconds.",
    cardsHeading: "WHAT HURTS SAAS MARKETING SITES",
    ctaLabel: "AUDIT MY SITE →",
    cards: [
      { heading: "JS-Heavy Frontends", body: "Most SaaS sites ship 500KB+ of JavaScript on first load. Without code splitting and lazy hydration, TBT exceeds 600ms — directly hurting trial signup rates and Google Ads Quality Score." },
      { heading: "Demo & Pricing Page Speed", body: "Demo and pricing pages are usually the highest-intent traffic. A slow load on these pages costs more in lost MRR than any other page on the site — yet they're often the slowest." },
      { heading: "AI Search Citation Gaps", body: "SaaS buyers ask ChatGPT and Perplexity 'best [category] tool'. Without comparison content, FAQ schema, and authoritative structured data, your product is invisible to AI search." },
      { heading: "Form Accessibility", body: "Trial signup, demo request, and contact forms with unlabelled inputs or low-contrast errors are both a conversion killer and an ADA litigation trigger. Most SaaS forms fail at least one." },
    ],
  },
  {
    slug: "dental",
    name: "Dental Practice",
    noun: "practice",
    heroLine: "See exactly how your dental practice's website is leaking new patient bookings — performance, local SEO, ADA risk, and AI search gaps.",
    cardsHeading: "WHY DENTAL PRACTICES NEED THIS AUDIT",
    ctaLabel: "AUDIT MY PRACTICE SITE →",
    cards: [
      { heading: "Local Pack Drives Bookings", body: "Most new dental patients arrive via Google's local 3-pack. Site speed, NAP consistency, structured data, and review velocity all directly affect whether you appear in those top 3 results." },
      { heading: "ADA Compliance Targets Healthcare", body: "Dental and medical sites are frequent ADA lawsuit targets. Missing alt text on procedure images, inaccessible appointment forms, and contrast failures are documented triggers." },
      { heading: "AI Search Replaces Directory Sites", body: "Patients now ask ChatGPT 'best dentist near me'. AI assistants cite sites with FAQ schema, authoritative content, and clear service pages — dental sites without these are invisible." },
      { heading: "Booking Form Conversion", body: "Slow page speed and broken booking flows drop appointment requests by 40%+. The bookings lost on a slow site usually exceed any monthly subscription paid to fix it." },
    ],
  },
  {
    slug: "law-firm",
    name: "Law Firm",
    noun: "site",
    heroLine: "See exactly what your law firm's website is costing you in lost leads — performance, ADA exposure, local SEO, and AI search citations.",
    cardsHeading: "WHY LAW FIRMS NEED THIS AUDIT",
    ctaLabel: "AUDIT MY FIRM SITE →",
    cards: [
      { heading: "Highest CPCs in Google Ads", body: "Legal services routinely have the highest CPCs in Google Ads — $50–$300 per click in personal injury, family law, and criminal defence. A poor Quality Score from slow page speed compounds this dramatically." },
      { heading: "ADA Lawsuits Targeting Law Firms", body: "Law firm websites are increasingly named in ADA accessibility lawsuits — an embarrassing irony. WCAG 2.1 AA compliance is now expected of any consumer-facing legal website." },
      { heading: "AI Search Cites Authority", body: "Prospects ask AI assistants 'best [practice area] lawyer in [city]'. AI cites sites with structured data, FAQ schema, and authoritative content. Without these, your firm is invisible to that channel." },
      { heading: "Local Pack & Reviews", body: "Local pack placement is the single highest-converting result for legal queries. Site speed, structured data, and Google Business Profile signals all directly affect placement." },
    ],
  },
  {
    slug: "restaurant",
    name: "Restaurant",
    noun: "site",
    heroLine: "See exactly how your restaurant's website is leaking reservations — performance, local SEO, mobile speed, and AI search visibility.",
    cardsHeading: "WHY RESTAURANTS NEED THIS AUDIT",
    ctaLabel: "AUDIT MY RESTAURANT SITE →",
    cards: [
      { heading: "Mobile Speed = Reservations", body: "70%+ of restaurant searches happen on mobile, often within minutes of intended visit. A site loading in 5 seconds on mobile loses most visitors before they see the menu — they go to a competitor." },
      { heading: "Schema Drives Rich Results", body: "Restaurant schema (with menu, hours, cuisine, price range) unlocks Google's rich results — including the knowledge panel and AI search citations. Missing schema means missing the most prominent placements." },
      { heading: "Menu PDF Disasters", body: "PDF menus tank both mobile UX and SEO. Google can't index PDF menus the same way as HTML, and they're a common ADA failure point. Plain HTML menus convert and rank dramatically better." },
      { heading: "Local Pack Dominates", body: "Restaurant searches almost always trigger the local 3-pack. Site speed, structured data, review velocity, and Google Business Profile signals all directly affect placement." },
    ],
  },
  {
    slug: "real-estate",
    name: "Real Estate",
    noun: "site",
    heroLine: "See what's costing your real estate site listings traffic — Core Web Vitals, schema gaps, local SEO failures, and AI search visibility.",
    cardsHeading: "WHY REAL ESTATE SITES NEED THIS AUDIT",
    ctaLabel: "AUDIT MY SITE →",
    cards: [
      { heading: "Image-Heavy Listing Pages", body: "Listing pages with 20–40 photos are the slowest type of real estate page. Without WebP conversion, lazy loading, and proper sizing, LCP routinely exceeds 5 seconds — most visitors leave first." },
      { heading: "RealEstateListing Schema", body: "Real estate sites without structured data miss out on Google's listing rich results, AI search citations, and Zillow/Realtor parity. Schema is the single fastest organic ranking lift on most listing sites." },
      { heading: "Local Pack & Map Search", body: "Real estate buyers run local intent queries constantly. Site speed, NAP consistency, and structured data directly affect local pack visibility — where the highest-intent traffic comes from." },
      { heading: "Lead Form Accessibility", body: "Property enquiry forms without proper labels, focus states, and contrast are both an ADA trigger and a conversion killer. Most real estate sites fail at least one WCAG criterion on lead forms." },
    ],
  },
  {
    slug: "chiropractor",
    name: "Chiropractor",
    noun: "practice",
    heroLine: "See exactly what your chiropractic site is leaking in new patient bookings — performance, local SEO, ADA risk, and AI search gaps.",
    cardsHeading: "WHY CHIROPRACTORS NEED THIS AUDIT",
    ctaLabel: "AUDIT MY PRACTICE SITE →",
    cards: [
      { heading: "Local Pack = New Patients", body: "Most chiropractic patients arrive via Google's local 3-pack. Site speed, NAP consistency, structured data, and review velocity all directly affect whether you appear in those top 3 results." },
      { heading: "Healthcare ADA Exposure", body: "Healthcare sites are frequent ADA targets. Missing alt text on procedure images, inaccessible appointment forms, and contrast failures are all documented triggers — fixable in days." },
      { heading: "AI Search Cites Authority", body: "Patients ask AI assistants 'best chiropractor near me'. AI cites sites with FAQ schema, authoritative content, and clear service pages. Without these, your practice is invisible." },
      { heading: "Mobile Booking Flow", body: "A slow site or broken booking flow drops appointments by 40%+. The bookings lost on a slow site usually exceed any subscription paid to fix it." },
    ],
  },
  {
    slug: "hvac",
    name: "HVAC",
    noun: "site",
    heroLine: "See what's costing your HVAC site emergency calls — performance, local pack visibility, mobile speed, and AI search gaps.",
    cardsHeading: "WHY HVAC BUSINESSES NEED THIS AUDIT",
    ctaLabel: "AUDIT MY SITE →",
    cards: [
      { heading: "Emergency Searches Are Mobile", body: "HVAC emergency searches happen on mobile, often in the heat of summer or dead of winter. A site loading in 5 seconds on mobile loses the call to a competitor — every second counts." },
      { heading: "Local Pack = Calls", body: "HVAC searches almost always trigger the local 3-pack. Site speed, structured data, NAP consistency, and review velocity all directly affect placement and inbound call volume." },
      { heading: "Schema Unlocks Rich Results", body: "LocalBusiness and Service schema unlock pricing rich results, FAQ rich results, and AI search citations. Most HVAC sites are missing both — leaving organic placements on the table." },
      { heading: "Form & Click-to-Call Speed", body: "Slow page speed delays click-to-call rendering, missing the highest-intent moment. A 3-second delay on click-to-call costs a meaningful share of would-be calls." },
    ],
  },
];

// ─── Competitors ─────────────────────────────────────────────────────────────

export const competitors: Competitor[] = [
  {
    slug: "gtmetrix",
    name: "GTmetrix",
    tagline: "Engineer-focused performance reports vs founder-focused revenue diagnostics.",
    summary: "GTmetrix is a strong tool for developers — but its reports were built for engineers, not for founders trying to see what their site is costing them in real money. Nexus translates every finding into a monthly dollar impact and a prioritised fix plan.",
    rows: [
      { feature: "Revenue impact in dollars", them: "—", us: "Per-finding $/month estimate" },
      { feature: "5 audit pillars", them: "Performance only", us: "Performance · SEO · A11y · Security · AI Visibility" },
      { feature: "Plain-English findings", them: "Engineer-facing", us: "Founder-facing" },
      { feature: "AI search visibility", them: "—", us: "GEO score + recommendations" },
      { feature: "Prioritised fix plan", them: "—", us: "Ordered by ROI, dev-ready" },
      { feature: "ADA / WCAG check", them: "Limited", us: "Full WCAG 2.1 AA scan" },
      { feature: "Free, no signup", them: "Limited free tier", us: "Full report, zero signup" },
    ],
  },
  {
    slug: "pingdom",
    name: "Pingdom",
    tagline: "Uptime monitoring vs revenue-impact diagnostics.",
    summary: "Pingdom focuses on uptime monitoring and basic page speed. Useful — but it doesn't tell you why your site is bleeding revenue or how to fix it. Nexus runs a 5-pillar diagnostic with dollar-impact reasoning and a prioritised fix list.",
    rows: [
      { feature: "Revenue impact in dollars", them: "—", us: "Per-finding $/month estimate" },
      { feature: "5 audit pillars", them: "Performance + uptime", us: "Performance · SEO · A11y · Security · AI Visibility" },
      { feature: "Founder-facing language", them: "Mixed", us: "Plain English, no charts" },
      { feature: "AI search visibility", them: "—", us: "GEO score + AI citation gaps" },
      { feature: "Prioritised fix plan", them: "—", us: "Ordered by ROI, dev-ready" },
      { feature: "ADA / WCAG check", them: "—", us: "Full WCAG 2.1 AA scan" },
      { feature: "Free, no signup", them: "Limited free tier", us: "Full report, zero signup" },
    ],
  },
  {
    slug: "pagespeed-insights",
    name: "PageSpeed Insights",
    tagline: "Google's free speed test vs a 5-pillar revenue diagnostic.",
    summary: "PageSpeed Insights is Google's free Lighthouse audit — and Nexus runs on the same Lighthouse engine. The difference: Nexus translates every score into a monthly dollar impact, adds AI search visibility, and gives you a prioritised fix plan ordered by ROI.",
    rows: [
      { feature: "Underlying engine", them: "Google Lighthouse", us: "Google Lighthouse + ADA + AI" },
      { feature: "Revenue impact in dollars", them: "—", us: "Per-finding $/month estimate" },
      { feature: "5 audit pillars", them: "4 (no AI)", us: "Performance · SEO · A11y · Security · AI Visibility" },
      { feature: "Plain-English findings", them: "Technical", us: "Founder-facing" },
      { feature: "Prioritised fix plan", them: "—", us: "Ordered by ROI, dev-ready" },
      { feature: "Recurring monitoring", them: "—", us: "Pulse / Scale plans, alerts on drop" },
      { feature: "Free, no signup", them: "Free", us: "Full report, zero signup" },
    ],
  },
  {
    slug: "semrush-site-audit",
    name: "Semrush Site Audit",
    tagline: "Enterprise SEO suite vs focused revenue-impact diagnostic.",
    summary: "Semrush is an excellent enterprise SEO platform — and priced like one. For founders who just want to know what their site is costing them, it's overkill. Nexus delivers a focused, dollar-impact diagnostic in 60 seconds, free.",
    rows: [
      { feature: "Pricing", them: "$130+/month", us: "Free audit, $19+/mo monitoring" },
      { feature: "Time to first result", them: "Minutes (signup, project setup)", us: "60 seconds, no signup" },
      { feature: "Revenue impact in dollars", them: "—", us: "Per-finding $/month estimate" },
      { feature: "AI search visibility", them: "Limited", us: "GEO score + recommendations" },
      { feature: "Plain-English findings", them: "SEO-pro language", us: "Founder-facing" },
      { feature: "ADA / WCAG check", them: "—", us: "Full WCAG 2.1 AA scan" },
      { feature: "Prioritised fix plan", them: "Long task list", us: "Ordered by ROI, dev-ready" },
    ],
  },
  {
    slug: "ahrefs-site-audit",
    name: "Ahrefs Site Audit",
    tagline: "SEO crawler suite vs founder-focused revenue diagnostic.",
    summary: "Ahrefs Site Audit is a deep technical SEO crawler — designed for SEO professionals managing dozens of sites. It doesn't translate findings into dollar impact, and it doesn't cover ADA risk or AI search visibility. Nexus does, in 60 seconds, free.",
    rows: [
      { feature: "Pricing", them: "$129+/month", us: "Free audit, $19+/mo monitoring" },
      { feature: "Revenue impact in dollars", them: "—", us: "Per-finding $/month estimate" },
      { feature: "Audit scope", them: "Technical SEO", us: "Performance · SEO · A11y · Security · AI Visibility" },
      { feature: "ADA / WCAG check", them: "—", us: "Full WCAG 2.1 AA scan" },
      { feature: "AI search visibility", them: "Limited", us: "GEO score + AI citation gaps" },
      { feature: "Plain-English findings", them: "SEO-pro language", us: "Founder-facing" },
      { feature: "Free, no signup", them: "Trial only", us: "Full report, zero signup" },
    ],
  },
  {
    slug: "lighthouse",
    name: "Lighthouse",
    tagline: "DevTools audit vs business-impact diagnostic.",
    summary: "Lighthouse is the gold-standard performance audit — built into Chrome DevTools. Nexus runs on the same engine but adds the layer Lighthouse intentionally doesn't: dollar impact per finding, ADA risk classification, AI search visibility, and a prioritised fix plan.",
    rows: [
      { feature: "Underlying engine", them: "Lighthouse", us: "Lighthouse + custom checks" },
      { feature: "Revenue impact in dollars", them: "—", us: "Per-finding $/month estimate" },
      { feature: "AI search visibility", them: "—", us: "GEO score + recommendations" },
      { feature: "ADA / WCAG check", them: "Generic accessibility audit", us: "WCAG 2.1 AA + lawsuit-trigger flags" },
      { feature: "Prioritised fix plan", them: "Long task list", us: "Ordered by ROI, dev-ready" },
      { feature: "Recurring monitoring", them: "—", us: "Pulse / Scale plans, alerts on drop" },
      { feature: "Plain-English findings", them: "Technical", us: "Founder-facing" },
    ],
  },
];

// ─── Lookups ─────────────────────────────────────────────────────────────────

export const citySlugs = cities.map(c => `${c.slug}-website-audit`);
export const verticalSlugs = verticals.map(v => `${v.slug}-website-audit`);
export const competitorSlugs = competitors.map(c => `nexus-vs-${c.slug}`);
export const allSeoSlugs = [...citySlugs, ...verticalSlugs, ...competitorSlugs];

export type SeoPage =
  | { kind: "city"; city: City }
  | { kind: "vertical"; vertical: Vertical }
  | { kind: "competitor"; competitor: Competitor };

export function resolveSeoPage(slug: string): SeoPage | null {
  // city: <slug>-website-audit
  const cityMatch = slug.match(/^(.+)-website-audit$/);
  if (cityMatch) {
    const inner = cityMatch[1];
    const city = cities.find(c => c.slug === inner);
    if (city) return { kind: "city", city };
    const vertical = verticals.find(v => v.slug === inner);
    if (vertical) return { kind: "vertical", vertical };
  }
  // competitor: nexus-vs-<slug>
  const compMatch = slug.match(/^nexus-vs-(.+)$/);
  if (compMatch) {
    const competitor = competitors.find(c => c.slug === compMatch[1]);
    if (competitor) return { kind: "competitor", competitor };
  }
  return null;
}
