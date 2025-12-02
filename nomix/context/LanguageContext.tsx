import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nManager } from "react-native";

type Language = "en" | "ar";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

// Simple translations for the app
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Common
    cancel: "Cancel",
    ok: "OK",
    error: "Error",
    success: "Success",
    recipes: "Recipes",
    logout: "Logout",

    // Settings
    "settings.title": "Settings",
    account: "Account",
    edit_profile: "Edit Profile",
    change_password: "Change Password",
    biometric_login: "Biometric Login",
    preferences: "Preferences",
    push_notifications: "Push Notifications",
    app_sounds: "App Sounds",
    language: "Language",
    support: "Support",
    help_center: "Help Center",
    privacy_policy: "Privacy Policy",
    terms_of_service: "Terms of Service",
    delete_account: "Delete Account",
    delete_account_confirm:
      "This will log you out of Nomix and take you back to the Get Started screen. This action cannot be undone.",
    select_language: "Select Language",
    english: "English",
    arabic: "Arabic",

    // Terms of Service (short & playful)
    terms_title: "Terms of Service",
    terms_subtitle:
      "Lawyers would write 20 pages. We’ll keep it to the important bits.",
    terms_section_1_title: "1. What Nomix is (and isn’t)",
    terms_section_1_body:
      "Nomix is a fun app to discover and create drink ideas. It’s not a medical service, life coach, or a guarantee that your mix won’t taste weird if you add everything in your fridge.",
    terms_section_2_title: "2. Your responsibilities",
    terms_section_2_body:
      "Use Nomix like a decent human: don’t break the law, don’t spam, and don’t upload anything illegal or hateful. If you share recipes or content, you promise you have the rights to share them.",
    terms_section_3_title: "3. Content & AI magic",
    terms_section_3_body:
      "Sometimes recipes or suggestions come from AI. They might be brilliant; they might be cursed. You use them at your own risk (and taste buds). Always drink responsibly and follow local laws.",
    terms_section_4_title: "4. Accounts & access",
    terms_section_4_body:
      "Keep your password safe and don’t share your account. We can suspend or remove access if we see abuse, security issues, or things that break these terms.",
    terms_section_5_title: "5. No guarantees (but we try)",
    terms_section_5_body:
      "We do our best to keep Nomix online and bug-free, but we can’t promise zero downtime or perfect results. The app is provided “as is” — if something breaks, we’ll try to fix it, not send you a free cocktail.",
    terms_section_6_title: "6. Changes & contact",
    terms_section_6_body:
      "We may update these terms from time to time. If the changes are big, we’ll try to let you know in the app. If you keep using Nomix after that, it means you accept the new terms. Questions? Email us at support@nomix.app.",
    terms_last_updated: "Last updated: December 2, 2025",
    // Privacy Policy (short & friendly)
    privacy_policy_title: "Short & Sweet Privacy",
    privacy_policy_subtitle:
      "We only collect what we need to keep your mixes, favorites, and AI magic running smoothly.",
    privacy_section_1_title: "1. What we know about you",
    privacy_section_1_body:
      "Basic stuff: your account details and what you do inside Nomix (like saved recipes and button taps). No creepy tracking of your entire life — just enough to make the app work and improve it.",
    privacy_section_2_title: "2. How we use it (no evil plans)",
    privacy_section_2_body:
      "We use your data to run Nomix, fix bugs, suggest better drinks, and keep bad actors out. We don’t sell your info, trade it for pizza, or spam you with nonsense.",
    privacy_section_3_title: "3. Who sees your data",
    privacy_section_3_body:
      "Mainly us and a few trusted services that help us host and operate the app. They’re contractually not allowed to run off and start their own cocktail empire with your data.",
    privacy_section_4_title: "4. Your powers",
    privacy_section_4_body:
      "You can edit some info in the app, and you can always reach out if you want to ask about, fix, or delete your data where the law allows. If something feels off, tell us — we actually read those messages.",
    privacy_section_5_title: "5. Changes (no plot twists)",
    privacy_section_5_body:
      "If we ever change this policy, we’ll update it here and, if it’s a big change, we’ll let you know in the app. If you keep shaking drinks with us after that, it means you’re cool with the new version.",
    privacy_section_6_title: "6. Final sip",
    privacy_section_6_body:
      "Nomix is built for fun and creativity, not data hoarding. If you have questions, bug reports, or cocktail ideas, reach us at support@nomix.app.",
    privacy_last_updated: "Last updated: December 2, 2025",

    // Home
    greeting: "Hello, Barista",
    subtitle: "What are we mixing today?",
    categories: "Categories",
    featured_mixes: "Featured Mixes",
    cat_popular: "Popular",
    cat_new: "New",
    cat_classic: "Classic",
    cat_tropical: "Tropical",

    // Profile
    followers: "Followers",
    following: "Following",
    favorites: "Favorites",
    help_support: "Help & Support",
    logout_confirm: "Are you sure you want to logout?",

    // Categories
    explore_by_type: "Explore by type",
    cat_classic_cocktails: "Classic Cocktails",
    cat_tropical_tiki: "Tropical & Tiki",
    cat_mocktails: "Mocktails",
    cat_shots: "Shots",
    cat_party_punches: "Party Punches",
    cat_healthy_mixes: "Healthy Mixes",
    cat_coffee_tea: "Coffee & Tea",
    cat_seasonal: "Seasonal",

    // Change Password
    current_password: "Current Password",
    new_password: "New Password",
    confirm_password: "Confirm New Password",
    enter_current_password: "Enter current password",
    enter_new_password: "Enter new password",
    re_enter_new_password: "Re-enter new password",
    ensure_password_secure:
      "Ensure your account is using a long, random password to stay secure.",
    update_password: "Update Password",
    password_updated: "Your password has been updated successfully!",
    fill_all_fields: "Please fill in all fields.",
    passwords_do_not_match: "New passwords do not match.",
    password_too_short: "Password must be at least 6 characters long.",
    updating: "Updating...",

    // Help
    "help.title": "Help & Support",
    "help.faq": "Frequently Asked Questions",
    "help.contact": "Contact Us",
    "help.q1": "How do I create a recipe?",
    "help.a1":
      "Currently, only admins can create recipes. Stay tuned for user submissions!",
    "help.q2": "How do I change my password?",
    "help.a2": "Go to Profile > Settings > Change Password.",
    "help.q3": "Can I delete my account?",
    "help.a3": "Yes, you can delete your account from the Settings page.",
    "help.email_support": "Email Support",
    "help.live_chat": "Live Chat",

    // Features
    "features.title": "Why Nomix?",
    "features.subtitle": "The ultimate cocktail companion.",
    "features.discover": "Discover Recipes",
    "features.discover_desc": "Explore thousands of cocktail recipes.",
    "features.create": "Create Mixes",
    "features.create_desc": "Craft your own unique blends.",
    "features.share": "Share & Enjoy",
    "features.share_desc": "Share your creations with friends.",
    "features.continue": "Continue",
    // Recipes
    "recipes.title": "My Recipes",
    "recipes.create_new": "Create New Recipe",
    "recipes.no_recipes": "No recipes found",
    "recipes.start_creating": "Start creating your own unique mixes!",
    "recipes.search_placeholder": "Search recipes...",
    "recipes.filter": "Filter",
    "recipes.sort": "Sort",

    // AI Generator
    "ai_generator.title": "AI Recipe Generator",
    "ai_generator.enter_ingredients": "Enter Ingredients",
    "ai_generator.ingredients_placeholder": "Vodka, Lime, Mint...",
    "ai_generator.enter_mood": "Enter Mood",
    "ai_generator.mood_placeholder": "Party, Chill, Romantic...",
    "ai_generator.generate_button": "Generate Recipe",

    // Auth
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.forgot_password": "Forgot Password?",
    "auth.no_account": "Don't have an account?",
    "auth.has_account": "Already have an account?",
    "auth.full_name": "Full Name",
    "auth.confirm_password": "Confirm Password",
    "auth.send_reset_link": "Send Reset Link",
    "auth.reset_link_sent": "Reset Link Sent",
    "auth.reset_desc": "Enter your email to receive a password reset link.",
    "auth.back_to_login": "Back to Login",
    "auth.check_email": "Check your email for the reset link.",

    // Get Started
    "get_started.welcome": "Welcome to Nomix",
    "get_started.subtitle": "Discover and create amazing cocktail recipes.",
    "get_started.sign_up": "Sign Up",
    "get_started.sign_in": "Sign In",
  },
  ar: {
    // Common
    cancel: "إلغاء",
    ok: "موافق",
    error: "خطأ",
    success: "تم بنجاح",
    recipes: "وصفات",
    logout: "تسجيل الخروج",

    // Settings
    "settings.title": "الإعدادات",
    account: "الحساب",
    edit_profile: "تعديل الملف الشخصي",
    change_password: "تغيير كلمة المرور",
    biometric_login: "الدخول بالبصمة",
    preferences: "التفضيلات",
    push_notifications: "الإشعارات",
    app_sounds: "أصوات التطبيق",
    language: "اللغة",
    support: "الدعم",
    help_center: "مركز المساعدة",
    privacy_policy: "سياسة الخصوصية",
    terms_of_service: "شروط الخدمة",
    delete_account: "حذف الحساب",
    delete_account_confirm:
      "سيتم تسجيل خروجك من Nomix والعودة إلى شاشة البدء. لا يمكن التراجع عن هذا الإجراء.",
    select_language: "اختر اللغة",
    english: "الإنجليزية",
    arabic: "العربية",

    // Privacy Policy (short & friendly – English text placeholder)
    privacy_policy_title: "Short & Sweet Privacy",
    privacy_policy_subtitle:
      "We only collect what we need to keep your mixes, favorites, and AI magic running smoothly.",
    privacy_section_1_title: "1. What we know about you",
    privacy_section_1_body:
      "Basic stuff: your account details and what you do inside Nomix (like saved recipes and button taps). No creepy tracking of your entire life — just enough to make the app work and improve it.",
    privacy_section_2_title: "2. How we use it (no evil plans)",
    privacy_section_2_body:
      "We use your data to run Nomix, fix bugs, suggest better drinks, and keep bad actors out. We don’t sell your info, trade it for pizza, or spam you with nonsense.",
    privacy_section_3_title: "3. Who sees your data",
    privacy_section_3_body:
      "Mainly us and a few trusted services that help us host and operate the app. They’re contractually not allowed to run off and start their own cocktail empire with your data.",
    privacy_section_4_title: "4. Your powers",
    privacy_section_4_body:
      "You can edit some info in the app, and you can always reach out if you want to ask about, fix, or delete your data where the law allows. If something feels off, tell us — we actually read those messages.",
    privacy_section_5_title: "5. Changes (no plot twists)",
    privacy_section_5_body:
      "If we ever change this policy, we’ll update it here and, if it’s a big change, we’ll let you know in the app. If you keep shaking drinks with us after that, it means you’re cool with the new version.",
    privacy_section_6_title: "6. Final sip",
    privacy_section_6_body:
      "Nomix is built for fun and creativity, not data hoarding. If you have questions, bug reports, or cocktail ideas, reach us at support@nomix.app.",
    privacy_last_updated: "Last updated: December 2, 2025",

    // Terms of Service (short & playful – English text placeholder)
    terms_title: "Terms of Service",
    terms_subtitle:
      "Lawyers would write 20 pages. We’ll keep it to the important bits.",
    terms_section_1_title: "1. What Nomix is (and isn’t)",
    terms_section_1_body:
      "Nomix is a fun app to discover and create drink ideas. It’s not a medical service, life coach, or a guarantee that your mix won’t taste weird if you add everything in your fridge.",
    terms_section_2_title: "2. Your responsibilities",
    terms_section_2_body:
      "Use Nomix like a decent human: don’t break the law, don’t spam, and don’t upload anything illegal or hateful. If you share recipes or content, you promise you have the rights to share them.",
    terms_section_3_title: "3. Content & AI magic",
    terms_section_3_body:
      "Sometimes recipes or suggestions come from AI. They might be brilliant; they might be cursed. You use them at your own risk (and taste buds). Always drink responsibly and follow local laws.",
    terms_section_4_title: "4. Accounts & access",
    terms_section_4_body:
      "Keep your password safe and don’t share your account. We can suspend or remove access if we see abuse, security issues, or things that break these terms.",
    terms_section_5_title: "5. No guarantees (but we try)",
    terms_section_5_body:
      "We do our best to keep Nomix online and bug-free, but we can’t promise zero downtime or perfect results. The app is provided “as is” — if something breaks, we’ll try to fix it, not send you a free cocktail.",
    terms_section_6_title: "6. Changes & contact",
    terms_section_6_body:
      "We may update these terms from time to time. If the changes are big, we’ll try to let you know in the app. If you keep using Nomix after that, it means you accept the new terms. Questions? Email us at support@nomix.app.",
    terms_last_updated: "Last updated: December 2, 2025",

    // Home
    greeting: "مرحباً، باريستا",
    subtitle: "ماذا سنخلط اليوم؟",
    categories: "التصنيفات",
    featured_mixes: "خلطات مميزة",
    cat_popular: "شائع",
    cat_new: "جديد",
    cat_classic: "كلاسيك",
    cat_tropical: "استوائي",

    // Profile
    followers: "متابعين",
    following: "يتابع",
    favorites: "المفضلة",
    help_support: "المساعدة والدعم",
    logout_confirm: "هل أنت متأكد أنك تريد تسجيل الخروج؟",

    // Categories
    explore_by_type: "اكتشف حسب النوع",
    cat_classic_cocktails: "كوكتيلات كلاسيكية",
    cat_tropical_tiki: "تيكي واستوائي",
    cat_mocktails: "موكتيلات",
    cat_shots: "شوتس",
    cat_party_punches: "مشروبات الحفلات",
    cat_healthy_mixes: "خلطات صحية",
    cat_coffee_tea: "قهوة وشاي",
    cat_seasonal: "موسمي",

    // Change Password
    current_password: "كلمة المرور الحالية",
    new_password: "كلمة المرور الجديدة",
    confirm_password: "تأكيد كلمة المرور الجديدة",
    enter_current_password: "أدخل كلمة المرور الحالية",
    enter_new_password: "أدخل كلمة المرور الجديدة",
    re_enter_new_password: "أعد إدخال كلمة المرور الجديدة",
    ensure_password_secure:
      "تأكد من استخدام كلمة مرور طويلة وعشوائية للحفاظ على أمان حسابك.",
    update_password: "تحديث كلمة المرور",
    password_updated: "تم تحديث كلمة المرور بنجاح!",
    fill_all_fields: "يرجى ملء جميع الحقول.",
    passwords_do_not_match: "كلمات المرور الجديدة غير متطابقة.",
    password_too_short: "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.",
    updating: "جاري التحديث...",

    // Help
    "help.title": "المساعدة والدعم",
    "help.faq": "الأسئلة الشائعة",
    "help.contact": "تواصل معنا",
    "help.q1": "كيف أقوم بإنشاء وصفة؟",
    "help.a1":
      "حالياً، يمكن للمسؤولين فقط إنشاء الوصفات. انتظر تحديثاتنا لمشاركات المستخدمين!",
    "help.q2": "كيف أغير كلمة المرور؟",
    "help.a2": "اذهب إلى الملف الشخصي > الإعدادات > تغيير كلمة المرور.",
    "help.q3": "هل يمكنني حذف حسابي؟",
    "help.a3": "نعم، يمكنك حذف حسابك من صفحة الإعدادات.",
    "help.email_support": "دعم البريد الإلكتروني",
    "help.live_chat": "الدردشة المباشرة",

    // Features
    "features.title": "لماذا Nomix؟",
    "features.subtitle": "رفيق الكوكتيل المثالي.",
    "features.discover": "اكتشف الوصفات",
    "features.discover_desc": "تصفح آلاف وصفات الكوكتيل.",
    "features.create": "أنشئ خلطات",
    "features.create_desc": "اصنع خلطاتك الفريدة.",
    "features.share": "شارك واستمتع",
    "features.share_desc": "شارك إبداعاتك مع الأصدقاء.",
    "features.continue": "متابعة",
    // Recipes
    "recipes.title": "وصفاتي",
    "recipes.create_new": "إنشاء وصفة جديدة",
    "recipes.no_recipes": "لم يتم العثور على وصفات",
    "recipes.start_creating": "ابدأ في إنشاء خلطاتك الفريدة!",
    "recipes.search_placeholder": "البحث عن الوصفات...",
    "recipes.filter": "تصفية",
    "recipes.sort": "ترتيب",

    // AI Generator
    "ai_generator.title": "مولد وصفات الذكاء الاصطناعي",
    "ai_generator.enter_ingredients": "أدخل المكونات",
    "ai_generator.ingredients_placeholder": "فودكا، ليمون، نعناع...",
    "ai_generator.enter_mood": "أدخل الحالة المزاجية",
    "ai_generator.mood_placeholder": "حفلة، استرخاء، رومانسي...",
    "ai_generator.generate_button": "توليد الوصفة",

    // Auth
    "auth.email": "البريد الإلكتروني",
    "auth.password": "كلمة المرور",
    "auth.forgot_password": "نسيت كلمة المرور؟",
    "auth.no_account": "ليس لديك حساب؟",
    "auth.has_account": "لديك حساب بالفعل؟",
    "auth.full_name": "الاسم الكامل",
    "auth.confirm_password": "تأكيد كلمة المرور",
    "auth.send_reset_link": "إرسال رابط إعادة التعيين",
    "auth.reset_link_sent": "تم إرسال الرابط",
    "auth.reset_desc":
      "أدخل بريدك الإلكتروني لاستلام رابط إعادة تعيين كلمة المرور.",
    "auth.back_to_login": "العودة لتسجيل الدخول",
    "auth.check_email": "تحقق من بريدك الإلكتروني للحصول على الرابط.",

    // Get Started
    "get_started.welcome": "مرحباً بك في Nomix",
    "get_started.subtitle": "اكتشف وأنشئ وصفات كوكتيل مذهلة.",
    "get_started.sign_up": "إنشاء حساب",
    "get_started.sign_in": "تسجيل الدخول",
  },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguageState] = useState<Language>("en");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const storedLang = await AsyncStorage.getItem("app_language");
      if (storedLang === "en" || storedLang === "ar") {
        setLanguageState(storedLang);
      }
    } catch (error) {
      console.error("Failed to load language", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem("app_language", lang);
      setLanguageState(lang);
      // In a real app, you might reload to apply global RTL changes
      // I18nManager.forceRTL(lang === 'ar');
      // Updates.reloadAsync();
    } catch (error) {
      console.error("Failed to save language", error);
    }
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const value = {
    language,
    setLanguage,
    t,
    isRTL: language === "ar",
  };

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
