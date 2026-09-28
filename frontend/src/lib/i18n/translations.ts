/**
 * Bilingual (English / Hindi) content for the public marketing site — owner
 * correction: "an additional hindi language should also be part of it for
 * the regional visitors/customers to easily understand."
 *
 * TWO KINDS OF ENTRY IN THIS FILE, deliberately kept separate:
 *
 * 1. `UI_TEXT` — static interface chrome (nav labels, buttons, headings,
 *    hints, form labels) that has no other identity in the app. Looked up
 *    by dotted path via `t(lang, path)`; falls back to the English string
 *    if a Hindi key is ever missing, so a gap here never renders blank.
 *
 * 2. The `*_HI` lookup maps below — Hindi translations of content that
 *    lives in `src/lib/content/public-site.ts` (services, projects, FAQ,
 *    package copy, etc.) and other component-local data arrays (About's
 *    stats/core values, How It Works' steps, Why Us' reasons). These are
 *    kept as separate EN-string → HI-string maps, keyed by the exact
 *    English value already in that data, rather than rewriting the
 *    underlying arrays to carry a `titleHi`/`descriptionHi` field. That's a
 *    deliberate choice: those English strings are also used as React `key`
 *    props, matched against elsewhere (e.g. `CONTACT_SUBJECT_OPTIONS` is
 *    derived from `CONFIRMED_SERVICES[].title`, and a real backend would
 *    eventually match on these same English names), so leaving the
 *    canonical data untouched and adding a display-only translation layer
 *    alongside it is lower-risk than restructuring already-working,
 *    cross-referenced content. `localize()` below does the lookup with a
 *    same safety net: an English value with no Hindi entry still renders
 *    (in English) instead of disappearing.
 *
 * SCOPE OF THIS PASS (docs/OPEN_QUESTIONS.md #77) — translated: header nav,
 * footer, Home hero, About, Services, How It Works, Projects/Portfolio,
 * Why Us, the "Traditional Way vs. BrickBasket Way" comparison, FAQ,
 * Contact (incl. the lead form), the Cost Estimator's full UI (labels,
 * buttons, hints, the dynamic result sentences), Plans page chrome, the
 * Package Comparison Table (incl. all 4 packages' core-features/best-for
 * copy and comparison-row text), the Package Specs Accordion's category
 * *labels*, and every standalone page's `PageBanner` title/breadcrumb.
 *
 * DELIBERATELY LEFT ENGLISH-ONLY, flagged for follow-up: the Package Specs
 * Accordion's ~100+ per-tier specification bullets (9 categories × 4 tiers)
 * in `PACKAGE_SPEC_CATEGORIES`. That list is dense, real construction
 * terminology (concrete grades, fitting/fixture tiers, wiring gauges) where
 * a mistranslated technical term could misrepresent what's actually being
 * built — exactly the kind of content this codebase's standing discipline
 * treats as needing domain/owner review before publishing, not a
 * best-effort machine translation. See docs/OPEN_QUESTIONS.md #77 for the
 * full reasoning and the same "structure's in place, content needs owner
 * input" pattern already used for the accordion's English content itself.
 * Internal admin/customer-portal screens are also untouched — staff-facing
 * tooling stays English, consistent with how this codebase already treats
 * every other internal module.
 */

export type Lang = "en" | "hi";

type Dict = { [key: string]: string | Dict };

