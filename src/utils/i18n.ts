import { Language, Theme } from '../types';

export const translations = {
  en: {
    appTitle: 'HERMES CONSOLE',
    appSubtitle: 'Authenticated multi-server management & status monitor',
    loginTitle: 'SIGN IN TO HERMES CONSOLE',
    loginSubtitle: 'Use your Google account to access the Hermes instances saved to your account.',
    loginBenefitAccounts: 'Each Google account gets an isolated instance list on this server.',
    loginBenefitEncryption: 'Instance passwords are encrypted at rest with AES-256-GCM.',
    loginBenefitApi: 'Every management API call requires a valid authenticated session.',
    loginAuthError: 'Google sign-in failed. Please try again.',
    loginConfigError: 'Google sign-in is not configured on this server.',
    loginScriptError: 'The Google sign-in script could not be loaded.',
    loginVerifying: 'VERIFYING GOOGLE ACCOUNT...',
    loginLoading: 'LOADING SIGN-IN...',
    loginGoogleHint: 'A Google account is required. Accounts are created automatically on first sign-in.',
    passwordStoredServerSide: 'Passwords are encrypted on the server and never stored in this browser.',
    dismiss: 'Dismiss',
    retry: 'RETRY',
    loadingConsole: 'INITIALIZING CONSOLE...',
    loadingInstances: 'SYNCING INSTANCES...',
    requestFailed: 'Request failed',
    sessionExpired: 'Your session expired. Please sign in again.',
    signedInAs: 'SIGNED IN AS',
    logout: 'SIGN OUT',
    account: 'ACCOUNT',
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
    openAppWindowDesc: 'Launch in a separate app window (opens the instance directly)',
    edit: 'EDIT',
    delete: 'DELETE',
    credentialsSaved: 'PASSWORD ENCRYPTED',
    noCredentials: 'NO STORED PASSWORD',
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
    passwordLabel: 'INSTANCE PASSWORD (OPTIONAL)',
    passwordPlaceholder: 'Enter a Hermes password to store encrypted',
    passwordHelp: 'The password is encrypted at rest with AES-256-GCM and can be revealed only to your account.',
    passwordKeepHint: 'Leave blank to keep the currently stored password.',
    clearStoredPassword: 'REMOVE STORED PASSWORD',
    clearStoredPasswordHint: 'Deletes the encrypted password from the server.',
    btnCancel: 'CANCEL',
    btnSave: 'COMMIT CHANGES',
    btnAdd: 'REGISTER SERVER',
    // Backup Modal
    backupTitle: 'DATABASE BACKUP & MIGRATION',
    exportTab: 'EXPORT JSON',
    importTab: 'IMPORT JSON',
    exportDesc: 'Copy or download the instance registry. Passwords are never included in exports.',
    importDesc: 'Paste an exported JSON payload. Optional password fields are encrypted by the server on import.',
    backupNoPasswords: 'PASSWORDS ARE NEVER EXPORTED',
    copyJson: 'COPY PAYLOAD',
    copied: 'COPIED TO CLIPBOARD',
    downloadJson: 'DOWNLOAD .JSON',
    importBtn: 'INGEST PAYLOAD',
    // WebView / Session & Proxy
    backToConsole: 'CONSOLE',
    copyPass: 'COPY PASS',
    copiedShort: 'COPIED',
    autoLoginReady: 'PASSWORD STORED (ENCRYPTED)',
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
    appSubtitle: 'Quản trị đa máy chủ & giám sát trạng thái (có xác thực)',
    loginTitle: 'ĐĂNG NHẬP HERMES CONSOLE',
    loginSubtitle: 'Đăng nhập bằng tài khoản Google để truy cập các instance Hermes đã lưu trong tài khoản của bạn.',
    loginBenefitAccounts: 'Mỗi tài khoản Google có danh sách instance riêng trên máy chủ này.',
    loginBenefitEncryption: 'Mật khẩu instance được mã hóa khi lưu bằng AES-256-GCM.',
    loginBenefitApi: 'Mọi lệnh gọi API quản trị đều yêu cầu phiên đăng nhập hợp lệ.',
    loginAuthError: 'Đăng nhập Google thất bại. Vui lòng thử lại.',
    loginConfigError: 'Máy chủ này chưa cấu hình đăng nhập Google.',
    loginScriptError: 'Không thể tải thư viện đăng nhập Google.',
    loginVerifying: 'ĐANG XÁC THỰC TÀI KHOẢN GOOGLE...',
    loginLoading: 'ĐANG TẢI ĐĂNG NHẬP...',
    loginGoogleHint: 'Cần có tài khoản Google. Tài khoản sẽ được tạo tự động trong lần đăng nhập đầu tiên.',
    passwordStoredServerSide: 'Mật khẩu được mã hóa trên máy chủ và không bao giờ lưu trong trình duyệt này.',
    dismiss: 'Đóng',
    retry: 'THỬ LẠI',
    loadingConsole: 'ĐANG KHỞI TẠO BẢNG ĐIỀU KHIỂN...',
    loadingInstances: 'ĐANG ĐỒNG BỘ INSTANCE...',
    requestFailed: 'Yêu cầu thất bại',
    sessionExpired: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    signedInAs: 'ĐĂNG NHẬP BẰNG',
    logout: 'ĐĂNG XUẤT',
    account: 'TÀI KHOẢN',
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
    openAppWindowDesc: 'Mở trong cửa sổ app riêng biệt (mở trực tiếp instance)',
    edit: 'SỬA',
    delete: 'XÓA',
    credentialsSaved: 'MẬT KHẨU ĐÃ MÃ HÓA',
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
    passwordLabel: 'MẬT KHẨU INSTANCE (TÙY CHỌN)',
    passwordPlaceholder: 'Nhập mật khẩu Hermes để mã hóa và lưu',
    passwordHelp: 'Mật khẩu được mã hóa khi lưu bằng AES-256-GCM và chỉ tài khoản của bạn mới có thể xem lại.',
    passwordKeepHint: 'Để trống để giữ nguyên mật khẩu đang lưu.',
    clearStoredPassword: 'XÓA MẬT KHẨU ĐÃ LƯU',
    clearStoredPasswordHint: 'Xóa mật khẩu đã mã hóa khỏi máy chủ.',
    btnCancel: 'HỦY BỎ',
    btnSave: 'LƯU THAY ĐỔI',
    btnAdd: 'LƯU MÁY CHỦ',
    // Backup Modal
    backupTitle: 'SAO LƯU & DI CHUYỂN DỮ LIỆU',
    exportTab: 'XUẤT DỮ LIỆU (JSON)',
    importTab: 'NHẬP DỮ LIỆU (JSON)',
    exportDesc: 'Sao chép hoặc tải về danh sách instance. Mật khẩu không bao giờ được đưa vào tệp xuất.',
    importDesc: 'Dán đoạn JSON đã xuất. Trường mật khẩu tùy chọn sẽ được máy chủ mã hóa khi nhập.',
    backupNoPasswords: 'MẬT KHẨU KHÔNG BAO GIỜ ĐƯỢC XUẤT RA',
    copyJson: 'SAO CHÉP DỮ LIỆU',
    copied: 'ĐÃ SAO CHÉP',
    downloadJson: 'TẢI TỆP .JSON',
    importBtn: 'TIẾP NHẬN DỮ LIỆU',
    // WebView / Session & Proxy
    backToConsole: 'BẢNG ĐIỀU KHIỂN',
    copyPass: 'CHÉP PASS',
    copiedShort: 'ĐÃ CHÉP',
    autoLoginReady: 'MẬT KHẨU ĐÃ LƯU (MÃ HÓA)',
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
