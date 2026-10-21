import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../src/utils/storage';
import { pingServerUrl } from '../src/utils/ping';
import { translations } from '../src/utils/i18n';
import type { HermesURL, PingResult, Language, Theme } from '../src/types';

const STORAGE_KEY = 'hermes_urls';
const LANG_KEY = 'hermes_lang';
const THEME_KEY = 'hermes_theme';


export default function HomeScreen() {
  const router = useRouter();
  const [urls, setUrls] = useState<HermesURL[]>([]);
  const [lang, setLang] = useState<Language>('vi');
  const [theme, setTheme] = useState<Theme>('dark');
  const [searchQuery, setSearchQuery] = useState('');
  const [pingResults, setPingResults] = useState<Record<string, PingResult>>({});
  const [isPingingAll, setIsPingingAll] = useState(false);
  const [lastCheckedTime, setLastCheckedTime] = useState<number | null>(null);

  // Modals
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUrl, setEditingUrl] = useState<HermesURL | null>(null);
  const [backupVisible, setBackupVisible] = useState(false);
  const [backupTab, setBackupTab] = useState<'export' | 'import'>('export');
  const [importJson, setImportJson] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    password: '',
    saveCredentials: false,
  });

  const t = translations[lang];
  const isDark = theme === 'dark';

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const savedUrls = await storage.getItem<HermesURL[]>(STORAGE_KEY, []);
    const savedLang = await storage.getItem<Language>(LANG_KEY, 'vi');
    const savedTheme = await storage.getItem<Theme>(THEME_KEY, 'dark');

    // Remove any demo presets from previous sessions so user starts clean
    const cleanedUrls = savedUrls.filter(
      (u) => u.id !== 'demo-orangepi' && u.url !== 'https://hermes.orangepi.vn'
    );
    if (cleanedUrls.length !== savedUrls.length) {
      await storage.setItem(STORAGE_KEY, cleanedUrls);
    }

    setUrls(cleanedUrls);
    setLang(savedLang);
    setTheme(savedTheme);

    // Initial ping sweep
    if (cleanedUrls.length > 0) {
      pingAll(cleanedUrls);
    }
  };

  const saveUrls = async (newUrls: HermesURL[]) => {
    await storage.setItem(STORAGE_KEY, newUrls);
    setUrls(newUrls);
  };

  const toggleLanguage = async (newLang: Language) => {
    setLang(newLang);
    await storage.setItem(LANG_KEY, newLang);
  };

  const toggleTheme = async () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    await storage.setItem(THEME_KEY, next);
  };

  const pingSingle = useCallback(async (item: HermesURL) => {
    setPingResults((prev) => ({
      ...prev,
      [item.id]: { status: 'checking' },
    }));

    const result = await pingServerUrl(item.url);

    setPingResults((prev) => ({
      ...prev,
      [item.id]: {
        status: result.isOnline ? 'online' : 'offline',
        latencyMs: result.latencyMs,
        lastCheckedAt: Date.now(),
        error: result.error,
      },
    }));
  }, []);

  const pingAll = useCallback(async (targets?: HermesURL[]) => {
    const list = targets || urls;
    if (list.length === 0) return;

    setIsPingingAll(true);
    setPingResults((prev) => {
      const next = { ...prev };
      list.forEach((u) => {
        next[u.id] = { ...next[u.id], status: 'checking' };
      });
      return next;
    });

    const results = await Promise.all(
      list.map(async (u) => {
        const res = await pingServerUrl(u.url);
        return {
          id: u.id,
          result: {
            status: (res.isOnline ? 'online' : 'offline') as 'online' | 'offline',
            latencyMs: res.latencyMs,
            lastCheckedAt: Date.now(),
            error: res.error,
          },
        };
      })
    );

    setPingResults((prev) => {
      const next = { ...prev };
      results.forEach((r) => {
        next[r.id] = r.result;
      });
      return next;
    });

    setLastCheckedTime(Date.now());
    setIsPingingAll(false);
  }, [urls]);

  // Periodic polling every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      pingAll();
    }, 30000);
    return () => clearInterval(interval);
  }, [pingAll]);

  const openAddModal = () => {
    setEditingUrl(null);
    setFormData({
      name: '',
      url: '',
      password: '',
      saveCredentials: false,
    });
    setModalVisible(true);
  };

  const openEditModal = (url: HermesURL) => {
    setEditingUrl(url);
    setFormData({
      name: url.name,
      url: url.url,
      password: url.password || '',
      saveCredentials: url.saveCredentials,
    });
    setModalVisible(true);
  };


  const handleSave = async () => {
    if (!formData.name.trim() || !formData.url.trim()) {
      Alert.alert('Error', lang === 'vi' ? 'Vui lòng nhập tên và URL' : 'Please fill in name and URL');
      return;
    }

    let trimmedUrl = formData.url.trim();
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      trimmedUrl = `https://${trimmedUrl}`;
    }

    try {
      new URL(trimmedUrl);
    } catch {
      Alert.alert('Error', lang === 'vi' ? 'URL không hợp lệ' : 'Please enter a valid URL');
      return;
    }

    const newUrl: HermesURL = {
      id: editingUrl?.id || Date.now().toString(),
      name: formData.name.trim(),
      url: trimmedUrl,
      password: formData.saveCredentials ? formData.password : undefined,
      saveCredentials: formData.saveCredentials,
    };

    let newUrls: HermesURL[];
    if (editingUrl) {
      newUrls = urls.map((u) => (u.id === editingUrl.id ? newUrl : u));
    } else {
      newUrls = [...urls, newUrl];
    }

    await saveUrls(newUrls);
    pingSingle(newUrl);
    setModalVisible(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      t.delete,
      t.deleteConfirm,
      [
        { text: t.confirmCancel, style: 'cancel' },
        {
          text: t.confirmYes,
          style: 'destructive',
          onPress: async () => {
            const newUrls = urls.filter((u) => u.id !== id);
            await saveUrls(newUrls);
          },
        },
      ]
    );
  };

  const handleConnect = (url: HermesURL) => {
    router.push({
      pathname: '/webview',
      params: {
        urlData: JSON.stringify(url),
      },
    });
  };

  const handleImport = async () => {
    if (!importJson.trim()) return;
    try {
      const parsed = JSON.parse(importJson.trim());
      if (!Array.isArray(parsed)) throw new Error();
      const merged = [...urls];
      parsed.forEach((item: any) => {
        if (item.url && !merged.some((m) => m.url === item.url)) {
          merged.push({
            id: item.id || Date.now().toString(),
            name: item.name || 'Server',
            url: item.url,
            password: item.password,
            saveCredentials: Boolean(item.saveCredentials),
          });
        }
      });
      await saveUrls(merged);
      pingAll(merged);
      setBackupVisible(false);
      setImportJson('');
    } catch {
      Alert.alert('Error', lang === 'vi' ? 'JSON không hợp lệ' : 'Invalid JSON');
    }
  };

  const filtered = urls.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const colors = isDark
    ? {
        bg: '#090d16',
        card: '#0f172a',
        border: '#1e293b',
        text: '#f8fafc',
        muted: '#94a3b8',
        accent: '#22d3ee',
        inputBg: '#0b0f19',
      }
    : {
        bg: '#f1f5f9',
        card: '#ffffff',
        border: '#cbd5e1',
        text: '#0f172a',
        muted: '#64748b',
        accent: '#0891b2',
        inputBg: '#f8fafc',
      };

  const renderUrlCard = ({ item }: { item: HermesURL }) => {
    const ping = pingResults[item.id];
    const isOnline = ping?.status === 'online';
    const isOffline = ping?.status === 'offline';
    const isChecking = ping?.status === 'checking';

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => handleConnect(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          {/* Status Indicator */}
          <View style={styles.statusRow}>
            {isOnline && (
              <View style={[styles.badge, { backgroundColor: isDark ? '#052e16' : '#dcfce7', borderColor: '#22c55e' }]}>
                <View style={[styles.dot, { backgroundColor: '#22c55e' }]} />
                <Text style={[styles.badgeText, { color: isDark ? '#4ade80' : '#15803d' }]}>
                  {t.online} {ping?.latencyMs ? `· ${ping.latencyMs}ms` : ''}
                </Text>
              </View>
            )}
            {isOffline && (
              <View style={[styles.badge, { backgroundColor: isDark ? '#4c0519' : '#ffe4e6', borderColor: '#f43f5e' }]}>
                <View style={[styles.dot, { backgroundColor: '#f43f5e' }]} />
                <Text style={[styles.badgeText, { color: isDark ? '#fb7185' : '#be123c' }]}>
                  {t.offline}
                </Text>
              </View>
            )}
            {isChecking && (
              <View style={[styles.badge, { backgroundColor: isDark ? '#083344' : '#e0f2fe', borderColor: '#06b6d4' }]}>
                <Text style={[styles.badgeText, { color: isDark ? '#67e8f9' : '#0369a1' }]}>
                  {t.checking}
                </Text>
              </View>
            )}
            {!isOnline && !isOffline && !isChecking && (
              <View style={[styles.badge, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <View style={[styles.dot, { backgroundColor: '#64748b' }]} />
                <Text style={[styles.badgeText, { color: colors.muted }]}>{t.pending}</Text>
              </View>
            )}

            <TouchableOpacity onPress={() => pingSingle(item)} style={styles.iconBtn}>
              <Ionicons name="refresh-outline" size={14} color={colors.muted} />
            </TouchableOpacity>
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => openEditModal(item)} style={styles.iconBtn}>
              <Ionicons name="pencil-outline" size={16} color={colors.accent} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconBtn}>
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Server Info */}
        <Text style={[styles.serverName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.serverUrl, { color: colors.muted }]} numberOfLines={1}>
          {item.url}
        </Text>

        {/* Footer credentials badge & connect button */}
        <View style={styles.cardFooter}>
          {item.saveCredentials ? (
            <View style={[styles.credBadge, { backgroundColor: isDark ? '#083344' : '#ecfeff', borderColor: colors.accent }]}>
              <Ionicons name="key-outline" size={12} color={colors.accent} />
              <Text style={[styles.credText, { color: colors.accent }]}>{t.credentialsSaved}</Text>
            </View>
          ) : (
            <Text style={[styles.credMuted, { color: colors.muted }]}>{t.noCredentials}</Text>
          )}

          <TouchableOpacity
            style={[styles.connectBtn, { backgroundColor: colors.accent }]}
            onPress={() => handleConnect(item)}
          >
            <Text style={[styles.connectBtnText, { color: isDark ? '#090d16' : '#ffffff' }]}>
              {t.connect}
            </Text>
            <Ionicons name="arrow-forward" size={14} color={isDark ? '#090d16' : '#ffffff'} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      {/* Top Header */}
      {/* Top Header - 2 rows for optimal mobile view */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        {/* Row 1: Brand Wordmark & Language Switcher */}
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="terminal" size={20} color={colors.accent} />
            <Text style={[styles.headerTitle, { color: colors.text }]}>HERMES.UI</Text>
            <View style={[styles.countBadge, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <Text style={[styles.countText, { color: colors.muted }]}>
                {urls.length} {urls.length === 1 ? t.serversSingular : t.serverCount}
              </Text>
            </View>
          </View>

          {/* Language Switcher [ EN | VI ] */}
          <View style={[styles.langSwitch, { borderColor: colors.border }]}>
            <TouchableOpacity
              onPress={() => toggleLanguage('en')}
              style={[styles.langBtn, lang === 'en' && { backgroundColor: colors.accent }]}
            >
              <Text style={[styles.langText, { color: lang === 'en' ? (isDark ? '#090d16' : '#fff') : colors.muted }]}>
                EN
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => toggleLanguage('vi')}
              style={[styles.langBtn, lang === 'vi' && { backgroundColor: colors.accent }]}
            >
              <Text style={[styles.langText, { color: lang === 'vi' ? (isDark ? '#090d16' : '#fff') : colors.muted }]}>
                VI
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Row 2: Theme Toggle, Backup and Add Server */}
        <View style={[styles.headerBottomRow, { borderTopColor: colors.border }]}>
          <View style={styles.headerBottomLeft}>
            {/* Theme Toggle (Light / Dark) */}
            <TouchableOpacity
              onPress={toggleTheme}
              style={[styles.headerBtn, { borderColor: colors.border, backgroundColor: colors.inputBg }]}
              accessibilityLabel={t.themeToggle}
            >
              <Ionicons name={isDark ? 'sunny' : 'moon'} size={15} color={isDark ? '#f59e0b' : '#334155'} />
              <Text style={[styles.headerBtnLabel, { color: colors.text }]}>
                {isDark ? t.lightTheme : t.darkTheme}
              </Text>
            </TouchableOpacity>

            {/* Backup Button */}
            <TouchableOpacity
              onPress={() => setBackupVisible(true)}
              style={[styles.headerBtn, { borderColor: colors.border, backgroundColor: colors.inputBg }]}
            >
              <Ionicons name="download-outline" size={15} color={colors.text} />
              <Text style={[styles.headerBtnLabel, { color: colors.text }]}>{t.backup}</Text>
            </TouchableOpacity>
          </View>

          {/* Add Server Button */}
          <TouchableOpacity onPress={openAddModal} style={[styles.addBtn, { backgroundColor: colors.accent }]}>
            <Ionicons name="add" size={16} color={isDark ? '#090d16' : '#ffffff'} />
            <Text style={[styles.addBtnText, { color: isDark ? '#090d16' : '#ffffff' }]}>{t.addServer}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Toolbar: Search & Ping All */}
      <View style={styles.content}>
        <View style={[styles.toolbar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.searchBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <Ionicons name="search" size={16} color={colors.muted} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={t.searchPlaceholder}
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <TouchableOpacity
            style={[styles.pingAllBtn, { borderColor: colors.border, backgroundColor: colors.inputBg }]}
            onPress={() => pingAll()}
            disabled={isPingingAll}
          >
            <Ionicons name="refresh" size={14} color={colors.accent} />
            <Text style={[styles.pingAllText, { color: colors.text }]}>
              {isPingingAll ? t.pinging : t.pingAll}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Server List */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderUrlCard}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={[styles.emptyContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="server-outline" size={48} color={colors.muted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>{t.noServersTitle}</Text>
              <Text style={[styles.emptyDesc, { color: colors.muted }]}>{t.noServersDesc}</Text>
              <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: colors.accent }]} onPress={openAddModal}>
                <Text style={[styles.emptyBtnText, { color: isDark ? '#090d16' : '#ffffff' }]}>{t.addFirstServer}</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>

      {/* Add / Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingUrl ? t.modalEditTitle : t.modalAddTitle}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>{t.serverNameLabel}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                placeholder={t.serverNamePlaceholder}
                placeholderTextColor={colors.muted}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              <View style={styles.urlLabelRow}>
                <Text style={[styles.fieldLabel, { color: colors.muted }]}>{t.serverUrlLabel}</Text>
              </View>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                placeholder={t.serverUrlPlaceholder}
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                keyboardType="url"
                value={formData.url}
                onChangeText={(text) => setFormData({ ...formData, url: text })}
              />

              {/* Save credentials toggle */}
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setFormData({ ...formData, saveCredentials: !formData.saveCredentials })}
              >
                <Ionicons
                  name={formData.saveCredentials ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={formData.saveCredentials ? colors.accent : colors.muted}
                />
                <View style={styles.checkboxTextWrap}>
                  <Text style={[styles.checkboxLabel, { color: colors.text }]}>{t.saveCredsLabel}</Text>
                  <Text style={[styles.checkboxDesc, { color: colors.muted }]}>{t.saveCredsDesc}</Text>
                </View>
              </TouchableOpacity>

              {formData.saveCredentials && (
                <View style={styles.passwordWrap}>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>{t.passwordLabel}</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                    placeholder={t.passwordPlaceholder}
                    placeholderTextColor={colors.muted}
                    secureTextEntry
                    value={formData.password}
                    onChangeText={(text) => setFormData({ ...formData, password: text })}
                  />
                </View>
              )}
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity style={[styles.btnCancel, { borderColor: colors.border }]} onPress={() => setModalVisible(false)}>
                <Text style={[styles.btnCancelText, { color: colors.text }]}>{t.btnCancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnSubmit, { backgroundColor: colors.accent }]} onPress={handleSave}>
                <Text style={[styles.btnSubmitText, { color: isDark ? '#090d16' : '#ffffff' }]}>
                  {editingUrl ? t.btnSave : t.btnAdd}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Backup / Restore Modal */}
      <Modal visible={backupVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t.backupTitle}</Text>
              <TouchableOpacity onPress={() => setBackupVisible(false)}>
                <Ionicons name="close" size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.backupTabs}>
              <TouchableOpacity
                style={[styles.backupTab, backupTab === 'export' && { borderBottomColor: colors.accent }]}
                onPress={() => setBackupTab('export')}
              >
                <Text style={[styles.backupTabText, { color: backupTab === 'export' ? colors.accent : colors.muted }]}>
                  {t.exportTab}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.backupTab, backupTab === 'import' && { borderBottomColor: colors.accent }]}
                onPress={() => setBackupTab('import')}
              >
                <Text style={[styles.backupTabText, { color: backupTab === 'import' ? colors.accent : colors.muted }]}>
                  {t.importTab}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {backupTab === 'export' ? (
                <>
                  <Text style={[styles.backupDesc, { color: colors.muted }]}>{t.exportDesc}</Text>
                  <TextInput
                    style={[styles.jsonBox, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                    multiline
                    editable={false}
                    value={JSON.stringify(urls, null, 2)}
                  />
                </>
              ) : (
                <>
                  <Text style={[styles.backupDesc, { color: colors.muted }]}>{t.importDesc}</Text>
                  <TextInput
                    style={[styles.jsonBox, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                    multiline
                    placeholder='[{"name": "...", "url": "..."}]'
                    placeholderTextColor={colors.muted}
                    value={importJson}
                    onChangeText={setImportJson}
                  />
                  <TouchableOpacity style={[styles.btnSubmit, { backgroundColor: colors.accent, marginTop: 12 }]} onPress={handleImport}>
                    <Text style={[styles.btnSubmitText, { color: isDark ? '#090d16' : '#ffffff' }]}>{t.importBtn}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  headerBottomLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  countText: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  headerBtnLabel: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  langSwitch: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  langBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  langText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    height: 36,
  },
  searchInput: {
    flex: 1,
    marginLeft: 6,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  pingAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
  },
  pingAllText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  listContainer: {
    paddingBottom: 24,
    gap: 10,
  },
  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    padding: 4,
  },
  serverName: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  serverUrl: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  credBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  credText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  credMuted: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  connectBtnText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  emptyDesc: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  emptyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 16,
  },
  modalBox: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  modalBody: {
    padding: 16,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  urlLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  demoLink: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 14,
  },
  checkboxTextWrap: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  checkboxDesc: {
    fontSize: 10,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  passwordWrap: {
    marginTop: 10,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  btnCancel: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  btnCancelText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  btnSubmit: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnSubmitText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  backupTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backupTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  backupTabText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  backupDesc: {
    fontSize: 11,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  jsonBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    height: 140,
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