const en = {
  nav: {
    home: "Home",
    about: "About Us",
    services: "Services",
    howItWorks: "How It Works",
    costEstimator: "Cost Estimator",
    projects: "Projects",
    whyUs: "Why Us",
    faq: "FAQ",
    contact: "Contact",
    login: "Login",
    myAccount: "My Account",
    getQuote: "Get a Quote",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    language: "Language",
  },
  footer: {
    tagline: "Premium construction and real estate solutions.",
    quickLinks: "Quick Links",
    plansPackages: "Plans & Packages",
    servicesHeading: "Services",
    contactUs: "Contact Us",
    location: "Lucknow, Uttar Pradesh",
    rights: "All Rights Reserved.",
    privacy: "Privacy Policy",
    terms: "Terms & Conditions",
  },
  hero: {
    title: "Building {{Stronger Spaces}} for a Better Tomorrow",
    subtitle:
      "Premium construction and real estate solutions built on trust, transparency and quality.",
    exploreServices: "Explore Services",
    watchVideo: "Watch Video",
  },
  about: {
    eyebrow: "Who We Are",
    paragraph1:
      "BrickBasket is a premium construction and real estate company delivering end-to-end building solutions with transparency, quality and commitment. We bridge the gap between your vision and its successful execution by creating exceptional value through our robust and transparent construction ecosystem.",
    paragraph2:
      "We transform ideas into exceptional spaces that inspire, empower, and stand the test of time. Every project is thoughtfully designed to create unique living and working environments that enhance the lives of their occupants.",
    paragraph3:
      "With a customer-first approach and a passion for excellence, BrickBasket is committed to “Crafting Buildings as a Symbol of Your Identity.” This vision is reflected in every project we undertake.",
    coreValuesEyebrow: "Our Core Values",
    coreValuesTitle: "What Drives Us Forward",
  },
  services: {
    eyebrow: "Our Services",
    title: "Comprehensive {{Solutions}} for Every Need",
  },
  howItWorks: {
    step: "Step",
    headingEyebrow: "Our Process",
    headingTitle: "From Idea to Handover",
  },
  projects: {
    eyebrow: "Our Work",
    title: "Featured Projects",
    noProjects: "No projects in this category yet.",
    filterAria: "Filter projects",
  },
  whyUs: {
    headingEyebrow: "Why BrickBasket",
    headingTitle: "Why Choose BrickBasket?",
  },
  comparison: {
    colTopic: "Topic",
    colTraditional: "The Traditional Way",
    colBrickBasket: "The BrickBasket Way",
    headingEyebrow: "The Difference",
    headingTitle: "The Traditional Way vs. The BrickBasket Way",
  },
  faq: {
    headingEyebrow: "Got Questions?",
    headingTitle: "Frequently Asked Questions",
  },
  contact: {
    eyebrow: "Get in Touch",
    heading: "We are here to help",
    subheading: "Reach out to us for any inquiries or project consultations.",
    addressLabel: "Address",
    phoneLabel: "Phone",
    emailLabel: "Email",
    websiteLabel: "Website",
    closingBand: "We look forward to connecting with you.",
    mapAlt: "Map showing the BrickBasket office location in Gomti Nagar, Lucknow",
    form: {
      yourName: "Your Name",
      yourEmail: "Your Email",
      yourPhone: "Your Phone",
      subject: "Subject",
      chooseSubject: "Choose a subject",
      messageLabel: "Your Message / Objective",
      messagePlaceholder:
        "Tell us a bit about your project or what you'd like help with (optional)",
      send: "Send Message",
      sentTitle: "Message sent",
      sentBody: "Thanks for reaching out. We’ll review your enquiry and get back to you.",
      sendAnother: "Send another message",
      errName: "Enter your full name",
      errEmail: "Enter a valid email address",
      errPhone: "Enter a valid phone number",
      errSubject: "Let us know what this is about",
    },
  },
  closingCta: {
    title: "Let's Build {{The Best In Class}} Together",
    subtitle: "Ready to start your next project?",
    button: "Get Consultation Now",
  },
  plans: {
    eyebrow: "Built Around You",
    title: "Four Packages, Real Published Rates",
    intro:
      "Every package below covers full architectural design through construction execution — the difference is depth of visualization, project management and finish quality. Pick one and use the estimator below to see an indicative cost for your own plot.",
    bestFor: "Best for",
    ctaButton: "Get a Custom Quote",
  },
  packageComparisonTable: {
    heading: "Compare what's included",
    description:
      "Each package includes everything the one before it does, plus what's shown below — so the price difference maps directly to what you actually get.",
    colPackage: "Package",
    colRate: "Rate",
    colBestFor: "Best For",
    selectedBadge: "Selected",
  },
  packageSpecsAccordion: {
    heading: "Package specifications",
    description:
      "Tap any category to see exactly what's included at each tier — from design and structure through to the final finishing touches.",
    disclaimer:
      "Illustrative specification bands, not a substitute for the exact materials and makes confirmed for your project — those are attached directly to your Contract before construction begins.",
    detailsNoteTitle: "Detailed material & brand specifications",
    detailsNote:
      "The exact make/brand for each item in every category above is confirmed in your Contract's attached specification sheet, not shown here — ask our team for the full spec list in your preferred language.",
  },
  pageBanner: {
    about: { title: "About Us", current: "About Us" },
    services: { title: "Our Services", current: "Services" },
    howItWorks: { title: "How It Works", current: "How It Works" },
    whyUs: { title: "Why Choose BrickBasket?", current: "Why Us" },
    faq: { title: "Frequently Asked Questions", current: "FAQ" },
    contact: { title: "Contact Us", current: "Contact" },
    portfolio: { title: "Our Projects", current: "Projects" },
    plans: { title: "Plans & Packages", current: "Plans" },
    login: { title: "Login", current: "Login" },
    register: { title: "Register", current: "Register" },
  },
  costEstimator: {
    headingEyebrow: "Budget Planning",
    headingTitle: "Estimate Your Build Cost",
    step1Legend: "1. Choose a package",
    step2Legend: "2. Tell us about your project",
    modeBasic: "I have basic details",
    modeAll: "I have all details",
    modeBasicHint: "I just know my plot area",
    modeAllHint: "I have my exact built-up/plinth area",
    plotAreaLabel: "Plot Area (sqft)",
    plotAreaHint:
      "The total area of land you own, including the footprint of any structures on it.",
    groundCoverageLabel: "Assumed Ground Coverage",
    groundCoverageHint:
      "How much of your plot the building's footprint typically covers, after setbacks — this varies by city and plot size, so adjust it if you know your local rule.",
    typicalDefault: "(typical default)",
    switchToAllDetails: "Switch to “I have all details”",
    plinthAreaLabel: "Plinth Area (sqft)",
    plinthAreaHint: "The built footprint of your home at ground level.",
    floorsLabel: "Number of Floors",
    ownsLandLegend: "Do you already own the plot of land?",
    yes: "Yes",
    no: "No",
    noLandNote: "No land yet? Our Land Purchase service can help you find the right plot first.",
    noLandNotePre: "No land yet? Our",
    noLandNotePost: "service can help you find the right plot first.",
    landPurchaseLink: "Land Purchase",
    derivedPlinthAreaLabel: "Derived Plinth Area",
    knowExactPlinthArea: "Know your exact plinth area instead?",
    timelineLabel: "When do you want to start construction?",
    timelineHint: "Optional — helps our team prioritize your follow-up.",
    preferNotToSay: "Prefer not to say",
    locationLabel: "Project Location (City / Area)",
    locationHint: "Optional — we're based in Lucknow; let us know if your project is elsewhere.",
    locationPlaceholder: "e.g. Gomti Nagar, Lucknow",
    estimatedCostLabel: "Estimated Project Cost",
    getDetailedQuote: "Get a Detailed, Site-Specific Quote",
    savePrint: "Save / Print This Estimate",
    downloadExcel: "Download as Excel",
    enterPlotAreaPrompt:
      "Enter your plot area above to see an estimated cost for your selected package.",
    enterPlinthAreaPrompt:
      "Enter your plinth area above to see an estimated cost for your selected package.",
    compareHeading: "Compare all packages for this size",
    estimatedCost: "Estimated Cost",
    includesHeading: "What this estimate includes",
    disclaimerFooter:
      "All figures above are indicative only. Actual materials, brands and quantities are finalized against your specific structural drawings.",
    followUpHeading: "Want this followed up by our team?",
    fullName: "Full Name",
    mobileNumber: "Mobile Number",
    emailAddress: "Email",
    consentText:
      "I agree to be contacted by BrickBasket about this enquiry, and to the Privacy Policy and Terms & Conditions.",
    sendEstimate: "Send My Estimate to the Team",
    thanksTitle: "Thanks — we've got your estimate",
    sendAnotherEnquiry: "Send another enquiry",
    errName: "Enter your full name",
    errEmail: "Enter a valid email address",
    errPhone: "Enter a valid phone number",
    errConsent: "Please accept the Privacy Policy and Terms & Conditions to continue",
    csvHeading: "BrickBasket Estimate Summary",
    csvGeneratedOn: "Generated on",
    csvPackage: "Package",
    csvRate: "Rate (₹/sqft)",
    csvBuiltUpArea: "Built-up Area (sqft)",
    csvFloors: "Floors",
    csvOwnsLand: "Owns Land",
    csvTimeline: "Preferred Timeline",
    csvLocation: "Project Location",
    csvEstimatedCost: "Estimated Cost",
    csvComparisonHeading: "Comparison — All Packages (same size)",
    csvDisclaimer:
      "Indicative estimate only, not a final quote. Actual materials, brands and quantities are finalized against your specific structural drawings.",
    printedOn: "Printed on",
  },
} as const satisfies Dict;

