/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - MULTI-LANGUAGE I18N SERVICE (i18nService.js)
   Supports: English (en), Marathi (mr), Hindi (hi)
   ========================================================================== */

(function () {
  'use strict';

  window.CRM = window.CRM || {};

  const translations = {
    en: {
      // Branding & Header
      brand_name: "Karajgikar",
      brand_sub: "JEWELLERS",
      brand_tagline: "ESTD. 1958 • SOLAPUR",
      quick_add: "+ Quick Add",
      theme_light: "Light Mode",
      theme_dark: "Dark Mode",
      rates_ticker_title: "Today's Metal Rates:",
      edit_rates: "Edit Rates ✏️",

      // Navigation
      nav_dashboard: "Dashboard",
      nav_customers: "Customers",
      nav_purchases: "Purchases",
      nav_followups: "Follow-ups",
      nav_birthdays: "Birthdays & Anniv.",
      nav_festivals: "Festivals & Offers",
      nav_inactive: "Win-Back List",
      nav_messages: "Message Queue",
      nav_settings: "Settings",

      // Win-back Section
      winback_title: "Inactive Customer Win-Back List",
      winback_sub: "Customers who have not visited your showroom in a long time. Filter by 6 months, 1 year, 1.5 years, or 2+ years.",

      // Dashboard
      dash_title: "Business Relationship Dashboard",
      dash_subtitle: "Welcome back. Here is your relationship statistics overview for today.",
      stat_customers: "Total Customers",
      stat_purchases: "Recorded Purchases",
      stat_followups: "Active Follow-ups",
      stat_wishes: "Upcoming Wishes",
      stat_sub_customers: "Active registered records",
      stat_sub_purchases: "Customer purchase bills",
      stat_sub_followups: "Pending customer callbacks",
      stat_sub_wishes: "Next 7 days celebration",

      // Quick Actions
      dash_quick_actions: "Quick Relationship Actions",
      action_add_customer: "Register Customer",
      action_add_purchase: "Record Purchase",
      action_add_followup: "Schedule Follow-up",

      // Today's Actions Table
      todays_actions_title: "Today's Actions Required",
      todays_actions_sub: "Immediate customer follow-ups and celebration greetings due for today.",
      col_action_type: "Action Type",
      col_customer_name: "Customer Name",
      col_contact: "Contact",
      col_event_details: "Event / Inquiry Details",
      col_urgency: "Urgency",
      col_actions: "Action",
      no_actions_today: "No Actions Required Today",
      no_actions_sub: "All follow-ups and greetings for today have been completed.",

      // Customer Directory
      cust_title: "Customer Directory",
      cust_sub: "Manage customer records, contact info, and view purchase histories.",
      search_placeholder: "Search by name, mobile, city...",
      filter_all_cities: "All Cities / Villages",
      filter_all_tags: "All Customer Groups",
      export_csv: "Export CSV",
      col_id: "ID",
      col_name: "Full Name",
      col_city: "City / Village",
      col_tier: "VIP Tier",
      col_total_spent: "Lifetime Purchases",
      col_registered: "Registered",

      // VIP Tiers
      tier_silver: "Silver Member",
      tier_gold: "Gold VIP",
      tier_diamond: "Diamond Royal VIP",

      // Settings
      settings_title: "Settings & System Configurations",
      settings_sub: "Manage business details, visual themes, automated wishes, and database backups.",
      btn_save_config: "Save Configurations"
    },

    mr: {
      // Branding & Header (मराठी)
      brand_name: "करजगीकर",
      brand_sub: "ज्वेलर्स",
      brand_tagline: "स्थापना १९५८ • सोलापूर",
      quick_add: "+ नवीन नोंद",
      theme_light: "लाईट मोड",
      theme_dark: "डार्क मोड",
      rates_ticker_title: "आजचे सोन्या-चांदीचे भाव:",
      edit_rates: "भाव बदला ✏️",

      // Navigation
      nav_dashboard: "डॅशबोर्ड",
      nav_customers: "ग्राहक यादी",
      nav_purchases: "खरेदी नोंदी",
      nav_followups: "फॉलो-अप्स",
      nav_birthdays: "वाढदिवस व वर्धापनदिन",
      nav_festivals: "सण व मोहिमा",
      nav_inactive: "पुनर्भेट यादी (Win-Back)",
      nav_messages: "संदेश रांग (Queue)",
      nav_settings: "सेटिंग्ज",

      // Win-back Section (मराठी)
      winback_title: "दीर्घकाळ न आलेले ग्राहक (पुनर्भेट यादी)",
      winback_sub: "गेल्या बऱ्याच काळापासून दुकानात न आलेले ग्राहक. ६ महिने, १ वर्ष, १.५ वर्षे किंवा २ वर्षांहून अधिक काळानुसार शोधा.",

      // Dashboard
      dash_title: "ग्राहक संबंध व व्यवसाय डॅशबोर्ड",
      dash_subtitle: "स्वागत आहे! आजच्या ग्राहक संबंध आणि महत्त्वाच्या नोंदींचा आढावा.",
      stat_customers: "एकूण ग्राहक",
      stat_purchases: "एकूण खरेदी नोंदी",
      stat_followups: "सक्रिय फॉलो-अप्स",
      stat_wishes: "येणारे वाढदिवस/सण",
      stat_sub_customers: "नोंदणीकृत ग्राहक खाते",
      stat_sub_purchases: "ग्राहक खरेदी बिले",
      stat_sub_followups: "बाकी असलेले कॉल्स",
      stat_sub_wishes: "पुढील ७ दिवसांतील शुभेच्छा",

      // Quick Actions
      dash_quick_actions: "त्वरित कृती (Quick Actions)",
      action_add_customer: "नवीन ग्राहक जोडा",
      action_add_purchase: "खरेदी नोंदवा",
      action_add_followup: "फॉलो-अप शेड्युल करा",

      // Today's Actions Table
      todays_actions_title: "आजची आवश्यक कामे (Today's Actions)",
      todays_actions_sub: "आजच्या दिवसाचे तातडीचे ग्राहक कॉल्स आणि वाढदिवस/वर्धापनदिन शुभेच्छा.",
      col_action_type: "प्रकार",
      col_customer_name: "ग्राहकाचे नाव",
      col_contact: "मोबाईल",
      col_event_details: "तपशील / चौकशी",
      col_urgency: "प्राधान्य",
      col_actions: "कृती",
      no_actions_today: "आज कोणतीही प्रलंबित कामे नाहीत",
      no_actions_sub: "आजचे सर्व फॉलो-अप्स आणि शुभेच्छा पूर्ण झाल्या आहेत.",

      // Customer Directory
      cust_title: "ग्राहक निर्देशिका (Directory)",
      cust_sub: "ग्राहकांचे संपर्क, पत्ते आणि त्यांची संपूर्ण खरेदी माहिती व्यवस्थापित करा.",
      search_placeholder: "नाव, मोबाईल किंवा शहराने शोधा...",
      filter_all_cities: "सर्व गावे / शहरे",
      filter_all_tags: "सर्व ग्राहक गट",
      export_csv: "CSV डाउनलोड",
      col_id: "क्रमांक",
      col_name: "ग्राहकाचे नाव",
      col_city: "गाव / शहर",
      col_tier: "VIP श्रेणी",
      col_total_spent: "एकूण खरेदी",
      col_registered: "नोंदणी तारीख",

      // VIP Tiers
      tier_silver: "सिल्व्हर ग्राहक",
      tier_gold: "गोल्ड VIP",
      tier_diamond: "डायमंड रॉयल VIP",

      // Settings
      settings_title: "सेटिंग्ज व सिस्टीम व्यवस्थापन",
      settings_sub: "दुकानाची माहिती, रंगसंगती, ऑटोमॅटिक शुभेच्छा आणि बॅकअप व्यवस्थापित करा.",
      btn_save_config: "माहिती जतन करा"
    },

    hi: {
      // Branding & Header (हिंदी)
      brand_name: "करजगीकर",
      brand_sub: "ज्वेलर्स",
      brand_tagline: "स्थापना १९५८ • सोलापुर",
      quick_add: "+ नया जोड़ें",
      theme_light: "लाइट मोड",
      theme_dark: "डार्क मोड",
      rates_ticker_title: "आज के सोना-चांदी भाव:",
      edit_rates: "भाव बदलें ✏️",

      // Navigation
      nav_dashboard: "डैशबोर्ड",
      nav_customers: "ग्राहक सूची",
      nav_purchases: "खरीदारी विवरण",
      nav_followups: "फॉलो-अप",
      nav_birthdays: "जन्मदिन व सालगिरह",
      nav_festivals: "त्योहार व ऑफर्स",
      nav_inactive: "पुनर्भेंट सूची (Win-Back)",
      nav_messages: "संदेश सूची",
      nav_settings: "सेटिंग्स",

      // Win-back Section (हिंदी)
      winback_title: "लंबे समय से न आने वाले ग्राहक सूची",
      winback_sub: "लंबे समय से शोरूम न आने वाले ग्राहक। ६ महीने, १ वर्ष, १.५ वर्ष या २+ वर्ष के आधार पर फ़िल्टर करें।",

      // Dashboard
      dash_title: "ग्राहक संबंध डैशबोर्ड",
      dash_subtitle: "स्वागत है। आज के सभी ग्राहक कार्यों और सांख्यिकी का विवरण।",
      stat_customers: "कुल ग्राहक",
      stat_purchases: "कुल खरीदारी",
      stat_followups: "सक्रिय फॉलो-अप",
      stat_wishes: "आने वाले जन्मदिन",
      stat_sub_customers: "पंजीकृत ग्राहक खाते",
      stat_sub_purchases: "ग्राहक खरीदारी बिल",
      stat_sub_followups: "बाकी ग्राहक कॉल्स",
      stat_sub_wishes: "अगले ७ दिनों की शुभकामनाएं",

      // Quick Actions
      dash_quick_actions: "त्वरित कार्य (Quick Actions)",
      action_add_customer: "ग्राहक पंजीकृत करें",
      action_add_purchase: "खरीदारी दर्ज करें",
      action_add_followup: "फॉलो-अप शेड्यूल करें",

      // Today's Actions Table
      todays_actions_title: "आज के जरूरी कार्य (Today's Actions)",
      todays_actions_sub: "आज के फॉलो-अप कॉल्स और जन्मदिन/सालगिरह की शुभकामनाएं।",
      col_action_type: "प्रकार",
      col_customer_name: "ग्राहक का नाम",
      col_contact: "मोबाइल",
      col_event_details: "विवरण / पूछताछ",
      col_urgency: "प्राथमिकता",
      col_actions: "कार्य",
      no_actions_today: "आज कोई लंबित कार्य नहीं है",
      no_actions_sub: "आज के सभी फॉलो-अप और शुभकामनाएं पूरी हो चुकी हैं।",

      // Customer Directory
      cust_title: "ग्राहक निर्देशिका",
      cust_sub: "ग्राहक संपर्क, पते और उनकी कुल खरीदारी का प्रबंधन करें।",
      search_placeholder: "नाम, मोबाइल या शहर से खोजें...",
      filter_all_cities: "सभी शहर / गांव",
      filter_all_tags: "सभी ग्राहक वर्ग",
      export_csv: "CSV डाउनलोड",
      col_id: "आईडी",
      col_name: "ग्राहक का नाम",
      col_city: "शहर / गांव",
      col_tier: "VIP श्रेणी",
      col_total_spent: "कुल खरीदारी",
      col_registered: "पंजीकरण",

      // VIP Tiers
      tier_silver: "सिल्वर सदस्य",
      tier_gold: "गोल्ड VIP",
      tier_diamond: "डायमंड रॉयल VIP",

      // Settings
      settings_title: "सेटिंग्स और सिस्टम प्रबंधन",
      settings_sub: "दुकान विवरण, थीम, ऑटो-विशेज और डेटा बैकअप का प्रबंधन करें।",
      btn_save_config: "सेटिंग्स सुरक्षित करें"
    }
  };

  let currentLanguage = localStorage.getItem('crm_language') || 'en';

  /**
   * Translate a key into the current language
   */
  function t(key, defaultVal = '') {
    const langDict = translations[currentLanguage] || translations['en'];
    return langDict[key] || translations['en'][key] || defaultVal || key;
  }

  /**
   * Set language and update all translated DOM elements
   */
  function setLanguage(langCode) {
    if (!translations[langCode]) langCode = 'en';
    currentLanguage = langCode;
    localStorage.setItem('crm_language', langCode);
    
    // Update language select element if present
    const langSelect = document.getElementById('header-lang-select');
    if (langSelect && langSelect.value !== langCode) {
      langSelect.value = langCode;
    }

    translatePage();

    // Dispatch event so active UI views can re-render dynamic tables
    window.dispatchEvent(new CustomEvent('crm-language-changed', { detail: { lang: langCode } }));
  }

  /**
   * Automatically translate all DOM nodes with data-i18n attributes
   */
  function translatePage() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translation = t(key);
      if (translation) {
        el.textContent = translation;
      }
    });

    const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
    placeholders.forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const translation = t(key);
      if (translation) {
        el.setAttribute('placeholder', translation);
      }
    });
  }

  function getLanguage() {
    return currentLanguage;
  }

  // Export to global CRM namespace
  window.CRM.i18n = {
    t,
    setLanguage,
    getLanguage,
    translatePage,
    translations
  };

})();
