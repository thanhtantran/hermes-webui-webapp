import { Language, Theme } from '../types';

export const translations = {
  en: {
    appTitle: 'HERMES CONSOLE',
    appSubtitle: 'Terminal multi-server management & status monitor',
    serverCount: 'SERVERS',
    serversSingular: 'SERVER',
    language: 'LANGUAGE',
    backup: 'BACKUP',
    addServer: 'ADD SERVER',
    themeToggle: 'Toggle theme (Light / Dark)',
    lightTheme: 'Light Mode',
    darkTheme: 'Dark Mode',
    searchPlaceholder: 'Search host or instance name... [ / ]',
    pingAll: 'PING ALL',
    pinging: 'PINGING...',
    lastChecked: 'Last sweep',
    justNow: 'just now',
    secondsAgo: 's ago',
    minutesAgo: 'm ago',
    never: 'never',
    online: 'ONLINE',
    offline: 'OFFLINE',
    pending: 'PENDING',
    checking: 'PROBING',
    latency: 'LATENCY',
    connect: 'CONNECT',
    openAppWindow: 'APP WINDOW',
    openAppWindowDesc: 'Launch as standalone app window (bypasses iframe restrictions like native app)',
    edit: 'EDIT',
    delete: 'DELETE',
    credentialsSaved: 'CREDENTIALS SAVED',
    noCredentials: 'NO CREDENTIALS',
    deleteConfirm: 'Delete server record?',
    confirmYes: 'YES, DELETE',
    confirmCancel: 'CANCEL',
    noServersTitle: 'NO SERVERS CONFIGURED',
    noServersDesc: 'No Hermes WebUI hosts configured. Add an endpoint to connect and monitor status.',
    noSearchMatch: 'No servers match query',
    addFirstServer: 'ADD FIRST SERVER',
    // Modal
    modalAddTitle: 'ADD HERMES HOST',
    modalEditTitle: 'EDIT HERMES HOST',
    serverNameLabel: 'INSTANCE IDENTIFIER / NAME',
    serverNamePlaceholder: 'e.g. Production Lab, Local Node',
    serverUrlLabel: 'ENDPOINT URL',
    serverUrlPlaceholder: 'https://192.168.1.100:8080',
    urlNote: 'Requires standard HTTP or HTTPS protocol scheme',
    saveCredsLabel: 'STORE INSTANCE PASSWORD FOR AUTO-LOGIN',
    saveCredsDesc: 'Hermes WebUI requires only password authentication (no username).',
    passwordLabel: 'INSTANCE PASSWORD',
    passwordPlaceholder: 'Enter Hermes password',
    btnCancel: 'CANCEL',
    btnSave: 'COMMIT CHANGES',
    btnAdd: 'REGISTER SERVER',
    // Backup Modal
    backupTitle: 'DATABASE BACKUP & MIGRATION',
    exportTab: 'EXPORT JSON',
    importTab: 'IMPORT JSON',
    exportDesc: 'Copy or download the active Hermes server registry JSON payload:',
    importDesc: 'Paste an exported JSON payload to restore or merge server endpoints:',
    copyJson: 'COPY PAYLOAD',
    copied: 'COPIED TO CLIPBOARD',
    downloadJson: 'DOWNLOAD .JSON',
    importBtn: 'INGEST PAYLOAD',
    // WebView / Session & Proxy
    backToConsole: 'CONSOLE',
    copyPass: 'COPY PASS',
    copiedShort: 'COPIED',
    autoLoginReady: 'CREDENTIAL READY',
    noCredsSession: 'NO STORED PASSWORD',
    launchDirect: 'OPEN IN NEW TAB',
    reloading: 'RELOADING...',
    loadingFrame: 'INITIALIZING HERMES SESSION...',
    proxyActive: 'X-FRAME PROXY ACTIVE',
    proxyDirect: 'DIRECT RAW URL',
    proxyDesc: 'X-Frame-Options and CSP headers bypassed via server proxy',
    securityNoticeTitle: 'EMBEDDED BROWSER SECURITY NOTICE',
    securityNoticeDesc: 'If this frame remains blank or connection refused, you can toggle between Proxy Bypass Mode and Direct URL below.',
    openTabBtn: 'OPEN HERMES DIRECTLY',
  },
  vi: {
    appTitle: 'BẢNG ĐIỀU KHIỂN HERMES',
    appSubtitle: 'Quản trị đa máy chủ & giám sát trạng thái Hermes WebUI',
    serverCount: 'MÁY CHỦ',
    serversSingular: 'MÁY CHỦ',
    language: 'NGÔN NGỮ',
    backup: 'SAO LƯU',
    addServer: 'THÊM MÁY CHỦ',
    themeToggle: 'Chuyển giao diện sáng / tối',
    lightTheme: 'Giao diện sáng',
    darkTheme: 'Giao diện tối',
    searchPlaceholder: 'Tìm kiếm tên máy chủ hoặc URL... [ / ]',
    pingAll: 'KIỂM TRA TẤT CẢ',
    pinging: 'ĐANG KIỂM TRA...',
    lastChecked: 'Kiểm tra gần nhất',
    justNow: 'vừa xong',
    secondsAgo: 'giây trước',
    minutesAgo: 'phút trước',
    never: 'chưa kiểm tra',
    online: 'TRỰC TUYẾN',
    offline: 'NGOẠI TUYẾN',
    pending: 'CHỜ KIỂM TRA',
    checking: 'ĐANG QUÉT',
    latency: 'ĐỘ TRỄ',
    connect: 'KẾT NỐI (NHÚNG)',
    openAppWindow: 'CỬA SỔ APP',
    openAppWindowDesc: 'Mở trong cửa sổ app riêng biệt (hoạt động giống hệt ứng dụng React Native gốc)',
    edit: 'SỬA',
    delete: 'XÓA',
    credentialsSaved: 'ĐÃ LƯU MẬT KHẨU',
    noCredentials: 'CHƯA LƯU MẬT KHẨU',
    deleteConfirm: 'Xác nhận xóa máy chủ này?',
    confirmYes: 'XÓA NGAY',
    confirmCancel: 'HỦY',
    noServersTitle: 'CHƯA CÓ MÁY CHỦ NÀO',
    noServersDesc: 'Chưa có máy chủ Hermes WebUI nào được thiết lập. Hãy thêm máy chủ mới để quản lý và kết nối.',
    noSearchMatch: 'Không tìm thấy máy chủ phù hợp với từ khóa',
    addFirstServer: 'THÊM MÁY CHỦ ĐẦU TIÊN',
    // Modal
    modalAddTitle: 'THÊM MÁY CHỦ HERMES',
    modalEditTitle: 'CHỈNH SỬA MÁY CHỦ',
    serverNameLabel: 'TÊN ĐỊNH DANH MÁY CHỦ',
    serverNamePlaceholder: 'Ví dụ: Production Lab, Máy chủ nhà',
    serverUrlLabel: 'ĐỊA CHỈ URL MÁY CHỦ',
    serverUrlPlaceholder: 'https://192.168.1.100:8080',
    urlNote: 'Cần bao gồm giao thức chuẩn http:// hoặc https://',
    saveCredsLabel: 'LƯU MẬT KHẨU ĐỂ TỰ ĐỘNG ĐĂNG NHẬP',
    saveCredsDesc: 'Hermes WebUI sử dụng phương thức đăng nhập chỉ với mật khẩu (không cần tên đăng nhập).',
    passwordLabel: 'MẬT KHẨU TRUY CẬP',
    passwordPlaceholder: 'Nhập mật khẩu Hermes',
    btnCancel: 'HỦY BỎ',
    btnSave: 'LƯU THAY ĐỔI',
    btnAdd: 'LƯU MÁY CHỦ',
    // Backup Modal
    backupTitle: 'SAO LƯU & DI CHUYỂN DỮ LIỆU',
    exportTab: 'XUẤT DỮ LIỆU (JSON)',
    importTab: 'NHẬP DỮ LIỆU (JSON)',
    exportDesc: 'Sao chép hoặc tải về cấu hình các máy chủ Hermes dưới dạng tệp JSON:',
    importDesc: 'Dán đoạn mã JSON để khôi phục hoặc kết hợp danh sách máy chủ:',
    copyJson: 'SAO CHÉP DỮ LIỆU',
    copied: 'ĐÃ SAO CHÉP',
    downloadJson: 'TẢI TỆP .JSON',
    importBtn: 'TIẾP NHẬN DỮ LIỆU',
    // WebView / Session & Proxy
    backToConsole: 'BẢNG ĐIỀU KHIỂN',
    copyPass: 'CHÉP PASS',
    copiedShort: 'ĐÃ CHÉP',
    autoLoginReady: 'SẴN SÀNG MẬT KHẨU',
    noCredsSession: 'CHƯA LƯU MẬT KHẨU',
    launchDirect: 'MỞ TRONG TAB MỚI',
    reloading: 'ĐANG TẢI LẠI...',
    loadingFrame: 'ĐANG KHỞI TẠO PHIÊN HERMES...',
    proxyActive: 'BỎ QUA X-FRAME (PROXY)',
    proxyDirect: 'URL GỐC TRỰC TIẾP',
    proxyDesc: 'Đã bỏ qua các tiêu đề X-Frame-Options và CSP thông qua máy chủ proxy',
    securityNoticeTitle: 'CHẾ ĐỘ XEM TRANG WEB HERMES',
    securityNoticeDesc: 'Nếu máy chủ từ chối kết nối trực tiếp, ứng dụng đã tự động kích hoạt Proxy Bỏ qua X-Frame-Options để hiển thị mượt mà bên trong khung.',
    openTabBtn: 'MỞ TRỰC TIẾP TRÊN TRÌNH DUYỆT',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

const LANG_STORAGE_KEY = 'hermes_language';
const THEME_STORAGE_KEY = 'hermes_theme';

export function getStoredLanguage(): Language {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'vi' || saved === 'en') {
      return saved;
    }
    if (navigator.language && navigator.language.startsWith('vi')) {
      return 'vi';
    }
    return 'vi'; // Default to Vietnamese for Vietnamese users
  } catch {
    return 'vi';
  }
}

export function saveStoredLanguage(lang: Language): void {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // silent
  }
}

export function getStoredTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    return 'dark'; // Default to tech dark console
  } catch {
    return 'dark';
  }
}

export function saveStoredTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // silent
  }
}