const hi = {
  nav: {
    home: "होम",
    about: "हमारे बारे में",
    services: "सेवाएं",
    howItWorks: "यह कैसे काम करता है",
    costEstimator: "लागत अनुमानक",
    projects: "प्रोजेक्ट्स",
    whyUs: "हमें क्यों चुनें",
    faq: "सामान्य प्रश्न",
    contact: "संपर्क करें",
    login: "लॉगिन",
    myAccount: "मेरा खाता",
    getQuote: "कोटेशन प्राप्त करें",
    openMenu: "मेनू खोलें",
    closeMenu: "मेनू बंद करें",
    language: "भाषा",
  },
  footer: {
    tagline: "प्रीमियम निर्माण और रियल एस्टेट समाधान।",
    quickLinks: "त्वरित लिंक",
    plansPackages: "योजनाएं और पैकेज",
    servicesHeading: "सेवाएं",
    contactUs: "संपर्क करें",
    location: "लखनऊ, उत्तर प्रदेश",
    rights: "सर्वाधिकार सुरक्षित।",
    privacy: "गोपनीयता नीति",
    terms: "नियम एवं शर्तें",
  },
  hero: {
    title: "बेहतर कल के लिए {{मज़बूत और भरोसेमंद स्थानों}} का निर्माण",
    subtitle: "विश्वास, पारदर्शिता और गुणवत्ता पर आधारित प्रीमियम निर्माण और रियल एस्टेट समाधान।",
    exploreServices: "सेवाएं देखें",
    watchVideo: "वीडियो देखें",
  },
  about: {
    eyebrow: "हम कौन हैं",
    paragraph1:
      "BrickBasket एक प्रीमियम निर्माण और रियल एस्टेट कंपनी है जो पारदर्शिता, गुणवत्ता और प्रतिबद्धता के साथ शुरू से अंत तक भवन निर्माण समाधान प्रदान करती है। हम अपने मजबूत और पारदर्शी निर्माण तंत्र के माध्यम से असाधारण मूल्य बनाकर आपकी कल्पना और उसके सफल क्रियान्वयन के बीच की दूरी को पाटते हैं।",
    paragraph2:
      "हम विचारों को ऐसे असाधारण स्थानों में बदलते हैं जो प्रेरित करें, सशक्त बनाएं और समय की कसौटी पर खरे उतरें। हर प्रोजेक्ट को सोच-समझकर इस तरह डिज़ाइन किया जाता है कि वह रहने और काम करने वालों के जीवन को बेहतर बनाने वाले विशिष्ट वातावरण का निर्माण करे।",
    paragraph3:
      "ग्राहक-प्रथम दृष्टिकोण और उत्कृष्टता के जुनून के साथ, BrickBasket “आपकी पहचान के प्रतीक के रूप में भवनों का निर्माण” करने के लिए प्रतिबद्ध है। यह दृष्टिकोण हमारे हर प्रोजेक्ट में झलकता है।",
    coreValuesEyebrow: "हमारे मूल मूल्य",
    coreValuesTitle: "हमें आगे बढ़ाने वाली बातें",
  },
  services: {
    eyebrow: "हमारी सेवाएं",
    title: "हर ज़रूरत के लिए {{संपूर्ण समाधान}}",
  },
  howItWorks: {
    step: "चरण",
    headingEyebrow: "हमारी प्रक्रिया",
    headingTitle: "विचार से हैंडओवर तक",
  },
  projects: {
    eyebrow: "हमारा कार्य",
    title: "प्रमुख प्रोजेक्ट्स",
    noProjects: "इस श्रेणी में अभी तक कोई प्रोजेक्ट नहीं है।",
    filterAria: "प्रोजेक्ट्स फ़िल्टर करें",
  },
  whyUs: {
    headingEyebrow: "BrickBasket क्यों",
    headingTitle: "BrickBasket को क्यों चुनें?",
  },
  comparison: {
    colTopic: "विषय",
    colTraditional: "पारंपरिक तरीका",
    colBrickBasket: "BrickBasket का तरीका",
    headingEyebrow: "अंतर",
    headingTitle: "पारंपरिक तरीका बनाम BrickBasket का तरीका",
  },
  faq: {
    headingEyebrow: "कोई सवाल है?",
    headingTitle: "सामान्य प्रश्न",
  },
  contact: {
    eyebrow: "संपर्क में रहें",
    heading: "हम मदद के लिए यहां हैं",
    subheading: "किसी भी पूछताछ या प्रोजेक्ट परामर्श के लिए हमसे संपर्क करें।",
    addressLabel: "पता",
    phoneLabel: "फ़ोन",
    emailLabel: "ईमेल",
    websiteLabel: "वेबसाइट",
    closingBand: "हम आपसे जुड़ने के लिए उत्सुक हैं।",
    mapAlt: "लखनऊ के गोमती नगर में BrickBasket कार्यालय का स्थान दिखाने वाला मानचित्र",
    form: {
      yourName: "आपका नाम",
      yourEmail: "आपका ईमेल",
      yourPhone: "आपका फ़ोन नंबर",
      subject: "विषय",
      chooseSubject: "एक विषय चुनें",
      messageLabel: "आपका संदेश / उद्देश्य",
      messagePlaceholder:
        "अपने प्रोजेक्ट के बारे में थोड़ा बताएं या आपको किस चीज़ में मदद चाहिए (वैकल्पिक)",
      send: "संदेश भेजें",
      sentTitle: "संदेश भेज दिया गया",
      sentBody:
        "संपर्क करने के लिए धन्यवाद। हम आपकी पूछताछ की समीक्षा करेंगे और आपसे संपर्क करेंगे।",
      sendAnother: "एक और संदेश भेजें",
      errName: "अपना पूरा नाम दर्ज करें",
      errEmail: "एक मान्य ईमेल पता दर्ज करें",
      errPhone: "एक मान्य फ़ोन नंबर दर्ज करें",
      errSubject: "कृपया बताएं यह किस बारे में है",
    },
  },
  closingCta: {
    title: "आइए मिलकर बनाएं {{सर्वश्रेष्ठ दर्जे का निर्माण}}",
    subtitle: "अपना अगला प्रोजेक्ट शुरू करने के लिए तैयार हैं?",
    button: "अभी परामर्श लें",
  },
  plans: {
    eyebrow: "आपके अनुसार बनाया गया",
    title: "चार पैकेज, वास्तविक प्रकाशित दरें",
    intro:
      "नीचे दिया गया हर पैकेज पूर्ण वास्तु डिज़ाइन से लेकर निर्माण क्रियान्वयन तक सब कुछ कवर करता है — अंतर केवल विज़ुअलाइज़ेशन की गहराई, प्रोजेक्ट प्रबंधन और फिनिश की गुणवत्ता में है। एक चुनें और अपने प्लॉट के लिए अनुमानित लागत देखने हेतु नीचे दिए गए अनुमानक का उपयोग करें।",
    bestFor: "इनके लिए उपयुक्त",
    ctaButton: "कस्टम कोटेशन प्राप्त करें",
  },
  packageComparisonTable: {
    heading: "देखें क्या शामिल है",
    description:
      "हर पैकेज में उससे पहले वाले पैकेज की हर चीज़ शामिल है, साथ ही नीचे दिखाई गई चीज़ें भी — इसलिए कीमत का अंतर सीधे उससे जुड़ा है जो आपको वास्तव में मिलता है।",
    colPackage: "पैकेज",
    colRate: "दर",
    colBestFor: "इनके लिए उपयुक्त",
    selectedBadge: "चयनित",
  },
  packageSpecsAccordion: {
    heading: "पैकेज विनिर्देश",
    description:
      "हर टियर में वास्तव में क्या शामिल है यह देखने के लिए किसी भी श्रेणी पर टैप करें — डिज़ाइन और संरचना से लेकर अंतिम फिनिशिंग टच तक।",
    disclaimer:
      "यह उदाहरण के तौर पर दिखाई गई विनिर्देश श्रेणियां हैं, आपके प्रोजेक्ट के लिए तय की गई सटीक सामग्री और ब्रांड का विकल्प नहीं — वे निर्माण शुरू होने से पहले सीधे आपके कॉन्ट्रैक्ट से जुड़ी होती हैं।",
    detailsNoteTitle: "विस्तृत सामग्री और ब्रांड विनिर्देश",
    detailsNote:
      "ऊपर हर श्रेणी में हर वस्तु का सटीक ब्रांड/मेक आपके कॉन्ट्रैक्ट की संलग्न विनिर्देश शीट में तय किया जाता है, यहां नहीं दिखाया गया — अपनी पसंदीदा भाषा में पूरी विनिर्देश सूची के लिए हमारी टीम से पूछें।",
  },
  pageBanner: {
    about: { title: "हमारे बारे में", current: "हमारे बारे में" },
    services: { title: "हमारी सेवाएं", current: "सेवाएं" },
    howItWorks: { title: "यह कैसे काम करता है", current: "यह कैसे काम करता है" },
    whyUs: { title: "BrickBasket को क्यों चुनें?", current: "हमें क्यों चुनें" },
    faq: { title: "सामान्य प्रश्न", current: "सामान्य प्रश्न" },
    contact: { title: "संपर्क करें", current: "संपर्क करें" },
    portfolio: { title: "हमारे प्रोजेक्ट्स", current: "प्रोजेक्ट्स" },
    plans: { title: "योजनाएं और पैकेज", current: "योजनाएं" },
    login: { title: "लॉगिन", current: "लॉगिन" },
    register: { title: "पंजीकरण करें", current: "पंजीकरण" },
  },
  costEstimator: {
    headingEyebrow: "बजट योजना",
    headingTitle: "अपनी निर्माण लागत का अनुमान लगाएं",
    step1Legend: "1. एक पैकेज चुनें",
    step2Legend: "2. अपने प्रोजेक्ट के बारे में बताएं",
    modeBasic: "मेरे पास बुनियादी जानकारी है",
    modeAll: "मेरे पास पूरी जानकारी है",
    modeBasicHint: "मुझे केवल अपने प्लॉट का क्षेत्रफल पता है",
    modeAllHint: "मेरे पास सटीक बिल्ट-अप/प्लिंथ क्षेत्रफल है",
    plotAreaLabel: "प्लॉट क्षेत्रफल (वर्ग फुट)",
    plotAreaHint:
      "आपके स्वामित्व वाली भूमि का कुल क्षेत्रफल, जिसमें उस पर बनी किसी भी संरचना का फुटप्रिंट भी शामिल है।",
    groundCoverageLabel: "अनुमानित ग्राउंड कवरेज",
    groundCoverageHint:
      "सेटबैक के बाद आपके प्लॉट का कितना हिस्सा आमतौर पर भवन के फुटप्रिंट में आता है — यह शहर और प्लॉट के आकार के अनुसार बदलता है, इसलिए यदि आप अपना स्थानीय नियम जानते हैं तो इसे समायोजित करें।",
    typicalDefault: "(सामान्य डिफ़ॉल्ट)",
    switchToAllDetails: "“मेरे पास पूरी जानकारी है” पर जाएं",
    plinthAreaLabel: "प्लिंथ क्षेत्रफल (वर्ग फुट)",
    plinthAreaHint: "ज़मीनी स्तर पर आपके घर का निर्मित फुटप्रिंट।",
    floorsLabel: "मंज़िलों की संख्या",
    ownsLandLegend: "क्या आपके पास पहले से ज़मीन का प्लॉट है?",
    yes: "हां",
    no: "नहीं",
    noLandNote:
      "अभी ज़मीन नहीं है? हमारी लैंड परचेज़ सेवा पहले सही प्लॉट खोजने में आपकी मदद कर सकती है।",
    noLandNotePre: "अभी ज़मीन नहीं है? हमारी",
    noLandNotePost: "सेवा पहले सही प्लॉट खोजने में आपकी मदद कर सकती है।",
    landPurchaseLink: "लैंड परचेज़",
    derivedPlinthAreaLabel: "व्युत्पन्न प्लिंथ क्षेत्रफल",
    knowExactPlinthArea: "इसके बजाय अपना सटीक प्लिंथ क्षेत्रफल जानते हैं?",
    timelineLabel: "आप निर्माण कब शुरू करना चाहते हैं?",
    timelineHint: "वैकल्पिक — इससे हमारी टीम को आपके फॉलो-अप को प्राथमिकता देने में मदद मिलती है।",
    preferNotToSay: "बताना नहीं चाहते",
    locationLabel: "प्रोजेक्ट स्थान (शहर / क्षेत्र)",
    locationHint: "वैकल्पिक — हम लखनऊ में स्थित हैं; अगर आपका प्रोजेक्ट कहीं और है तो हमें बताएं।",
    locationPlaceholder: "उदा. गोमती नगर, लखनऊ",
    estimatedCostLabel: "अनुमानित प्रोजेक्ट लागत",
    getDetailedQuote: "विस्तृत, साइट-विशिष्ट कोटेशन प्राप्त करें",
    savePrint: "यह अनुमान सेव / प्रिंट करें",
    downloadExcel: "एक्सेल के रूप में डाउनलोड करें",
    enterPlotAreaPrompt:
      "अपने चुने हुए पैकेज के लिए अनुमानित लागत देखने हेतु ऊपर अपना प्लॉट क्षेत्रफल दर्ज करें।",
    enterPlinthAreaPrompt:
      "अपने चुने हुए पैकेज के लिए अनुमानित लागत देखने हेतु ऊपर अपना प्लिंथ क्षेत्रफल दर्ज करें।",
    compareHeading: "इस आकार के लिए सभी पैकेजों की तुलना करें",
    estimatedCost: "अनुमानित लागत",
    includesHeading: "इस अनुमान में क्या शामिल है",
    disclaimerFooter:
      "ऊपर दिए गए सभी आंकड़े केवल सांकेतिक हैं। वास्तविक सामग्री, ब्रांड और मात्रा आपके विशिष्ट संरचनात्मक चित्रों के आधार पर अंतिम रूप से तय की जाएगी।",
    followUpHeading: "क्या आप चाहते हैं हमारी टीम इसमें फॉलो-अप करे?",
    fullName: "पूरा नाम",
    mobileNumber: "मोबाइल नंबर",
    emailAddress: "ईमेल",
    consentText:
      "मैं इस पूछताछ के संबंध में BrickBasket से संपर्क किए जाने और गोपनीयता नीति व नियम एवं शर्तों से सहमत हूं।",
    sendEstimate: "मेरा अनुमान टीम को भेजें",
    thanksTitle: "धन्यवाद — हमें आपका अनुमान मिल गया है",
    sendAnotherEnquiry: "एक और पूछताछ भेजें",
    errName: "अपना पूरा नाम दर्ज करें",
    errEmail: "एक मान्य ईमेल पता दर्ज करें",
    errPhone: "एक मान्य फ़ोन नंबर दर्ज करें",
    errConsent: "जारी रखने के लिए कृपया गोपनीयता नीति और नियम एवं शर्तें स्वीकार करें",
    csvHeading: "BrickBasket अनुमान सारांश",
    csvGeneratedOn: "तैयार करने की तारीख़",
    csvPackage: "पैकेज",
    csvRate: "दर (₹/वर्ग फुट)",
    csvBuiltUpArea: "बिल्ट-अप क्षेत्रफल (वर्ग फुट)",
    csvFloors: "मंज़िलें",
    csvOwnsLand: "ज़मीन का स्वामित्व",
    csvTimeline: "पसंदीदा समय-सीमा",
    csvLocation: "प्रोजेक्ट स्थान",
    csvEstimatedCost: "अनुमानित लागत",
    csvComparisonHeading: "तुलना — सभी पैकेज (समान आकार)",
    csvDisclaimer:
      "केवल सांकेतिक अनुमान, अंतिम कोटेशन नहीं। वास्तविक सामग्री, ब्रांड और मात्रा आपके विशिष्ट संरचनात्मक चित्रों के आधार पर अंतिम रूप से तय की जाएगी।",
    printedOn: "प्रिंट करने की तारीख़",
  },
} as const satisfies Dict;

