/**
 * Internationalization (i18n) System
 */

export type Locale = 'en' | 'es' | 'fr' | 'de' | 'si' | 'ta' | 'hi' | 'zh' | 'ja' | 'ar';

export interface Translation {
  [key: string]: string | Translation;
}

export const SUPPORTED_LOCALES: { code: Locale; name: string; native: string }[] = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'si', name: 'Sinhala', native: 'සිංහල' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'zh', name: 'Chinese', native: '中文' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
];

export const translations: Record<Locale, Translation> = {
  en: {
    common: {
      welcome: 'Welcome',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      search: 'Search',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
    },
    dashboard: {
      title: 'Dashboard',
      revenue: 'Revenue',
      orders: 'Orders',
      customers: 'Customers',
      products: 'Products',
    },
    products: {
      title: 'Products',
      add: 'Add Product',
      name: 'Product Name',
      price: 'Price',
      stock: 'Stock',
      category: 'Category',
    },
    orders: {
      title: 'Orders',
      new: 'New Order',
      status: 'Status',
      total: 'Total',
      customer: 'Customer',
    },
  },
  es: {
    common: {
      welcome: 'Bienvenido',
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      search: 'Buscar',
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
    },
    dashboard: {
      title: 'Panel',
      revenue: 'Ingresos',
      orders: 'Pedidos',
      customers: 'Clientes',
      products: 'Productos',
    },
    products: {
      title: 'Productos',
      add: 'Agregar Producto',
      name: 'Nombre del Producto',
      price: 'Precio',
      stock: 'Existencias',
      category: 'Categoría',
    },
    orders: {
      title: 'Pedidos',
      new: 'Nuevo Pedido',
      status: 'Estado',
      total: 'Total',
      customer: 'Cliente',
    },
  },
  fr: {
    common: {
      welcome: 'Bienvenue',
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier',
      search: 'Rechercher',
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
    },
    dashboard: {
      title: 'Tableau de bord',
      revenue: 'Revenu',
      orders: 'Commandes',
      customers: 'Clients',
      products: 'Produits',
    },
    products: {
      title: 'Produits',
      add: 'Ajouter un produit',
      name: 'Nom du produit',
      price: 'Prix',
      stock: 'Stock',
      category: 'Catégorie',
    },
    orders: {
      title: 'Commandes',
      new: 'Nouvelle commande',
      status: 'Statut',
      total: 'Total',
      customer: 'Client',
    },
  },
  de: {
    common: {
      welcome: 'Willkommen',
      save: 'Speichern',
      cancel: 'Abbrechen',
      delete: 'Löschen',
      edit: 'Bearbeiten',
      search: 'Suchen',
      loading: 'Laden...',
      error: 'Fehler',
      success: 'Erfolg',
    },
    dashboard: {
      title: 'Dashboard',
      revenue: 'Umsatz',
      orders: 'Bestellungen',
      customers: 'Kunden',
      products: 'Produkte',
    },
    products: {
      title: 'Produkte',
      add: 'Produkt hinzufügen',
      name: 'Produktname',
      price: 'Preis',
      stock: 'Lagerbestand',
      category: 'Kategorie',
    },
    orders: {
      title: 'Bestellungen',
      new: 'Neue Bestellung',
      status: 'Status',
      total: 'Gesamt',
      customer: 'Kunde',
    },
  },
  si: {
    common: {
      welcome: 'ආයුබෝවන්',
      save: 'සුරකින්න',
      cancel: 'අවලංගු කරන්න',
      delete: 'මකන්න',
      edit: 'සංස්කරණය',
      search: 'සොයන්න',
      loading: 'පූරණය වෙමින්...',
      error: 'දෝෂයකි',
      success: 'සාර්ථකයි',
    },
    dashboard: {
      title: 'උපකරණ පුවරුව',
      revenue: 'ආදායම',
      orders: 'ඇණවුම්',
      customers: 'ගනුදෙනුකරුවන්',
      products: 'නිෂ්පාදන',
    },
    products: {
      title: 'නිෂ්පාදන',
      add: 'නිෂ්පාදනයක් එක් කරන්න',
      name: 'නිෂ්පාදන නාමය',
      price: 'මිල',
      stock: 'තොග',
      category: 'කාණ්ඩය',
    },
    orders: {
      title: 'ඇණවුම්',
      new: 'නව ඇණවුම',
      status: 'තත්වය',
      total: 'එකතුව',
      customer: 'ගනුදෙනුකරු',
    },
  },
  ta: {
    common: {
      welcome: 'வரவேற்பு',
      save: 'சேமி',
      cancel: 'ரத்து செய்',
      delete: 'நீக்கு',
      edit: 'திருத்து',
      search: 'தேடு',
      loading: 'ஏற்றுகிறது...',
      error: 'பிழை',
      success: 'வெற்றி',
    },
    dashboard: {
      title: 'டாஷ்போர்டு',
      revenue: 'வருவாய்',
      orders: 'ஆர்டர்கள்',
      customers: 'வாடிக்கையாளர்கள்',
      products: 'தயாரிப்புகள்',
    },
    products: {
      title: 'தயாரிப்புகள்',
      add: 'தயாரிப்பு சேர்',
      name: 'தயாரிப்பு பெயர்',
      price: 'விலை',
      stock: 'சரக்கு',
      category: 'வகை',
    },
    orders: {
      title: 'ஆர்டர்கள்',
      new: 'புதிய ஆர்டர்',
      status: 'நிலை',
      total: 'மொத்தம்',
      customer: 'வாடிக்கையாளர்',
    },
  },
  hi: {
    common: {
      welcome: 'स्वागत है',
      save: 'सहेजें',
      cancel: 'रद्द करें',
      delete: 'हटाएं',
      edit: 'संपादित करें',
      search: 'खोजें',
      loading: 'लोड हो रहा है...',
      error: 'त्रुटि',
      success: 'सफलता',
    },
    dashboard: {
      title: 'डैशबोर्ड',
      revenue: 'राजस्व',
      orders: 'आदेश',
      customers: 'ग्राहक',
      products: 'उत्पाद',
    },
    products: {
      title: 'उत्पाद',
      add: 'उत्पाद जोड़ें',
      name: 'उत्पाद का नाम',
      price: 'कीमत',
      stock: 'स्टॉक',
      category: 'श्रेणी',
    },
    orders: {
      title: 'आदेश',
      new: 'नया आदेश',
      status: 'स्थिति',
      total: 'कुल',
      customer: 'ग्राहक',
    },
  },
  zh: {
    common: {
      welcome: '欢迎',
      save: '保存',
      cancel: '取消',
      delete: '删除',
      edit: '编辑',
      search: '搜索',
      loading: '加载中...',
      error: '错误',
      success: '成功',
    },
    dashboard: {
      title: '仪表板',
      revenue: '收入',
      orders: '订单',
      customers: '客户',
      products: '产品',
    },
    products: {
      title: '产品',
      add: '添加产品',
      name: '产品名称',
      price: '价格',
      stock: '库存',
      category: '类别',
    },
    orders: {
      title: '订单',
      new: '新订单',
      status: '状态',
      total: '总计',
      customer: '客户',
    },
  },
  ja: {
    common: {
      welcome: 'ようこそ',
      save: '保存',
      cancel: 'キャンセル',
      delete: '削除',
      edit: '編集',
      search: '検索',
      loading: '読み込み中...',
      error: 'エラー',
      success: '成功',
    },
    dashboard: {
      title: 'ダッシュボード',
      revenue: '収益',
      orders: '注文',
      customers: '顧客',
      products: '製品',
    },
    products: {
      title: '製品',
      add: '製品を追加',
      name: '製品名',
      price: '価格',
      stock: '在庫',
      category: 'カテゴリー',
    },
    orders: {
      title: '注文',
      new: '新規注文',
      status: 'ステータス',
      total: '合計',
      customer: '顧客',
    },
  },
  ar: {
    common: {
      welcome: 'مرحبا',
      save: 'حفظ',
      cancel: 'إلغاء',
      delete: 'حذف',
      edit: 'تحرير',
      search: 'بحث',
      loading: 'جاري التحميل...',
      error: 'خطأ',
      success: 'نجاح',
    },
    dashboard: {
      title: 'لوحة التحكم',
      revenue: 'الإيرادات',
      orders: 'الطلبات',
      customers: 'العملاء',
      products: 'المنتجات',
    },
    products: {
      title: 'المنتجات',
      add: 'إضافة منتج',
      name: 'اسم المنتج',
      price: 'السعر',
      stock: 'المخزون',
      category: 'الفئة',
    },
    orders: {
      title: 'الطلبات',
      new: 'طلب جديد',
      status: 'الحالة',
      total: 'الإجمالي',
      customer: 'العميل',
    },
  },
};

/**
 * Get translation by key
 */
export function t(key: string, locale: Locale = 'en'): string {
  const keys = key.split('.');
  let value: any = translations[locale];

  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k];
    } else {
      return key; // Return key if translation not found
    }
  }

  return typeof value === 'string' ? value : key;
}

/**
 * Get all translations for a locale
 */
export function getTranslations(locale: Locale): Translation {
  return translations[locale] || translations.en;
}

/**
 * Check if locale is supported
 */
export function isLocaleSupported(locale: string): locale is Locale {
  return SUPPORTED_LOCALES.some(l => l.code === locale);
}

