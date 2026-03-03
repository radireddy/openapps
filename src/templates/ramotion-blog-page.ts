import { AppDefinition, ComponentType } from '@/types';
import { defaultLightTheme } from '@/theme-presets';

/**
 * Creates an AppDefinition that replicates the Ramotion blog article page layout.
 * Based on: https://www.ramotion.com/blog/hero-image-in-web-design/
 *
 * Structure:
 *   1. Navigation bar (logo, links, CTA buttons)
 *   2. Breadcrumb
 *   3. Article header (title, authors, meta)
 *   4. Two-column body (main content + sidebar TOC)
 *   5. Footer (newsletter, link columns, copyright)
 */
export function createRamotionBlogApp(): AppDefinition {
  const PAGE_ID = 'page_ramotion_main';
  const now = new Date(1709300000000).toISOString();

  // ─── Color Constants ─────────────────────────────────────────────────
  const WHITE = '#FFFFFF';
  const BLACK = '#111111';
  const DARK_BG = '#1a1a2e';
  const GRAY_100 = '#f7f7f8';
  const GRAY_300 = '#d1d5db';
  const GRAY_400 = '#9ca3af';
  const GRAY_500 = '#6b7280';
  const GRAY_600 = '#4b5563';
  const GRAY_700 = '#374151';
  const GREEN_50 = '#f0fdf4';
  const GREEN_700 = '#15803d';
  const BORDER_COLOR = '#e5e7eb';
  const PRIMARY = '#111111';

  return {
    id: 'app_ramotion_blog',
    name: 'Ramotion Blog — Hero Image in Web Design',
    createdAt: now,
    lastModifiedAt: now,
    pages: [{ id: PAGE_ID, name: 'Blog Article' }],
    mainPageId: PAGE_ID,
    dataStore: {},
    variables: [],
    theme: defaultLightTheme,

    components: [
      // ================================================================
      // SECTION 1: NAVIGATION BAR
      // ================================================================
      {
        id: 'CONTAINER_ramotion_nav',
        type: ComponentType.CONTAINER,
        parentId: null,
        pageId: PAGE_ID,
        props: {
          width: '100%',
          height: 'auto',
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center',
          gap: 0,
          backgroundColor: WHITE,
          padding: '16px 48px',
          borderBottom: '1px',
          borderColor: BORDER_COLOR,
          borderStyle: 'solid',
          borderWidth: 0,
          order: 1,
        },
      },

      // Logo
      {
        id: 'LABEL_ramotion_logo',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_nav',
        pageId: PAGE_ID,
        props: {
          text: 'RAMOTION',
          fontSize: 18,
          fontWeight: '700',
          color: BLACK,
          textAlign: 'left',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          width: 'auto',
          height: 'auto',
          order: 1,
        },
      },

      // Spacer
      {
        id: 'CONTAINER_ramotion_nav_spacer',
        type: ComponentType.CONTAINER,
        parentId: 'CONTAINER_ramotion_nav',
        pageId: PAGE_ID,
        props: {
          width: 'auto',
          height: 'auto',
          flexGrow: 1,
          order: 2,
        },
      },

      // Nav Links Container
      {
        id: 'CONTAINER_ramotion_nav_links',
        type: ComponentType.CONTAINER,
        parentId: 'CONTAINER_ramotion_nav',
        pageId: PAGE_ID,
        props: {
          width: 'auto',
          height: 'auto',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 32,
          order: 3,
        },
      },
      {
        id: 'LABEL_ramotion_nav_work',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_nav_links',
        pageId: PAGE_ID,
        props: {
          text: 'Work',
          fontSize: 15,
          fontWeight: '500',
          color: GRAY_700,
          cursor: 'pointer',
          width: 'auto',
          height: 'auto',
          order: 1,
        },
      },
      {
        id: 'LABEL_ramotion_nav_services',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_nav_links',
        pageId: PAGE_ID,
        props: {
          text: 'Services',
          fontSize: 15,
          fontWeight: '500',
          color: GRAY_700,
          cursor: 'pointer',
          width: 'auto',
          height: 'auto',
          order: 2,
        },
      },
      {
        id: 'LABEL_ramotion_nav_about',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_nav_links',
        pageId: PAGE_ID,
        props: {
          text: 'About',
          fontSize: 15,
          fontWeight: '500',
          color: GRAY_700,
          cursor: 'pointer',
          width: 'auto',
          height: 'auto',
          order: 3,
        },
      },
      {
        id: 'LABEL_ramotion_nav_blog',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_nav_links',
        pageId: PAGE_ID,
        props: {
          text: 'Blog',
          fontSize: 15,
          fontWeight: '700',
          color: BLACK,
          cursor: 'pointer',
          width: 'auto',
          height: 'auto',
          order: 4,
        },
      },

      // CTA Container
      {
        id: 'CONTAINER_ramotion_nav_cta',
        type: ComponentType.CONTAINER,
        parentId: 'CONTAINER_ramotion_nav',
        pageId: PAGE_ID,
        props: {
          width: 'auto',
          height: 'auto',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          margin: '0 0 0 32px',
          order: 4,
        },
      },
      {
        id: 'BUTTON_ramotion_subscribe_nav',
        type: ComponentType.BUTTON,
        parentId: 'CONTAINER_ramotion_nav_cta',
        pageId: PAGE_ID,
        props: {
          text: 'Subscribe',
          backgroundColor: WHITE,
          textColor: BLACK,
          variant: 'outlined',
          actionType: 'none',
          fontSize: 14,
          width: 'auto',
          height: 'auto',
          padding: '8px 20px',
          borderRadius: 6,
          borderWidth: 1,
          borderColor: GRAY_300,
          borderStyle: 'solid',
          order: 1,
        },
      },
      {
        id: 'BUTTON_ramotion_contact_nav',
        type: ComponentType.BUTTON,
        parentId: 'CONTAINER_ramotion_nav_cta',
        pageId: PAGE_ID,
        props: {
          text: 'Contact',
          backgroundColor: BLACK,
          textColor: WHITE,
          variant: 'solid',
          actionType: 'none',
          fontSize: 14,
          width: 'auto',
          height: 'auto',
          padding: '8px 20px',
          borderRadius: 6,
          order: 2,
        },
      },

      // ================================================================
      // SECTION 2: BREADCRUMB
      // ================================================================
      {
        id: 'CONTAINER_ramotion_breadcrumb',
        type: ComponentType.CONTAINER,
        parentId: null,
        pageId: PAGE_ID,
        props: {
          width: '100%',
          height: 'auto',
          maxWidth: 900,
          padding: '20px 48px 8px 48px',
          margin: '0 auto',
          flexDirection: 'row',
          alignItems: 'center',
          order: 2,
        },
      },
      {
        id: 'LABEL_ramotion_breadcrumb_text',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_breadcrumb',
        pageId: PAGE_ID,
        props: {
          text: 'Home  /  Blog  /  Hero Image in Web Design',
          fontSize: 13,
          fontWeight: '400',
          color: GRAY_500,
          width: 'auto',
          height: 'auto',
          order: 1,
        },
      },

      // ================================================================
      // SECTION 3: ARTICLE HEADER
      // ================================================================
      {
        id: 'CONTAINER_ramotion_article_header',
        type: ComponentType.CONTAINER,
        parentId: null,
        pageId: PAGE_ID,
        props: {
          width: '100%',
          height: 'auto',
          maxWidth: 900,
          padding: '16px 48px 32px 48px',
          margin: '0 auto',
          flexDirection: 'column',
          gap: 0,
          order: 3,
        },
      },

      // Title
      {
        id: 'LABEL_ramotion_title',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_article_header',
        pageId: PAGE_ID,
        props: {
          text: 'Hero Image in Web Design',
          fontSize: 42,
          fontWeight: '800',
          color: BLACK,
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
          width: '100%',
          height: 'auto',
          order: 1,
        },
      },

      // Authors Row
      {
        id: 'CONTAINER_ramotion_authors',
        type: ComponentType.CONTAINER,
        parentId: 'CONTAINER_ramotion_article_header',
        pageId: PAGE_ID,
        props: {
          width: '100%',
          height: 'auto',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 32,
          margin: '24px 0 0 0',
          order: 2,
        },
      },

      // Author 1
      {
        id: 'CONTAINER_ramotion_author1',
        type: ComponentType.CONTAINER,
        parentId: 'CONTAINER_ramotion_authors',
        pageId: PAGE_ID,
        props: {
          width: 'auto',
          height: 'auto',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          order: 1,
        },
      },
      {
        id: 'IMAGE_ramotion_avatar1',
        type: ComponentType.IMAGE,
        parentId: 'CONTAINER_ramotion_author1',
        pageId: PAGE_ID,
        props: {
          src: 'https://picsum.photos/seed/alex/80/80',
          alt: 'Alex Mika avatar',
          width: 40,
          height: 40,
          borderRadius: '50%',
          objectFit: 'cover',
          order: 1,
        },
      },
      {
        id: 'LABEL_ramotion_author1_name',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_author1',
        pageId: PAGE_ID,
        props: {
          text: 'Written by\n**Alex Mika**',
          textRenderer: 'markdown',
          fontSize: 13,
          fontWeight: '400',
          color: GRAY_600,
          lineHeight: 1.4,
          width: 'auto',
          height: 'auto',
          order: 2,
        },
      },

      // Author 2
      {
        id: 'CONTAINER_ramotion_author2',
        type: ComponentType.CONTAINER,
        parentId: 'CONTAINER_ramotion_authors',
        pageId: PAGE_ID,
        props: {
          width: 'auto',
          height: 'auto',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          order: 2,
        },
      },
      {
        id: 'IMAGE_ramotion_avatar2',
        type: ComponentType.IMAGE,
        parentId: 'CONTAINER_ramotion_author2',
        pageId: PAGE_ID,
        props: {
          src: 'https://picsum.photos/seed/michael/80/80',
          alt: 'Michael Chu avatar',
          width: 40,
          height: 40,
          borderRadius: '50%',
          objectFit: 'cover',
          order: 1,
        },
      },
      {
        id: 'LABEL_ramotion_author2_name',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_author2',
        pageId: PAGE_ID,
        props: {
          text: 'Reviewed by\n**Michael Chu**',
          textRenderer: 'markdown',
          fontSize: 13,
          fontWeight: '400',
          color: GRAY_600,
          lineHeight: 1.4,
          width: 'auto',
          height: 'auto',
          order: 2,
        },
      },

      // Meta info
      {
        id: 'LABEL_ramotion_meta',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_article_header',
        pageId: PAGE_ID,
        props: {
          text: 'Web Design  \u2022  Last updated: Oct 28, 2025  \u2022  16 min read',
          fontSize: 13,
          fontWeight: '400',
          color: GRAY_500,
          margin: '16px 0 0 0',
          width: '100%',
          height: 'auto',
          order: 3,
        },
      },

      // ================================================================
      // SECTION 4: TWO-COLUMN BODY
      // ================================================================
      {
        id: 'CONTAINER_ramotion_body',
        type: ComponentType.CONTAINER,
        parentId: null,
        pageId: PAGE_ID,
        props: {
          width: '100%',
          height: 'auto',
          maxWidth: 1200,
          padding: '0 48px',
          margin: '0 auto',
          flexDirection: 'row',
          gap: 48,
          alignItems: 'flex-start',
          order: 4,
        },
      },

      // ── Main Content Column ──────────────────────────────────────────
      {
        id: 'CONTAINER_ramotion_main',
        type: ComponentType.CONTAINER,
        parentId: 'CONTAINER_ramotion_body',
        pageId: PAGE_ID,
        props: {
          width: '68%',
          height: 'auto',
          flexDirection: 'column',
          gap: 24,
          order: 1,
        },
      },

      // --- Block 1: Intro paragraphs ---
      {
        id: 'LABEL_ramotion_intro',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_main',
        pageId: PAGE_ID,
        props: {
          text: `Do you know that it only takes about 0.05 seconds to form an opinion about the website? Recent studies showed that people make snap judgments. Due to market oversaturation and intense social media activity, 50ms is enough for them to determine whether they will stay or leave.

How can they do that? Simple \u2013 they need well-thought-out visuals. Why? 75% of the people who visit your website will rate your credibility based on web design.

Since the hero area is the first thing they see after landing on the homepage, it plays a decisive role. This area was always used for placing the best and most important visuals. Today, however, many web design agencies take it to the next level by placing a large-scale image, known as a hero image, that occupies the entire viewport.`,
          textRenderer: 'markdown',
          fontSize: 16,
          fontWeight: '400',
          color: GRAY_700,
          lineHeight: 1.75,
          width: '100%',
          height: 'auto',
          order: 1,
        },
      },

      // --- Block 2: H2 - What Is a Hero Image ---
      {
        id: 'LABEL_ramotion_h2_what',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_main',
        pageId: PAGE_ID,
        props: {
          text: '## What Is a Hero Image in Web Design?',
          textRenderer: 'markdown',
          fontSize: 16,
          fontWeight: '400',
          color: BLACK,
          lineHeight: 1.3,
          width: '100%',
          height: 'auto',
          order: 2,
        },
      },

      // --- Block 3: Image 1 ---
      {
        id: 'IMAGE_ramotion_hero1',
        type: ComponentType.IMAGE,
        parentId: 'CONTAINER_ramotion_main',
        pageId: PAGE_ID,
        props: {
          src: 'https://picsum.photos/seed/hero1/900/500',
          alt: 'Hero image example showing large banner on a website',
          width: '100%',
          height: 'auto',
          objectFit: 'cover',
          borderRadius: 8,
          aspectRatio: '16/9',
          order: 3,
        },
      },

      // --- Block 4: Content with bullet list ---
      {
        id: 'LABEL_ramotion_what_content',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_main',
        pageId: PAGE_ID,
        props: {
          text: `A hero image is a large, prominent banner image placed at the top of a web page, typically spanning the full width of the viewport. It is the first visual element users see and is designed to immediately communicate the website\u2019s purpose, personality, and value proposition.

Unlike traditional banner ads or decorative headers, a hero image serves as the visual anchor for the entire page. It sets the tone, establishes the brand aesthetic, and provides an immediate context for the content that follows.

Hero images are used across many types of websites:

- **Corporate sites** \u2014 to convey professionalism and brand identity
- **E-commerce stores** \u2014 to showcase flagship products or seasonal campaigns
- **Portfolio websites** \u2014 to display the creator\u2019s best work front and center
- **Landing pages** \u2014 to capture attention and drive conversions
- **Blogs and magazines** \u2014 to set the editorial tone with a feature image`,
          textRenderer: 'markdown',
          fontSize: 16,
          fontWeight: '400',
          color: GRAY_700,
          lineHeight: 1.75,
          width: '100%',
          height: 'auto',
          order: 4,
        },
      },

      // --- Block 5: H2 - Importance ---
      {
        id: 'LABEL_ramotion_h2_importance',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_main',
        pageId: PAGE_ID,
        props: {
          text: '## Importance of Hero Images in Website Design',
          textRenderer: 'markdown',
          fontSize: 16,
          fontWeight: '400',
          color: BLACK,
          lineHeight: 1.3,
          width: '100%',
          height: 'auto',
          order: 5,
        },
      },

      // --- Block 6: Importance content ---
      {
        id: 'LABEL_ramotion_importance_content',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_main',
        pageId: PAGE_ID,
        props: {
          text: `Having a colossal power to seize users\u2019 attention, this concept has become crucial. Not only is it used to get the most out of users\u2019 short attention span, but it also fulfills several crucial purposes:

- It gives users a sense of what to expect from the rest of a website
- It establishes a foundation for building a strong brand
- It brings value to the target audience right away
- It directs attention to crucial elements
- It makes a dramatic entrance

A well-chosen hero image can significantly impact key performance metrics. Studies show that pages with compelling hero visuals see up to 40% higher engagement rates and longer average session durations. The hero area is your most valuable real estate \u2014 make it count.`,
          textRenderer: 'markdown',
          fontSize: 16,
          fontWeight: '400',
          color: GRAY_700,
          lineHeight: 1.75,
          width: '100%',
          height: 'auto',
          order: 6,
        },
      },

      // --- Block 7: Image 2 ---
      {
        id: 'IMAGE_ramotion_hero2',
        type: ComponentType.IMAGE,
        parentId: 'CONTAINER_ramotion_main',
        pageId: PAGE_ID,
        props: {
          src: 'https://picsum.photos/seed/hero2/900/500',
          alt: 'Diagram showing the impact of hero images on user engagement',
          width: '100%',
          height: 'auto',
          objectFit: 'cover',
          borderRadius: 8,
          aspectRatio: '16/9',
          order: 7,
        },
      },

      // --- Block 8: H2 - Benefits ---
      {
        id: 'LABEL_ramotion_h2_benefits',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_main',
        pageId: PAGE_ID,
        props: {
          text: '## Benefits of a Great Hero Image',
          textRenderer: 'markdown',
          fontSize: 16,
          fontWeight: '400',
          color: BLACK,
          lineHeight: 1.3,
          width: '100%',
          height: 'auto',
          order: 8,
        },
      },

      // --- Block 9: Benefits content ---
      {
        id: 'LABEL_ramotion_benefits_content',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_main',
        pageId: PAGE_ID,
        props: {
          text: `When executed properly, a hero image brings several tangible benefits to your web presence:

**1. First Impressions That Stick**
Users form an opinion about your website in 0.05 seconds. A striking hero image ensures that first impression is positive, memorable, and aligned with your brand identity.

**2. Emotional Connection**
Images process 60,000 times faster than text in the human brain. A carefully selected hero image can evoke emotions \u2014 trust, excitement, curiosity \u2014 that text alone cannot achieve.

**3. Reduced Bounce Rates**
A visually engaging hero section entices visitors to scroll down and explore further, directly reducing bounce rates and increasing time on page.

**4. Stronger Brand Recognition**
Consistent use of high-quality hero imagery across your site reinforces brand identity and makes your website instantly recognizable.

**5. Higher Conversion Rates**
Hero images paired with clear calls-to-action create a powerful conversion funnel. The image draws attention, and the CTA captures the intent.`,
          textRenderer: 'markdown',
          fontSize: 16,
          fontWeight: '400',
          color: GRAY_700,
          lineHeight: 1.75,
          width: '100%',
          height: 'auto',
          order: 9,
        },
      },

      // --- Block 10: H2 - 5 Crucial Elements ---
      {
        id: 'LABEL_ramotion_h2_elements',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_main',
        pageId: PAGE_ID,
        props: {
          text: '## 5 Crucial Elements of a Good Hero Image',
          textRenderer: 'markdown',
          fontSize: 16,
          fontWeight: '400',
          color: BLACK,
          lineHeight: 1.3,
          width: '100%',
          height: 'auto',
          order: 10,
        },
      },

      // --- Block 11: Elements content ---
      {
        id: 'LABEL_ramotion_elements_content',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_main',
        pageId: PAGE_ID,
        props: {
          text: `Creating an effective hero image is not just about picking a beautiful photograph. It requires a strategic approach that balances aesthetics with usability. Here are five crucial elements every great hero image must possess:

### 1. Simplicity
Avoid visual clutter. The hero image should have a clear focal point that doesn\u2019t compete with overlaid text or CTAs. A clean, uncluttered composition ensures the message comes through loud and clear.

### 2. Relevance
The image must directly relate to your brand, product, or the page\u2019s content. An irrelevant (even beautiful) image confuses visitors and erodes trust. Every pixel should serve a purpose.

### 3. Authenticity
Stock photos that look generic can actually harm credibility. Where possible, invest in original photography or custom illustrations that reflect your unique brand personality.

### 4. High Quality
Low-resolution or poorly lit images signal unprofessionalism. Use high-resolution imagery optimized for web \u2014 sharp, well-composed, and color-corrected.

### 5. Emotional Impact
The best hero images tell a story or evoke a feeling. Whether it\u2019s the thrill of adventure for a travel brand or the warmth of home for a real estate site, the emotional resonance is what makes visitors stay.`,
          textRenderer: 'markdown',
          fontSize: 16,
          fontWeight: '400',
          color: GRAY_700,
          lineHeight: 1.75,
          width: '100%',
          height: 'auto',
          order: 11,
        },
      },

      // --- Block 12: Image 3 ---
      {
        id: 'IMAGE_ramotion_hero3',
        type: ComponentType.IMAGE,
        parentId: 'CONTAINER_ramotion_main',
        pageId: PAGE_ID,
        props: {
          src: 'https://picsum.photos/seed/hero3/900/500',
          alt: 'Examples of hero image design elements in practice',
          width: '100%',
          height: 'auto',
          objectFit: 'cover',
          borderRadius: 8,
          aspectRatio: '16/9',
          order: 12,
        },
      },

      // --- Block 13: H2 - Best Practices ---
      {
        id: 'LABEL_ramotion_h2_practices',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_main',
        pageId: PAGE_ID,
        props: {
          text: '## Best Practices for Hero Images',
          textRenderer: 'markdown',
          fontSize: 16,
          fontWeight: '400',
          color: BLACK,
          lineHeight: 1.3,
          width: '100%',
          height: 'auto',
          order: 13,
        },
      },

      // --- Block 14: Best Practices content ---
      {
        id: 'LABEL_ramotion_practices_content',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_main',
        pageId: PAGE_ID,
        props: {
          text: `Implementing hero images effectively requires attention to both design and technical considerations. Follow these best practices to maximize impact:

**Optimize for Performance**
Large images can cripple page load times. Compress your hero images using modern formats like WebP or AVIF, implement lazy loading for below-the-fold content, and consider responsive image techniques with srcset.

**Ensure Text Readability**
If you overlay text on the hero image, use techniques like:

- Semi-transparent gradient overlays
- Text shadows for contrast
- Strategically placed text over less busy image areas
- Sufficient color contrast (WCAG AA minimum)

**Design for Mobile First**
Your hero image will look dramatically different on a 375px phone screen versus a 2560px desktop monitor. Use art direction with the \`<picture>\` element to serve appropriately cropped images for each breakpoint.

**Include a Clear Call-to-Action**
The hero section should guide users toward a primary action. Whether it\u2019s \u201cGet Started,\u201d \u201cLearn More,\u201d or \u201cShop Now,\u201d the CTA should be prominent and visually connected to the hero image.

**Test and Iterate**
A/B test different hero images to see which performs best. Track metrics like click-through rates, scroll depth, and time on page to make data-driven decisions.`,
          textRenderer: 'markdown',
          fontSize: 16,
          fontWeight: '400',
          color: GRAY_700,
          lineHeight: 1.75,
          width: '100%',
          height: 'auto',
          order: 14,
        },
      },

      // --- Block 15: Image 4 ---
      {
        id: 'IMAGE_ramotion_hero4',
        type: ComponentType.IMAGE,
        parentId: 'CONTAINER_ramotion_main',
        pageId: PAGE_ID,
        props: {
          src: 'https://picsum.photos/seed/hero4/900/500',
          alt: 'Comparison of hero image best practices before and after optimization',
          width: '100%',
          height: 'auto',
          objectFit: 'cover',
          borderRadius: 8,
          aspectRatio: '16/9',
          order: 15,
        },
      },

      // --- Block 16: H2 - Great Examples ---
      {
        id: 'LABEL_ramotion_h2_examples',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_main',
        pageId: PAGE_ID,
        props: {
          text: '## Great Examples of Hero Images',
          textRenderer: 'markdown',
          fontSize: 16,
          fontWeight: '400',
          color: BLACK,
          lineHeight: 1.3,
          width: '100%',
          height: 'auto',
          order: 16,
        },
      },

      // --- Block 17: Examples content ---
      {
        id: 'LABEL_ramotion_examples_content',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_main',
        pageId: PAGE_ID,
        props: {
          text: `Let\u2019s look at some standout examples of hero images that get it right:

**Apple** \u2014 Apple consistently uses hero images that are clean, product-focused, and visually stunning. Their hero sections feature the product against minimal backgrounds with precise lighting, letting the design speak for itself.

**Airbnb** \u2014 Airbnb\u2019s hero images evoke wanderlust with authentic travel photography. Combined with a prominent search bar, they seamlessly blend inspiration with functionality.

**Stripe** \u2014 Stripe takes a different approach with abstract, gradient-based hero visuals that feel modern and tech-forward. This proves hero images don\u2019t always need to be photographs.

**National Geographic** \u2014 With access to world-class photography, Nat Geo\u2019s hero images are breathtaking landscapes and wildlife shots that immediately draw you into their stories.

**Ramotion** \u2014 We use carefully crafted hero sections that combine custom illustrations with bold typography to communicate our design expertise and creative approach.`,
          textRenderer: 'markdown',
          fontSize: 16,
          fontWeight: '400',
          color: GRAY_700,
          lineHeight: 1.75,
          width: '100%',
          height: 'auto',
          order: 17,
        },
      },

      // --- Block 18: H2 - Conclusion ---
      {
        id: 'LABEL_ramotion_h2_conclusion',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_main',
        pageId: PAGE_ID,
        props: {
          text: '## Conclusion',
          textRenderer: 'markdown',
          fontSize: 16,
          fontWeight: '400',
          color: BLACK,
          lineHeight: 1.3,
          width: '100%',
          height: 'auto',
          order: 18,
        },
      },

      // --- Block 19: Conclusion content ---
      {
        id: 'LABEL_ramotion_conclusion_content',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_main',
        pageId: PAGE_ID,
        props: {
          text: `The hero image is far more than a decorative element \u2014 it is the visual handshake between your brand and every visitor. In a digital landscape where attention spans are measured in milliseconds, the hero area remains your single most powerful tool for making an unforgettable first impression.

By focusing on simplicity, relevance, authenticity, quality, and emotional impact, you can create hero images that not only capture attention but also drive engagement and conversions. Remember: your hero image sets the stage for everything that follows. Make it count.

Whether you\u2019re redesigning an existing site or building from scratch, invest the time to get your hero image right. Test different approaches, gather data, and iterate. The payoff \u2014 in user engagement, brand perception, and business results \u2014 is well worth the effort.`,
          textRenderer: 'markdown',
          fontSize: 16,
          fontWeight: '400',
          color: GRAY_700,
          lineHeight: 1.75,
          width: '100%',
          height: 'auto',
          margin: '0 0 32px 0',
          order: 19,
        },
      },

      // ── Sidebar Column ───────────────────────────────────────────────
      {
        id: 'CONTAINER_ramotion_sidebar',
        type: ComponentType.CONTAINER,
        parentId: 'CONTAINER_ramotion_body',
        pageId: PAGE_ID,
        props: {
          width: '28%',
          height: 'auto',
          flexDirection: 'column',
          gap: 0,
          order: 2,
        },
      },

      // TOC Card
      {
        id: 'CONTAINER_ramotion_toc_card',
        type: ComponentType.CONTAINER,
        parentId: 'CONTAINER_ramotion_sidebar',
        pageId: PAGE_ID,
        props: {
          width: '100%',
          height: 'auto',
          flexDirection: 'column',
          gap: 12,
          backgroundColor: GREEN_50,
          padding: '24px',
          borderRadius: 8,
          order: 1,
        },
      },
      {
        id: 'LABEL_ramotion_toc_title',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_toc_card',
        pageId: PAGE_ID,
        props: {
          text: 'Table of Contents',
          fontSize: 16,
          fontWeight: '700',
          color: GREEN_700,
          width: '100%',
          height: 'auto',
          order: 1,
        },
      },
      {
        id: 'DIVIDER_ramotion_toc_divider',
        type: ComponentType.DIVIDER,
        parentId: 'CONTAINER_ramotion_toc_card',
        pageId: PAGE_ID,
        props: {
          color: '#bbf7d0',
          width: '100%',
          height: 2,
          order: 2,
        },
      },
      {
        id: 'LABEL_ramotion_toc_list',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_toc_card',
        pageId: PAGE_ID,
        props: {
          text: `1. What Is a Hero Image in Web Design?
2. Importance of Hero Images
3. Benefits of a Great Hero Image
4. 5 Crucial Elements
5. Best Practices
6. Great Examples
7. Conclusion`,
          textRenderer: 'markdown',
          fontSize: 14,
          fontWeight: '400',
          color: GRAY_700,
          lineHeight: 2,
          cursor: 'pointer',
          width: '100%',
          height: 'auto',
          order: 3,
        },
      },

      // Sidebar CTA Card
      {
        id: 'CONTAINER_ramotion_sidebar_cta',
        type: ComponentType.CONTAINER,
        parentId: 'CONTAINER_ramotion_sidebar',
        pageId: PAGE_ID,
        props: {
          width: '100%',
          height: 'auto',
          flexDirection: 'column',
          gap: 16,
          backgroundColor: BLACK,
          padding: '28px 24px',
          borderRadius: 8,
          margin: '24px 0 0 0',
          order: 2,
        },
      },
      {
        id: 'LABEL_ramotion_sidebar_cta_title',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_sidebar_cta',
        pageId: PAGE_ID,
        props: {
          text: 'Need help with your hero section?',
          fontSize: 18,
          fontWeight: '700',
          color: WHITE,
          lineHeight: 1.3,
          width: '100%',
          height: 'auto',
          order: 1,
        },
      },
      {
        id: 'LABEL_ramotion_sidebar_cta_desc',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_sidebar_cta',
        pageId: PAGE_ID,
        props: {
          text: 'Our design team can create stunning hero sections that convert visitors into customers.',
          fontSize: 14,
          fontWeight: '400',
          color: GRAY_400,
          lineHeight: 1.6,
          width: '100%',
          height: 'auto',
          order: 2,
        },
      },
      {
        id: 'BUTTON_ramotion_sidebar_cta_btn',
        type: ComponentType.BUTTON,
        parentId: 'CONTAINER_ramotion_sidebar_cta',
        pageId: PAGE_ID,
        props: {
          text: 'Get in Touch',
          backgroundColor: WHITE,
          textColor: BLACK,
          variant: 'solid',
          actionType: 'none',
          fontSize: 14,
          fullWidth: true,
          width: '100%',
          height: 'auto',
          padding: '10px 20px',
          borderRadius: 6,
          order: 3,
        },
      },

      // ================================================================
      // SECTION 5: FOOTER
      // ================================================================
      {
        id: 'CONTAINER_ramotion_footer',
        type: ComponentType.CONTAINER,
        parentId: null,
        pageId: PAGE_ID,
        props: {
          width: '100%',
          height: 'auto',
          flexDirection: 'column',
          gap: 32,
          backgroundColor: DARK_BG,
          padding: '48px',
          margin: '48px 0 0 0',
          order: 5,
        },
      },

      // Newsletter Row
      {
        id: 'CONTAINER_ramotion_newsletter',
        type: ComponentType.CONTAINER,
        parentId: 'CONTAINER_ramotion_footer',
        pageId: PAGE_ID,
        props: {
          width: '100%',
          height: 'auto',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          order: 1,
        },
      },
      {
        id: 'LABEL_ramotion_newsletter_title',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_newsletter',
        pageId: PAGE_ID,
        props: {
          text: 'Sign up for our newsletter',
          fontSize: 20,
          fontWeight: '700',
          color: WHITE,
          width: 'auto',
          height: 'auto',
          order: 1,
        },
      },
      {
        id: 'BUTTON_ramotion_newsletter_btn',
        type: ComponentType.BUTTON,
        parentId: 'CONTAINER_ramotion_newsletter',
        pageId: PAGE_ID,
        props: {
          text: 'Subscribe',
          backgroundColor: '#4f46e5',
          textColor: WHITE,
          variant: 'solid',
          actionType: 'none',
          fontSize: 14,
          width: 'auto',
          height: 'auto',
          padding: '10px 28px',
          borderRadius: 6,
          order: 2,
        },
      },

      // Footer Divider
      {
        id: 'DIVIDER_ramotion_footer',
        type: ComponentType.DIVIDER,
        parentId: 'CONTAINER_ramotion_footer',
        pageId: PAGE_ID,
        props: {
          color: '#2d2d4a',
          width: '100%',
          height: 1,
          order: 2,
        },
      },

      // Link Columns Row
      {
        id: 'CONTAINER_ramotion_footer_links',
        type: ComponentType.CONTAINER,
        parentId: 'CONTAINER_ramotion_footer',
        pageId: PAGE_ID,
        props: {
          width: '100%',
          height: 'auto',
          flexDirection: 'row',
          gap: 32,
          flexWrap: 'wrap',
          order: 3,
        },
      },

      // --- Column 1: Social ---
      {
        id: 'CONTAINER_ramotion_footer_social',
        type: ComponentType.CONTAINER,
        parentId: 'CONTAINER_ramotion_footer_links',
        pageId: PAGE_ID,
        props: {
          width: 180,
          height: 'auto',
          flexDirection: 'column',
          gap: 10,
          order: 1,
        },
      },
      {
        id: 'LABEL_ramotion_footer_social_title',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_footer_social',
        pageId: PAGE_ID,
        props: {
          text: 'Social',
          fontSize: 14,
          fontWeight: '700',
          color: WHITE,
          width: 'auto',
          height: 'auto',
          order: 1,
        },
      },
      {
        id: 'LABEL_ramotion_footer_linkedin',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_footer_social',
        pageId: PAGE_ID,
        props: {
          text: 'LinkedIn',
          fontSize: 14,
          fontWeight: '400',
          color: GRAY_400,
          cursor: 'pointer',
          width: 'auto',
          height: 'auto',
          order: 2,
        },
      },
      {
        id: 'LABEL_ramotion_footer_instagram',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_footer_social',
        pageId: PAGE_ID,
        props: {
          text: 'Instagram',
          fontSize: 14,
          fontWeight: '400',
          color: GRAY_400,
          cursor: 'pointer',
          width: 'auto',
          height: 'auto',
          order: 3,
        },
      },
      {
        id: 'LABEL_ramotion_footer_dribbble',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_footer_social',
        pageId: PAGE_ID,
        props: {
          text: 'Dribbble',
          fontSize: 14,
          fontWeight: '400',
          color: GRAY_400,
          cursor: 'pointer',
          width: 'auto',
          height: 'auto',
          order: 4,
        },
      },

      // --- Column 2: Company ---
      {
        id: 'CONTAINER_ramotion_footer_company',
        type: ComponentType.CONTAINER,
        parentId: 'CONTAINER_ramotion_footer_links',
        pageId: PAGE_ID,
        props: {
          width: 180,
          height: 'auto',
          flexDirection: 'column',
          gap: 10,
          order: 2,
        },
      },
      {
        id: 'LABEL_ramotion_footer_company_title',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_footer_company',
        pageId: PAGE_ID,
        props: {
          text: 'Company',
          fontSize: 14,
          fontWeight: '700',
          color: WHITE,
          width: 'auto',
          height: 'auto',
          order: 1,
        },
      },
      {
        id: 'LABEL_ramotion_footer_about',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_footer_company',
        pageId: PAGE_ID,
        props: {
          text: 'About',
          fontSize: 14,
          fontWeight: '400',
          color: GRAY_400,
          cursor: 'pointer',
          width: 'auto',
          height: 'auto',
          order: 2,
        },
      },
      {
        id: 'LABEL_ramotion_footer_cases',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_footer_company',
        pageId: PAGE_ID,
        props: {
          text: 'Case studies',
          fontSize: 14,
          fontWeight: '400',
          color: GRAY_400,
          cursor: 'pointer',
          width: 'auto',
          height: 'auto',
          order: 3,
        },
      },
      {
        id: 'LABEL_ramotion_footer_process',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_footer_company',
        pageId: PAGE_ID,
        props: {
          text: 'Process',
          fontSize: 14,
          fontWeight: '400',
          color: GRAY_400,
          cursor: 'pointer',
          width: 'auto',
          height: 'auto',
          order: 4,
        },
      },
      {
        id: 'LABEL_ramotion_footer_services',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_footer_company',
        pageId: PAGE_ID,
        props: {
          text: 'Services',
          fontSize: 14,
          fontWeight: '400',
          color: GRAY_400,
          cursor: 'pointer',
          width: 'auto',
          height: 'auto',
          order: 5,
        },
      },

      // --- Column 3: Learn ---
      {
        id: 'CONTAINER_ramotion_footer_learn',
        type: ComponentType.CONTAINER,
        parentId: 'CONTAINER_ramotion_footer_links',
        pageId: PAGE_ID,
        props: {
          width: 180,
          height: 'auto',
          flexDirection: 'column',
          gap: 10,
          order: 3,
        },
      },
      {
        id: 'LABEL_ramotion_footer_learn_title',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_footer_learn',
        pageId: PAGE_ID,
        props: {
          text: 'Learn',
          fontSize: 14,
          fontWeight: '700',
          color: WHITE,
          width: 'auto',
          height: 'auto',
          order: 1,
        },
      },
      {
        id: 'LABEL_ramotion_footer_reviews',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_footer_learn',
        pageId: PAGE_ID,
        props: {
          text: 'Reviews',
          fontSize: 14,
          fontWeight: '400',
          color: GRAY_400,
          cursor: 'pointer',
          width: 'auto',
          height: 'auto',
          order: 2,
        },
      },
      {
        id: 'LABEL_ramotion_footer_faqs',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_footer_learn',
        pageId: PAGE_ID,
        props: {
          text: 'FAQs',
          fontSize: 14,
          fontWeight: '400',
          color: GRAY_400,
          cursor: 'pointer',
          width: 'auto',
          height: 'auto',
          order: 3,
        },
      },
      {
        id: 'LABEL_ramotion_footer_articles',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_footer_learn',
        pageId: PAGE_ID,
        props: {
          text: 'Articles',
          fontSize: 14,
          fontWeight: '400',
          color: GRAY_400,
          cursor: 'pointer',
          width: 'auto',
          height: 'auto',
          order: 4,
        },
      },
      {
        id: 'LABEL_ramotion_footer_careers',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_footer_learn',
        pageId: PAGE_ID,
        props: {
          text: 'Careers',
          fontSize: 14,
          fontWeight: '400',
          color: GRAY_400,
          cursor: 'pointer',
          width: 'auto',
          height: 'auto',
          order: 5,
        },
      },

      // --- Column 4: Get in touch ---
      {
        id: 'CONTAINER_ramotion_footer_contact',
        type: ComponentType.CONTAINER,
        parentId: 'CONTAINER_ramotion_footer_links',
        pageId: PAGE_ID,
        props: {
          width: 180,
          height: 'auto',
          flexDirection: 'column',
          gap: 10,
          order: 4,
        },
      },
      {
        id: 'LABEL_ramotion_footer_contact_title',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_footer_contact',
        pageId: PAGE_ID,
        props: {
          text: 'Get in touch',
          fontSize: 14,
          fontWeight: '700',
          color: WHITE,
          width: 'auto',
          height: 'auto',
          order: 1,
        },
      },
      {
        id: 'LABEL_ramotion_footer_phone',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_footer_contact',
        pageId: PAGE_ID,
        props: {
          text: '+1 888 410 8885',
          fontSize: 14,
          fontWeight: '400',
          color: GRAY_400,
          cursor: 'pointer',
          width: 'auto',
          height: 'auto',
          order: 2,
        },
      },
      {
        id: 'LABEL_ramotion_footer_contactus',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_footer_contact',
        pageId: PAGE_ID,
        props: {
          text: 'Contact us',
          fontSize: 14,
          fontWeight: '400',
          color: GRAY_400,
          cursor: 'pointer',
          width: 'auto',
          height: 'auto',
          order: 3,
        },
      },

      // Copyright
      {
        id: 'LABEL_ramotion_copyright',
        type: ComponentType.LABEL,
        parentId: 'CONTAINER_ramotion_footer',
        pageId: PAGE_ID,
        props: {
          text: '\u00a9 2026 Ramotion Inc. All rights reserved.',
          fontSize: 12,
          fontWeight: '400',
          color: GRAY_500,
          textAlign: 'center',
          width: '100%',
          height: 'auto',
          margin: '16px 0 0 0',
          order: 4,
        },
      },
    ],
  };
}