export const UI_TEXT = { en, hi } satisfies Record<Lang, Dict>;

function lookupPath(dict: Dict, path: string): string | undefined {
  const value = path.split(".").reduce<string | Dict | undefined>((acc, key) => {
    if (acc == null || typeof acc === "string") return undefined;
    return acc[key];
  }, dict);
  return typeof value === "string" ? value : undefined;
}

/** Static UI-chrome lookup, dotted path (e.g. "nav.home"), always falls back to English. */
export function t(lang: Lang, path: string): string {
  return lookupPath(UI_TEXT[lang], path) ?? lookupPath(UI_TEXT.en, path) ?? path;
}

/**
 * Generic content lookup for the `*_HI` maps below — returns the Hindi
 * value for `enValue` when `lang === "hi"` and one exists, otherwise the
 * original English value. A missing Hindi entry degrades to English rather
 * than an empty string, so nothing ever disappears from the page.
 */
export function localize(lang: Lang, enValue: string, hiMap: Record<string, string>): string {
  if (lang !== "hi") return enValue;
  return hiMap[enValue] ?? enValue;
}

// ---------------------------------------------------------------------------
// Content-keyed lookup maps — English value (as it appears in the source
// data array) -> Hindi translation. See file header for why these are kept
// separate from the canonical English data instead of adding a `*Hi` field
// to each array.
// ---------------------------------------------------------------------------

