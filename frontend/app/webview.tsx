import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  Alert,
  Platform,
  BackHandler,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import type { HermesURL } from '../src/types';

export default function WebViewScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);

  const [urlData, setUrlData] = useState<HermesURL | null>(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const canGoBackRef = useRef(false);

  useEffect(() => {
    if (params.urlData && typeof params.urlData === 'string') {
      try {
        const data = JSON.parse(params.urlData) as HermesURL;
        setUrlData(data);
      } catch {
        Alert.alert('Error', 'Invalid URL data');
        router.back();
      }
    }
  }, [params.urlData]);

  // Android hardware back = webview back (if possible), else close screen
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBackRef.current && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, []);

  const escapeForJs = useCallback((str: string): string => {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r');
  }, []);

  // Auto-login JavaScript injection for Hermes
  const injectedJavaScript = useMemo(() => {
    if (!urlData?.saveCredentials || !urlData.password) {
      return `true;`;
    }

    const safePwd = escapeForJs(urlData.password);

    return `
      (function() {
        if (window.__hermesAutoLoginDone) return;
        var attempts = 0;
        var maxAttempts = 40;

        function findLoginButton() {
          var selectors = [
            'button[type="submit"]',
            'input[type="submit"]',
            '#login-form button[type="submit"]',
            'form button[type="submit"]',
          ];
          for (var i = 0; i < selectors.length; i++) {
            var el = document.querySelector(selectors[i]);
            if (el) return el;
          }
          var buttons = document.querySelectorAll('button, input[type="submit"], input[type="button"]');
          for (var j = 0; j < buttons.length; j++) {
            var btn = buttons[j];
            var txt = (btn.innerText || btn.textContent || btn.value || '').toLowerCase().trim();
            if (txt === 'đăng nhập' || txt === 'dang nhap' || txt === 'login' || txt === 'log in' || txt === 'sign in' || txt === 'submit') {
              return btn;
            }
          }
          return null;
        }

        function tryAutoLogin() {
          attempts++;
          try {
            var pwdInput = document.querySelector('input[type="password"]');
            if (pwdInput) {
              window.__hermesAutoLoginDone = true;
              pwdInput.focus();
              var proto = window.HTMLInputElement && window.HTMLInputElement.prototype;
              var desc = proto ? Object.getOwnPropertyDescriptor(proto, 'value') : null;
              if (desc && desc.set) {
                desc.set.call(pwdInput, '${safePwd}');
              } else {
                pwdInput.value = '${safePwd}';
              }
              pwdInput.dispatchEvent(new Event('input', { bubbles: true }));
              pwdInput.dispatchEvent(new Event('change', { bubbles: true }));

              setTimeout(function() {
                var loginBtn = findLoginButton();
                if (loginBtn) {
                  loginBtn.click();
                } else {
                  var form = pwdInput.form || document.getElementById('login-form');
                  if (form) {
                    if (typeof form.requestSubmit === 'function') {
                      form.requestSubmit();
                    } else {
                      form.submit();
                    }
                  }
                }
              }, 300);
              return true;
            }
          } catch (e) {
            // silent
          }
          return false;
        }

        function poll() {
          if (window.__hermesAutoLoginDone) return;
          if (tryAutoLogin()) return;
          if (attempts < maxAttempts) {
            setTimeout(poll, 250);
          }
        }

        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', poll);
        } else {
          poll();
        }
      })();
      true;
    `;
  }, [urlData?.saveCredentials, urlData?.password, escapeForJs]);

  const handleNavigationStateChange = useCallback((navState: any) => {
    canGoBackRef.current = navState.canGoBack;
  }, []);

  if (!urlData) {
    return (
      <View style={styles.container}>
        <View style={styles.initialLoading}>
          <ActivityIndicator size="large" color="#22d3ee" />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Native Mobile Header */}
      <View style={styles.header}>
        <TouchableOpacity
          testID="webview-back-button"
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color="#f8fafc" />
        </TouchableOpacity>

        <View style={styles.headerTitle}>
          <Text style={styles.headerTitleText} numberOfLines={1}>
            {urlData.name}
          </Text>
          <Text style={styles.headerUrl} numberOfLines={1}>
            {urlData.url}
          </Text>
        </View>

        {urlData.saveCredentials && urlData.password && (
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            <Ionicons name={copied ? 'checkmark' : 'key-outline'} size={18} color="#22d3ee" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          testID="webview-reload-button"
          style={styles.headerButton}
          onPress={() => {
            webViewRef.current?.injectJavaScript('window.__hermesAutoLoginDone = false; true;');
            webViewRef.current?.reload();
          }}
        >
          <Ionicons name="refresh" size={20} color="#f8fafc" />
        </TouchableOpacity>
      </View>

      {/* React Native WebView — Native Android/iOS ignores X-Frame-Options */}
      <View style={styles.webviewWrap}>
        <WebView
          ref={webViewRef}
          source={{ uri: urlData.url }}
          style={styles.webview}
          onLoadEnd={() => {
            if (!initialLoadDone) setInitialLoadDone(true);
          }}
          onNavigationStateChange={handleNavigationStateChange}
          injectedJavaScript={injectedJavaScript}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          cacheEnabled={true}
          keyboardDisplayRequiresUserAction={false}
          hideKeyboardAccessoryView={false}
          androidLayerType="hardware"
          setSupportMultipleWindows={false}
          overScrollMode="never"
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          mixedContentMode="always"
          allowsBackForwardNavigationGestures={true}
          originWhitelist={['*']}
        />

        {!initialLoadDone && (
          <View style={styles.initialLoading}>
            <ActivityIndicator size="large" color="#22d3ee" />
            <Text style={styles.loadingText}>Loading Hermes WebUI...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerButton: {
    padding: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    paddingHorizontal: 8,
  },
  headerTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  headerUrl: {
    fontSize: 10,
    color: '#94a3b8',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  webviewWrap: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webview: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  initialLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#090d16',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
