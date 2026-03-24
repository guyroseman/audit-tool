export interface ArticleMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  isoDate: string;
  readTime: string;
  category: string;
  categoryColor: string;
  keywords: string[];
}

export interface Article extends ArticleMeta {
  html: string;
}

const ARTICLES: Article[] = [
  {
    slug: "slow-website-google-ads-cost",
    title: "How a Slow Website Is Inflating Your Google Ads Costs",
    description: "Most business owners running Google Ads don't know that page speed directly affects how much they pay per click. Here's the mechanism — and how to fix it.",
    date: "March 2025",
    isoDate: "2025-03-01",
    readTime: "4 min read",
    category: "Performance",
    categoryColor: "#e8341a",
    keywords: ["slow website google ads", "website quality score", "core web vitals ad spend", "page speed google ads cost", "website performance revenue"],
    html: `
<h2>Why Google Rewards Faster Sites in the Ad Auction</h2>
<p>When you run Google Ads, you're entering an auction with every search query. The winning bid isn't just about money — Google calculates a <strong>Quality Score</strong> (1–10) for every ad, and that score multiplies your bid to determine your actual placement and cost. One of its core components is <em>Expected Landing Page Experience</em>, which includes page speed as a direct input.</p>
<p>A site loading in 1.5 seconds and one loading in 5 seconds can bid the same amount — but the faster site pays significantly less per placement. The slower site is penalised by being pushed down the auction ranking, meaning you either pay more per click or receive fewer impressions for the same budget.</p>

<h2>The Three Speed Metrics Google Measures</h2>
<ul>
  <li><strong>Largest Contentful Paint (LCP)</strong> — how fast the main content loads. Google's threshold is under 2.5 seconds.</li>
  <li><strong>Total Blocking Time (TBT)</strong> — how long JavaScript is blocking interactivity. Every third-party script adds to this figure.</li>
  <li><strong>Cumulative Layout Shift (CLS)</strong> — whether elements jump around as the page loads. High CLS signals an unstable, poor-quality page.</li>
</ul>
<p>These three metrics combine into a Performance Score (0–100). Below 50 is considered poor. Below 70 typically means you're paying a meaningful penalty in the ad auction every single day.</p>

<h2>What the Numbers Look Like in Practice</h2>
<p>A site scoring 45/100 on performance is typically paying between 40–90% more per click than a comparable site scoring above 80. For a business spending £2,000/month on Google Ads, that's £800–£1,800 in avoidable spend — every month.</p>
<p>The problem is invisible inside the Google Ads dashboard. It shows your average CPC rising gradually as competitors improve their sites, but never tells you why. The gap compounds over time.</p>

<h2>The Four Most Common Causes</h2>
<ul>
  <li><strong>Unoptimised images</strong> — large JPEGs not converted to WebP or AVIF account for the majority of LCP failures.</li>
  <li><strong>Too many third-party scripts</strong> — chat widgets, analytics pixels, and ad tags all compete for main thread time.</li>
  <li><strong>No CDN</strong> — serving assets from a single origin server increases latency for every visitor outside your region.</li>
  <li><strong>No browser caching</strong> — returning visitors re-download the same assets on every page load.</li>
</ul>

<h2>How Much Is It Costing You Right Now?</h2>
<p>The fastest way to find out is a free performance audit. You'll see your current score, which Core Web Vitals are failing, and a monthly estimate of the ad spend overspend those failures are generating.</p>
<p>Most fixes are implementable by any developer in a day or two — compressing images, deferring non-critical scripts, and configuring a CDN. The return on that work typically shows up in the first month's ad bill.</p>
    `,
  },

  {
    slug: "ada-website-compliance-small-business",
    title: "ADA Website Compliance for Small Businesses: What You Need to Know",
    description: "Website accessibility lawsuits against small businesses are rising sharply. Here's what ADA compliance means for your site, what's at risk, and how to check your exposure.",
    date: "March 2025",
    isoDate: "2025-03-05",
    readTime: "5 min read",
    category: "Accessibility",
    categoryColor: "#a78bfa",
    keywords: ["ada website compliance small business", "website accessibility lawsuit", "wcag checklist", "ada compliance checker", "website accessibility requirements"],
    html: `
<h2>Why Small Businesses Are the Main Target</h2>
<p>Over 4,000 ADA-related website lawsuits are filed in the United States every year — and the majority target small and mid-size businesses, not large corporations. The reason is straightforward: smaller businesses are less likely to have legal teams monitoring compliance, making them easier targets for demand letters and quick settlements.</p>
<p>Courts have consistently ruled that websites fall under Title III of the Americans with Disabilities Act as places of public accommodation. If your site isn't accessible to users who rely on screen readers, keyboard navigation, or visual aids, you're exposed to the same legal risk as a physical premises with no wheelchair ramp.</p>

<h2>What "Accessible" Actually Means in Practice</h2>
<p>Web accessibility follows <strong>WCAG 2.1 Level AA</strong> — the standard courts have applied in ADA cases. It breaks into four areas:</p>
<ul>
  <li><strong>Perceivable</strong> — images have alt text, text has sufficient colour contrast, videos have captions.</li>
  <li><strong>Operable</strong> — the site works without a mouse. Full keyboard navigation is required.</li>
  <li><strong>Understandable</strong> — form fields have labels, error messages are descriptive, page language is declared.</li>
  <li><strong>Robust</strong> — the site works with assistive technology like JAWS and VoiceOver screen readers.</li>
</ul>
<p>Most small business websites fail on contrast ratios and missing form labels — two of the most common issues cited in demand letters. They're also among the cheapest to fix.</p>

<h2>What Happens When You Receive a Demand Letter</h2>
<p>A typical ADA demand letter requests a settlement of $5,000–$20,000 plus a commitment to fix the identified issues within 90 days. Most businesses settle because litigation costs more than the settlement amount. Cases that go to trial have resulted in significantly higher awards, plus attorney fees.</p>
<p>The irony is that the underlying fixes are usually inexpensive. Adding alt text, fixing contrast ratios, and labelling form fields often takes a developer one or two days of work. The expensive part is finding out about the problem from a lawyer rather than an audit.</p>

<h2>Industries at Highest Risk</h2>
<p>Plaintiffs typically target businesses where accessibility directly affects the ability to use the service online:</p>
<ul>
  <li>E-commerce stores and retail</li>
  <li>Restaurants with online menus or booking systems</li>
  <li>Healthcare practices and appointment scheduling</li>
  <li>Hotels and accommodation</li>
  <li>Financial services and insurance</li>
</ul>
<p>If your website takes bookings, processes orders, or provides any service that a person with a disability would reasonably need to access, you are within scope.</p>

<h2>How to Check Your Current Risk Level</h2>
<p>An automated accessibility audit surfaces the most common WCAG failures in under a minute — alt text gaps, contrast failures, missing form labels, and absent ARIA roles. It won't catch every possible issue (some require manual screen reader testing), but it identifies the structural problems that appear in the majority of demand letters.</p>
<p>Running a free audit shows your current ADA risk level alongside the specific issues that need fixing — before someone else finds them for you.</p>
    `,
  },

  {
    slug: "website-visibility-ai-search-chatgpt",
    title: "Is Your Website Invisible to ChatGPT? How AI Search Is Changing Everything",
    description: "ChatGPT, Perplexity, and Gemini answer questions directly — and they cite specific websites. Here's what makes a site get referenced, and what keeps it invisible.",
    date: "March 2025",
    isoDate: "2025-03-10",
    readTime: "4 min read",
    category: "AI Visibility",
    categoryColor: "#10b981",
    keywords: ["website visible chatgpt", "generative engine optimization", "ai search seo", "perplexity seo", "geo optimization website", "chatgpt website citation"],
    html: `
<h2>The Search Shift That's Already Happening</h2>
<p>When someone asks ChatGPT "what's the best project management tool for small teams?" or Perplexity "who are the leading web design agencies in London?", they get a direct answer with citations — not ten blue links to click through. The businesses cited in those answers get the traffic. Everyone else is invisible to that channel entirely.</p>
<p>This is Generative Engine Optimisation (GEO) — the emerging discipline of making your website readable and citable by AI systems. It's early enough that most businesses haven't heard of it, but late enough that it's already affecting how businesses get discovered online.</p>

<h2>How AI Models Decide What to Reference</h2>
<p>Large language models are trained on web content, and retrieval-augmented systems like Perplexity actively fetch and summarise pages in real time. Both types consistently favour the same structural signals:</p>
<ul>
  <li><strong>Schema markup (JSON-LD)</strong> — tells AI systems exactly what your page is about, who you are, what you offer, and where you operate. Without it, the model has to guess — and often skips pages it can't clearly categorise.</li>
  <li><strong>Statistical and factual content</strong> — AI systems prefer citing pages with specific numbers, data points, and verifiable claims. Vague marketing copy rarely gets referenced.</li>
  <li><strong>Question-format headings</strong> — H2s and H3s written as questions ("How much does X cost?", "What is Y?") directly match how people query AI systems.</li>
  <li><strong>Structured content hierarchy</strong> — clear H1 → H2 → H3 hierarchy, lists, and tables are easier for models to parse and extract from accurately.</li>
</ul>

<h2>Why Most Business Sites Score Poorly</h2>
<p>Most small business websites were built for visual appeal — hero image, tagline, three benefit sections, contact form. That format, while fine for a human scanning a page, is nearly invisible to AI systems looking for structured, factual, citable content.</p>
<p>The good news: the same structural changes that improve AI citability also improve traditional SEO. Schema markup helps Google's rich results. Question-based headings capture featured snippet traffic. It's the same investment, with two payoffs.</p>

<h2>Four Changes You Can Make This Week</h2>
<ul>
  <li><strong>Add JSON-LD Organisation schema</strong> — your name, URL, description, and contact details. It takes 10 minutes, is invisible to visitors, and is immediately readable by AI systems.</li>
  <li><strong>Rewrite 2–3 headings as questions</strong> — identify your most common customer questions and reformat a page heading around each one.</li>
  <li><strong>Add specific data points</strong> — "founded in X", "Y clients served", "average result of Z%" — concrete facts AI models can cite with confidence.</li>
  <li><strong>Add an FAQ section</strong> — explicit Q&A structure is one of the highest-performing formats for both AI citation and Google featured snippets.</li>
</ul>

<h2>Measuring Where You Stand</h2>
<p>Most website audit tools don't include AI citation readiness — it's new enough that the majority of dashboards haven't caught up. A 5-pillar audit that includes GEO signals will show your current readiness score, which structural signals are missing, and which fixes are likely to have the highest impact for the least effort.</p>
    `,
  },

  {
    slug: "core-web-vitals-explained-business",
    title: "Core Web Vitals Explained: What LCP, CLS and TBT Mean for Your Revenue",
    description: "Google's Core Web Vitals are more than a developer concern — they directly affect your search rankings and ad costs. Here's what each metric measures and why it matters.",
    date: "March 2025",
    isoDate: "2025-03-15",
    readTime: "5 min read",
    category: "Performance",
    categoryColor: "#e8341a",
    keywords: ["core web vitals explained", "lcp cls tbt business", "core web vitals revenue", "page speed revenue impact", "website performance score"],
    html: `
<h2>What Core Web Vitals Actually Are</h2>
<p>Core Web Vitals are three specific measurements Google introduced to capture the real-world experience of loading and interacting with a webpage. Unlike older speed metrics (like total page load time), they measure what visitors actually perceive — the speed of your main content appearing, how responsive the page feels before you can click anything, and whether the layout shifts unexpectedly as things load.</p>
<p>Since 2021, they've been official Google ranking signals. Since 2022, they've been factored into Google's ad Quality Score. They're not a developer curiosity — they're a direct lever on your search visibility and ad costs.</p>

<h2>The Three Metrics Explained</h2>
<h3>Largest Contentful Paint (LCP)</h3>
<p>LCP measures how long until the largest visible element on the page — usually your hero image or main heading — fully loads and appears. Google's threshold is <strong>under 2.5 seconds</strong>. Above 4 seconds is rated poor.</p>
<p>The most common causes: unoptimised images (large JPEGs that should be WebP or AVIF), slow server response times, and render-blocking CSS or JavaScript loaded before the page's main content.</p>

<h3>Total Blocking Time (TBT)</h3>
<p>TBT measures the total time the browser's main thread is blocked by JavaScript during page load — the window when the page looks loaded but doesn't respond to clicks or taps. <strong>Under 200ms</strong> is good; above 600ms is poor.</p>
<p>Third-party scripts are the primary culprit: analytics tags, chat widgets, advertising pixels, social embeds, and cookie consent managers all compete for main thread time. Every script you add to a page has a cost that is paid by every visitor on every page load.</p>

<h3>Cumulative Layout Shift (CLS)</h3>
<p>CLS measures visual instability — how much elements move around as the page loads. If an image loads after the text and shifts everything down, that's layout shift. <strong>Under 0.1</strong> is good; above 0.25 is poor.</p>
<p>CLS is most damaging on mobile, where a layout shift can cause a visitor to tap the wrong button. It's also frequently cited in accessibility audits, since unstable layouts create a poor experience for screen reader users.</p>

<h2>The Direct Revenue Connection</h2>
<p>Google's own research found that as page load time increases from 1 to 3 seconds, the probability of a visitor leaving before interacting increases by 32%. At 5 seconds, it reaches 90%. Every percentage point of visitors who leave before the page loads is lost revenue — leads that never filled out your form, products that were never added to a basket.</p>
<p>For businesses running Google Ads: poor Core Web Vitals reduce your Quality Score, which means your campaigns pay more per click than a competitor with a faster site bidding the same amount. A site scoring 45/100 on performance typically pays 40–90% more per click than one scoring above 80.</p>

<h2>How to Find Your Scores</h2>
<p>Google's PageSpeed Insights will show your scores for any URL at no cost. A score of 90+ is good, 50–89 needs improvement, and below 50 is considered poor — with measurable impact on both your rankings and your ad budget.</p>
<p>A full 5-pillar audit combines your Core Web Vitals scores with an estimate of the monthly ad spend overspend those scores are generating — useful for communicating the business case to developers or agencies who need to prioritise the work.</p>
    `,
  },

  {
    slug: "website-audit-checklist-2025",
    title: "The 2025 Website Audit Checklist: 5 Areas Every Business Must Review",
    description: "A practical website audit covers more than just speed. Here's the complete 5-pillar framework used by performance agencies — and how to run it free on your own site.",
    date: "March 2025",
    isoDate: "2025-03-20",
    readTime: "6 min read",
    category: "SEO",
    categoryColor: "#f59e0b",
    keywords: ["website audit checklist 2025", "website audit free", "5 pillar website audit", "website performance checklist", "seo audit checklist", "website revenue audit"],
    html: `
<h2>Why Websites Need Regular Audits</h2>
<p>Most business websites are audited at launch and then left alone for years. But websites exist in a constantly changing environment: Google's algorithms update, accessibility standards evolve, new JavaScript vulnerabilities are discovered in libraries running quietly in your site's background, and new channels like AI search create entirely new requirements for visibility.</p>
<p>An annual 5-pillar audit is the minimum cadence for any website being used to generate business. Here's what each pillar covers and what to look for.</p>

<h2>Pillar 1: Performance</h2>
<p>Performance is measured through Google's Core Web Vitals — LCP, TBT, and CLS — summarised as a score out of 100. This score has two direct revenue implications: it affects your position in Google's organic search results, and it affects your Google Ads Quality Score, which determines what you pay per click.</p>
<p><strong>What to check:</strong> LCP under 2.5s, TBT under 200ms, CLS under 0.1. A performance score below 80 warrants investigation, especially for any page used as an ad landing page.</p>

<h2>Pillar 2: SEO</h2>
<p>SEO in an audit context means the technical foundations — the signals that determine whether Google can find, crawl, and rank your pages correctly. Keyword strategy is separate. The technical checklist:</p>
<ul>
  <li>Unique title tag and meta description on every indexed page</li>
  <li>Open Graph tags for correct social sharing previews</li>
  <li>Mobile-responsive design across all breakpoints</li>
  <li>Sitemap submitted to Google Search Console</li>
  <li>Robots.txt not accidentally blocking key pages</li>
  <li>Structured data (JSON-LD) on service, product, and homepage</li>
  <li>No broken internal links returning 404 errors</li>
</ul>

<h2>Pillar 3: Accessibility</h2>
<p>Accessibility covers both legal risk (ADA compliance under WCAG 2.1 AA) and the real-world experience of the 15–20% of users with some form of disability. The issues most commonly cited in demand letters:</p>
<ul>
  <li>Images missing descriptive alt text</li>
  <li>Form fields without associated labels</li>
  <li>Colour contrast below 4.5:1 for body text or 3:1 for large text</li>
  <li>Interactive elements unreachable by keyboard navigation</li>
  <li>Missing ARIA labels on icon-only buttons</li>
</ul>

<h2>Pillar 4: Security</h2>
<p>Most website security issues aren't sophisticated attacks — they're outdated JavaScript dependencies with publicly known vulnerabilities, and missing HTTP response headers that any attacker can check in seconds. The basics:</p>
<ul>
  <li>JavaScript libraries current (no known CVEs in dependencies)</li>
  <li>HTTPS configured correctly with no mixed-content warnings</li>
  <li>Security headers present: Content-Security-Policy, HSTS, X-Frame-Options, X-Content-Type-Options</li>
  <li>No sensitive data or internal paths exposed in page source</li>
</ul>

<h2>Pillar 5: AI Search Visibility</h2>
<p>As AI-powered search (ChatGPT, Perplexity, Google AI Overviews) becomes a meaningful discovery channel, sites structured for AI citation gain a growing advantage over those that aren't. The checklist:</p>
<ul>
  <li>JSON-LD Organisation schema with name, URL, description, and contact details</li>
  <li>Factual, statistical content — not just marketing copy</li>
  <li>At least 2–3 headings written as direct questions</li>
  <li>Clear H1 → H2 → H3 content hierarchy</li>
  <li>FAQ section on key landing pages</li>
</ul>

<h2>How to Run the Audit</h2>
<p>You can check each pillar manually using free tools: Google PageSpeed Insights, Google Search Console, WAVE for accessibility, SecurityHeaders.com, and Google's Rich Results Test for structured data. A 5-pillar automated audit checks all of them simultaneously and outputs a prioritised fix list with estimated revenue impact — significantly faster than the manual approach and easier to act on.</p>
    `,
  },
];

export const articleList: ArticleMeta[] = ARTICLES.map(({ html: _html, ...meta }) => meta);

export function getArticle(slug: string): Article | null {
  return ARTICLES.find(a => a.slug === slug) ?? null;
}