/** About section stat labels (`STATS` in about-section.tsx). */
export const ABOUT_STATS_HI: Record<string, string> = {
  "Happy Customers": "खुश ग्राहक",
  "Projects Completed": "पूर्ण प्रोजेक्ट्स",
  "Years Industry Experience": "वर्षों का उद्योग अनुभव",
  "Quality Assurance": "गुणवत्ता आश्वासन",
};

/** About section core values (`CORE_VALUES` in about-section.tsx). */
export const CORE_VALUES_HI: Record<string, { title: string; description: string }> = {
  Transparency: {
    title: "पारदर्शिता",
    description: "हम खुले संवाद और ईमानदार व्यवहार में विश्वास रखते हैं।",
  },
  Quality: {
    title: "गुणवत्ता",
    description: "हम सामग्री और काम की गुणवत्ता से कभी समझौता नहीं करते।",
  },
  Commitment: { title: "प्रतिबद्धता", description: "हम हर बार अपने वादे पूरे करते हैं।" },
  Innovation: {
    title: "नवाचार",
    description: "हम आधुनिक तकनीकों को अपनाते हैं और बेहतर परिणाम देने का प्रयास करते हैं।",
  },
};

/** Confirmed services (`CONFIRMED_SERVICES` in public-site.ts). */
export const SERVICES_HI: Record<string, { title: string; description: string }> = {
  "Project Finance": {
    title: "प्रोजेक्ट फाइनेंस",
    description:
      "आपके सपनों के प्रोजेक्ट को आसानी और भरोसे के साथ हकीकत बनाने के लिए पूर्ण वित्तीय सहायता।",
  },
  "Land Purchase": {
    title: "भूमि खरीद",
    description: "आपके निवेश के लिए सर्वोत्तम मूल्य वाली सही ज़मीन खोजने में हम आपकी मदद करते हैं।",
  },
  "Vaastu Services": {
    title: "वास्तु सेवाएं",
    description:
      "आपके स्थान में सामंजस्य, सकारात्मकता और समृद्धि लाने के लिए विशेषज्ञ वास्तु मार्गदर्शन।",
  },
  "Planning & Architectural Services": {
    title: "योजना एवं वास्तुशिल्प सेवाएं",
    description:
      "कार्यात्मक और सुंदर स्थानों के लिए रचनात्मक वास्तुशिल्प डिज़ाइन और स्मार्ट योजना।",
  },
  "Pest Control & Waterproofing": {
    title: "पेस्ट कंट्रोल एवं वॉटरप्रूफिंग",
    description: "सुरक्षित, टिकाऊ और रिसाव-मुक्त जीवन के लिए उन्नत समाधान।",
  },
  "Construction & Interior Services": {
    title: "निर्माण एवं इंटीरियर सेवाएं",
    description:
      "उच्च गुणवत्ता वाले निर्माण के साथ बेहतरीन ढंग से तैयार किए गए सुरुचिपूर्ण इंटीरियर।",
  },
  "Rain Water Harvesting": {
    title: "वर्षा जल संचयन",
    description: "हरित और बेहतर कल के लिए टिकाऊ वर्षा जल संचयन समाधान।",
  },
};

/** Service titles only (derived from `SERVICES_HI`) — for places (footer) that only need the short label, not the description. */
export const SERVICE_TITLE_HI: Record<string, string> = Object.fromEntries(
  Object.entries(SERVICES_HI).map(([enTitle, v]) => [enTitle, v.title]),
);

/** Contact form's extra "General Enquiry"/"Other" subject options. */
export const CONTACT_SUBJECT_EXTRA_HI: Record<string, string> = {
  "General Enquiry": "सामान्य पूछताछ",
  Other: "अन्य",
};

/** Full Contact form "Subject" dropdown translation (`CONTACT_SUBJECT_OPTIONS` = "General Enquiry" + every service title + "Other") — combines `SERVICE_TITLE_HI` with the two extra options above. The `<option value>` submitted stays the English canonical string either way; only this display label changes. */
export const CONTACT_SUBJECT_HI: Record<string, string> = {
  ...SERVICE_TITLE_HI,
  ...CONTACT_SUBJECT_EXTRA_HI,
};

/** How It Works steps (`STEPS` in how-it-works-section.tsx). */
export const HOW_IT_WORKS_STEPS_HI: Record<string, { title: string; description: string }> = {
  "Enquiry & Consultation": {
    title: "पूछताछ एवं परामर्श",
    description:
      "हमें अपने प्रोजेक्ट के बारे में बताएं — हम आपके लक्ष्यों, बजट और समय-सीमा को समझते हैं।",
  },
  "Land Purchase (if needed)": {
    title: "भूमि खरीद (यदि आवश्यक हो)",
    description:
      "आपके निवेश के लिए सही ज़मीन खोजने और उसका मूल्यांकन करने में हम आपकी मदद करते हैं।",
  },
  "Vastu & Site Assessment": {
    title: "वास्तु एवं साइट मूल्यांकन",
    description:
      "डिज़ाइन का काम शुरू होने से पहले विशेषज्ञ वास्तु मार्गदर्शन को शामिल किया जाता है।",
  },
  "Planning & Design": {
    title: "योजना एवं डिज़ाइन",
    description: "वास्तुशिल्प योजनाएं और एक निर्धारित पैकेज आपके साथ मिलकर अंतिम रूप दिया जाता है।",
  },
  "Construction & Interior": {
    title: "निर्माण एवं इंटीरियर",
    description: "हमारी टीम नियमित प्रगति अपडेट के साथ निर्माण को अंजाम देती है।",
  },
  "Handover & Support": {
    title: "हैंडओवर एवं सहायता",
    description: "आपको आपका तैयार स्थान मिलता है, साथ ही निर्माण-पश्चात सहायता भी।",
  },
};

/** Why Us reasons (`REASONS` in why-us-section.tsx). */
export const WHY_US_REASONS_HI: Record<string, { title: string; description: string }> = {
  "15+ Years of Experience": {
    title: "15+ वर्षों का अनुभव",
    description: "विविध प्रोजेक्ट्स में उत्कृष्टता प्रदान करने का एक सिद्ध ट्रैक रिकॉर्ड।",
  },
  "Quality Assurance": {
    title: "गुणवत्ता आश्वासन",
    description:
      "हम प्रीमियम गुणवत्ता वाली सामग्री का उपयोग करते हैं और हर चरण में सख्त गुणवत्ता नियंत्रण का पालन करते हैं।",
  },
  "Transparent Process": {
    title: "पारदर्शी प्रक्रिया",
    description: "शुरू से अंत तक स्पष्ट संवाद और पूर्ण पारदर्शिता।",
  },
  "Expert Team": {
    title: "विशेषज्ञ टीम",
    description: "सर्वश्रेष्ठ परिणाम देने के लिए समर्पित कुशल इंजीनियर और पेशेवर।",
  },
  "On-Time Delivery": {
    title: "समय पर डिलीवरी",
    description: "हम आपके समय का सम्मान करते हैं और समय पर प्रोजेक्ट पूरा करना सुनिश्चित करते हैं।",
  },
  "Customer Satisfaction": {
    title: "ग्राहक संतुष्टि",
    description: "हमारे ग्राहकों का भरोसा और संतुष्टि हमारे हर काम के केंद्र में है।",
  },
};

/** Portfolio filter labels (`FILTERS` in portfolio-grid.tsx) and project categories. */
export const PROJECT_FILTER_HI: Record<string, string> = {
  "All Projects": "सभी प्रोजेक्ट्स",
  Commercial: "वाणिज्यिक",
  Residential: "आवासीय",
  Interior: "इंटीरियर",
  Ongoing: "प्रगति पर",
};

/** Confirmed project titles (`CONFIRMED_PROJECTS` in public-site.ts) — locations kept as-is (real place names). */
export const PROJECT_TITLE_HI: Record<string, string> = {
  "Commercial Complex": "वाणिज्यिक परिसर",
  "Luxury Villa": "लक्ज़री विला",
  "Modern Residence": "आधुनिक निवास",
  "Premium Interiors": "प्रीमियम इंटीरियर्स",
};

/** "Traditional Way vs. BrickBasket Way" rows (`OLD_WAY_VS_OUR_WAY_ROWS` in public-site.ts). */
export const COMPARISON_ROWS_HI: Record<
  string,
  { dimension: string; traditional: string; brickBasket: string }
> = {
  "Getting a cost estimate": {
    dimension: "लागत अनुमान प्राप्त करना",
    traditional: "एक लंप-सम आंकड़ा, जिसमें यह देखने का कोई तरीका नहीं कि वह कैसे निकाला गया।",
    brickBasket:
      "एक लाइव, विस्तृत अनुमान — किसी भी जानकारी को साझा करने से पहले हर पैकेज टियर की असली दर एक साथ देखें।",
  },
  "Understanding your budget": {
    dimension: "अपना बजट समझना",
    traditional: "एक ही “सामग्री एवं श्रम” लाइन, जिस पर आपको भरोसा करना पड़ता है।",
    brickBasket:
      "स्पष्ट, श्रेणी-दर-श्रेणी विनिर्देश — तय करने से पहले डिज़ाइन, संरचना और हर अन्य श्रेणी में टियर के हिसाब से बिल्कुल देखें कि क्या शामिल है।",
  },
  "Contracts & sign-off": {
    dimension: "कॉन्ट्रैक्ट एवं हस्ताक्षर",
    traditional:
      "एक मौखिक समझ, या व्यक्तिगत रूप से लिया गया हस्ताक्षर जिसे बाद में दोबारा नहीं देखा जा सकता।",
    brickBasket:
      "एक दस्तावेज़ीकृत कॉन्ट्रैक्ट जिसे आप ऑनलाइन समीक्षा और स्वीकार करते हैं, हर संस्करण और निर्णय के समय-चिह्नित इतिहास के साथ।",
  },
  "Drawings, certificates & warranties": {
    dimension: "चित्र, प्रमाणपत्र एवं वारंटी",
    traditional:
      "एक ट्यूब में कागज़ी चित्र, एक फ़ोल्डर में रसीदें — उम्मीद करें कि ज़रूरत पड़ने से पहले कुछ खो न जाए।",
    brickBasket:
      "हर चित्र, सामग्री प्रमाणपत्र और वारंटी दस्तावेज़ आपके पोर्टल में एक ही जगह, हमेशा नवीनतम संस्करण में।",
  },
  "What actually went into your home": {
    dimension: "आपके घर में वास्तव में क्या लगा",
    traditional: "कमरे-दर-कमरे किस सामग्री या मेक का उपयोग हुआ, इसका कोई औपचारिक रिकॉर्ड नहीं।",
    brickBasket:
      "एक मटीरियल रिसीट सर्टिफिकेट जो बताता है क्या उपयोग हुआ और उसकी वारंटी शर्तें क्या हैं — आपकी समीक्षा और स्वीकृति के लिए।",
  },
  "Staying updated": {
    dimension: "अपडेट रहना",
    traditional: "आप कॉल करते हैं, और किसी के वापस कॉल करने का इंतज़ार करते हैं।",
    brickBasket:
      "समीक्षा के लिए कुछ भी होते ही स्वतः सूचनाएं — स्वीकार करने के लिए एक कॉन्ट्रैक्ट, जांचने के लिए एक प्रमाणपत्र — सीधे आपके पोर्टल में।",
  },
};

/** FAQ items (`FAQS` in faq-section.tsx), keyed by the English question. */
export const FAQ_HI: Record<string, { question: string; answer: string }> = {
  "What services does BrickBasket offer?": {
    question: "BrickBasket कौन-सी सेवाएं प्रदान करता है?",
    answer:
      "हम शुरू से अंत तक निर्माण और रियल एस्टेट समाधान प्रदान करते हैं: प्रोजेक्ट फाइनेंस, भूमि खरीद, वास्तु सेवाएं, योजना एवं डिज़ाइन, निर्माण एवं इंटीरियर, वर्षा जल संचयन, पेस्ट कंट्रोल एवं वॉटरप्रूफिंग, और निर्माण-पश्चात सहायता।",
  },
  "How do I get started with a project?": {
    question: "मैं अपना प्रोजेक्ट कैसे शुरू करूं?",
    answer:
      "अपने प्रोजेक्ट के बारे में कुछ जानकारी के साथ हमारे Contact पेज के ज़रिए संपर्क करें। हमारी टीम आपके लक्ष्यों को समझने और अगले चरणों में आपकी मदद करने के लिए फॉलो-अप करेगी।",
  },
  "Does BrickBasket help with financing?": {
    question: "क्या BrickBasket वित्तपोषण में मदद करता है?",
    answer:
      "हां — हमारी प्रोजेक्ट फाइनेंस सेवा आपके प्रोजेक्ट के लिए फंडिंग की संरचना तैयार करने में सहायता प्रदान करती है। अपनी स्थिति के अनुसार क्या संभव है, यह जानने के लिए संपर्क करें।",
  },
  "What is Vastu Services and is it mandatory?": {
    question: "वास्तु सेवाएं क्या हैं और क्या यह अनिवार्य है?",
    answer:
      "वास्तु सेवाएं आपकी साइट और डिज़ाइन योजना में पारंपरिक वास्तु सिद्धांतों को शामिल करती हैं। यह उन ग्राहकों के लिए हमारी प्रक्रिया के हिस्से के रूप में उपलब्ध है जो इसे अपने प्रोजेक्ट में शामिल करना चाहते हैं।",
  },
  "Which locations does BrickBasket serve?": {
    question: "BrickBasket किन स्थानों पर सेवा देता है?",
    answer:
      "हमने कई राज्यों में प्रोजेक्ट पूरे किए हैं — अपने स्थान के साथ हमसे संपर्क करें और हम आपके प्रोजेक्ट के लिए व्यवहार्यता की पुष्टि करेंगे।",
  },
  "What happens after construction is complete?": {
    question: "निर्माण पूरा होने के बाद क्या होता है?",
    answer:
      "हैंडओवर आपके कॉन्ट्रैक्ट और प्रोजेक्ट रिकॉर्ड के माध्यम से दस्तावेज़ीकृत किया जाता है, और बाद में कोई प्रश्न आने पर हमारी टीम संपर्क में रहती है — Contact के ज़रिए पहुंचें और हम मदद करेंगे।",
  },
};

/** Construction packages (`CONSTRUCTION_PACKAGES` in public-site.ts) — tier names kept in English (standard practice), copy translated. */
export const PACKAGE_HI: Record<
  string,
  { coreFeatures: string; bestFor: string; newAtThisTier: string[] }
> = {
  essential: {
    coreFeatures:
      "हमारे वेब/ऐप प्लेटफ़ॉर्म के ज़रिए बजटिंग और क्रियान्वयन, वास्तु-एकीकृत योजना, निर्धारित इंजीनियरिंग विज़िट, और प्रतिस्पर्धी मूल्य।",
    bestFor:
      "मानक निर्माण के लिए सुव्यवस्थित, भरोसेमंद और किफ़ायती तरीका चाहने वाले घर के मालिकों के लिए।",
    newAtThisTier: [
      "वेब/ऐप-आधारित बजटिंग एवं क्रियान्वयन ट्रैकिंग",
      "वास्तु-एकीकृत योजना",
      "निर्धारित इंजीनियरिंग साइट विज़िट",
    ],
  },
  smart: {
    coreFeatures:
      "Essential में सब कुछ, साथ ही अत्याधुनिक 3D लेयरिंग विज़ुअलाइज़ेशन, नियमित गुणवत्ता आश्वासन टूल रीडिंग, और विस्तृत प्रगति जानकारी।",
    bestFor:
      "आधुनिक निर्माण के लिए बेहतर डिज़ाइन विज़ुअलाइज़ेशन और सख्त गुणवत्ता परीक्षण चाहने वाले ग्राहकों के लिए।",
    newAtThisTier: [
      "अत्याधुनिक 3D डिज़ाइन विज़ुअलाइज़ेशन",
      "नियमित गुणवत्ता-आश्वासन टूल रीडिंग",
      "विस्तृत प्रगति जानकारी",
    ],
  },
  premium: {
    coreFeatures:
      "Smart में सब कुछ, साथ ही निरंतर निगरानी के लिए एक समर्पित साइट मैनेजर, व्यक्तिगत लेयरिंग विकल्प, और संपूर्ण एंड-टू-एंड लाइफसाइकल सहायता।",
    bestFor:
      "व्यावहारिक, प्रीमियम प्रोजेक्ट प्रबंधन और हर विवरण पर पूर्ण ध्यान चाहने वाले लोगों के लिए।",
    newAtThisTier: [
      "समर्पित साइट मैनेजर (निरंतर ऑन-साइट निगरानी)",
      "व्यक्तिगत लेयरिंग/डिज़ाइन विकल्प",
      "एंड-टू-एंड लाइफसाइकल सहायता",
    ],
  },
  signature: {
    coreFeatures:
      "पूर्णतः अनुकूलित वास्तुशिल्प सेवाएं, एकीकृत प्लॉट-खोज एवं वित्तीय सहायता, विशेष इंटीरियर लेयरिंग, और अधिकतम वैल्यू इंजीनियरिंग।",
    bestFor:
      "शुरू से अंत तक पूरी तरह अनुकूलित, ऑल-इनक्लूसिव लक्ज़री अनुभव चाहते हुए एक पूर्णतः अनूठा सपनों का घर बनाने वालों के लिए।",
    newAtThisTier: [
      "पूर्णतः अनुकूलित वास्तुशिल्प सेवाएं",
      "एकीकृत प्लॉट-खोज एवं वित्तीय सहायता",
      "विशेष इंटीरियर लेयरिंग",
      "अधिकतम वैल्यू इंजीनियरिंग",
    ],
  },
};

/** Package comparison rows (`PACKAGE_COMPARISON_ROWS` in public-site.ts), keyed by dimension, values keyed by package slug. */
export const PACKAGE_COMPARISON_ROWS_HI: Record<
  string,
  { dimension: string; values: Record<string, string> }
> = {
  "Design & Planning": {
    dimension: "डिज़ाइन एवं योजना",
    values: {
      essential: "वास्तु-एकीकृत योजना",
      smart: "+ अत्याधुनिक 3D डिज़ाइन विज़ुअलाइज़ेशन",
      premium: "+ व्यक्तिगत लेयरिंग/डिज़ाइन विकल्प",
      signature: "पूर्णतः अनुकूलित वास्तुशिल्प सेवाएं + विशेष इंटीरियर लेयरिंग",
    },
  },
  "Site Supervision & Quality": {
    dimension: "साइट निगरानी एवं गुणवत्ता",
    values: {
      essential: "निर्धारित इंजीनियरिंग विज़िट",
      smart: "+ नियमित गुणवत्ता-आश्वासन टूल रीडिंग",
      premium: "+ समर्पित साइट मैनेजर (निरंतर निगरानी)",
      signature: "समर्पित साइट मैनेजर (निरंतर निगरानी), Premium की तरह",
    },
  },
  "Progress Tracking": {
    dimension: "प्रगति ट्रैकिंग",
    values: {
      essential: "वेब/ऐप-आधारित बजटिंग एवं क्रियान्वयन ट्रैकिंग",
      smart: "+ विस्तृत प्रगति जानकारी",
      premium: "+ एंड-टू-एंड लाइफसाइकल सहायता",
      signature: "एंड-टू-एंड लाइफसाइकल सहायता, Premium की तरह",
    },
  },
  "Additional Services": {
    dimension: "अतिरिक्त सेवाएं",
    values: {
      essential: "—",
      smart: "—",
      premium: "—",
      signature: "एकीकृत प्लॉट-खोज एवं वित्तीय सहायता, अधिकतम वैल्यू इंजीनियरिंग",
    },
  },
};

/** Package Specs Accordion category labels only — the per-tier bullet content is deliberately still English-only, see file header. */
export const PACKAGE_SPEC_CATEGORY_LABEL_HI: Record<string, string> = {
  Design: "डिज़ाइन",
  Structure: "संरचना",
  "Flooring and dado": "फ़्लोरिंग एवं डेडो",
  "Door and windows": "दरवाज़े एवं खिड़कियां",
  "Plumbing accessories": "प्लंबिंग सहायक उपकरण",
  Painting: "पेंटिंग",
  Electrical: "इलेक्ट्रिकल",
  Plumbing: "प्लंबिंग",
  "Railing and handrails": "रेलिंग एवं हैंडरेल",
};

/** Cost Estimator's "Number of Floors" select options (`FLOOR_OPTIONS` in cost-estimator-section.tsx). */
export const FLOOR_OPTION_LABEL_HI: Record<string, string> = {
  "Ground Floor Only (G)": "केवल ग्राउंड फ्लोर (G)",
  "G + 1 Floor": "G + 1 मंज़िल",
  "G + 2 Floors": "G + 2 मंज़िलें",
  "G + 3 Floors": "G + 3 मंज़िलें",
  "G + 4 Floors": "G + 4 मंज़िलें",
};

/** Cost Estimator's construction-start timeline options (`TIMELINE_OPTIONS` in cost-estimator-section.tsx). */
export const TIMELINE_OPTION_HI: Record<string, string> = {
  "0–3 months": "0–3 महीने",
  "3–6 months": "3–6 महीने",
  "More than 6 months": "6 महीने से अधिक",
  "Not sure yet": "अभी तय नहीं",
};
