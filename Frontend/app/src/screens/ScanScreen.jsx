import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';

import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const API_URL = 'http://172.20.10.4:5000';

// Auto-scan fires every N ms
const AUTO_SCAN_INTERVAL = 3500;

// ── XAI rejection explanations ────────────────────────────────────────────────
const XAI_INFO = {
  quality_blur: {
    icon:   'weather-fog',
    color:  '#FF9800',
    title:  'Image Too Blurry',
    reason: 'The camera could not capture a sharp image of the skin.',
    tip:    'Hold your phone steady and keep the pet still. Move closer and ensure good lighting.',
  },
  quality_exposure: {
    icon:   'brightness-6',
    color:  '#FFD54F',
    title:  'Poor Lighting',
    reason: 'The image is too dark or overexposed for the AI to analyze.',
    tip:    'Turn on the torch, move to a brighter area, or avoid direct sunlight.',
  },
  dog_detector: {
    icon:   'dog-side',
    color:  '#29B6F6',
    title:  'No Dog Detected',
    reason: 'The AI could not confirm a dog is in the frame.',
    tip:    'Point the camera directly at your dog\'s skin. Avoid backgrounds, toys, or other objects.',
  },
  ood: {
    icon:   'help-circle-outline',
    color:  '#AB47BC',
    title:  'Unrecognized Condition',
    reason: 'The image does not match any known dog skin pattern in the AI model.',
    tip:    'Try a different area of the skin or consult a veterinarian for a proper diagnosis.',
  },
  entropy: {
    icon:   'image-filter-center-focus-weak',
    color:  '#EF5350',
    title:  'Image Unclear',
    reason: 'The AI model was uncertain — the image may show multiple areas or be partially obscured.',
    tip:    'Get 15–30 cm closer to the affected skin area and retake.',
  },
  confidence: {
    icon:   'chart-bar',
    color:  '#FF7043',
    title:  'Low Confidence',
    reason: 'The AI prediction confidence was below the required threshold.',
    tip:    'Ensure the affected skin is fully visible, well-lit, and in focus.',
  },
  server: {
    icon:   'server-off',
    color:  '#78909C',
    title:  'Server Unreachable',
    reason: 'The app could not connect to the AI analysis server.',
    tip:    'Make sure both your phone and computer are on the same Wi-Fi network and the server is running.',
  },
};

export default function ScanScreen({ navigation, route }) {
  const petId   = route?.params?.petId   || null;
  const petName = route?.params?.petName || null;

  const cameraRef        = useRef(null);
  const intervalRef      = useRef(null);
  const isScanningRef    = useRef(false);   // guard: don't overlap requests
  const mountedRef       = useRef(true);

  const [permission, requestPermission] = useCameraPermissions();
  const [flash,        setFlash]        = useState('off');  // 'off' | 'torch'
  const [autoMode,     setAutoMode]     = useState(true);
  const [scanState,    setScanState]    = useState('idle'); // idle | scanning | detected | error
  const [statusMsg,    setStatusMsg]    = useState('Hold still…');
  const [dotCount,     setDotCount]     = useState(0);
  const [xaiInfo,      setXaiInfo]      = useState(null);  // rejection explanation

  // ── Animated values ───────────────────────────────────────────────────────
  const scanAnim    = useRef(new Animated.Value(0)).current;
  const pulseAnim   = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.25)).current;
  const xaiSlide    = useRef(new Animated.Value(300)).current;  // starts off-screen

  // ── Clean up on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearInterval(intervalRef.current);
    };
  }, []);

  // ── Permission ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, []);

  // ── Scan line animation ───────────────────────────────────────────────────
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // ── Pulse animation ───────────────────────────────────────────────────────
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // ── Glow animation (intensifies when scanning) ────────────────────────────
  useEffect(() => {
    const target = scanState === 'scanning' ? 1 : 0.25;
    Animated.timing(glowOpacity, {
      toValue: target, duration: 400, useNativeDriver: true,
    }).start();
  }, [scanState]);

  // ── Dots animation for status text ───────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => {
      if (mountedRef.current) setDotCount((p) => (p + 1) % 4);
    }, 500);
    return () => clearInterval(t);
  }, []);

  const dots = '.'.repeat(dotCount);

  // ── Frame scan → Flask AI ─────────────────────────────────────────────────
  const runScan = useCallback(async () => {
    if (!cameraRef.current || isScanningRef.current || !mountedRef.current) return;
    isScanningRef.current = true;

    try {
      if (mountedRef.current) {
        setScanState('scanning');
        setStatusMsg('Analyzing skin');
      }

      // Capture a frame quietly
      const data = await cameraRef.current.takePictureAsync({
        quality:    0.5,
        skipProcessing: true,  // faster
      });

      if (!mountedRef.current) return;

      // Health-check (first scan only or on error recovery)
      const formData = new FormData();
      formData.append('image', {
        uri:  data.uri,
        type: 'image/jpeg',
        name: 'frame.jpg',
      });

      const response = await fetch(`${API_URL}/predict`, {
        method:  'POST',
        body:    formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const result = await response.json();
      if (!mountedRef.current) return;

      if (result.status === 'predicted') {
        // 🎉 Detection success — stop scanning and navigate
        clearInterval(intervalRef.current);
        setScanState('detected');
        setStatusMsg('Detected!');
        setXaiInfo(null);

        setTimeout(() => {
          if (mountedRef.current) {
            navigation.navigate('Results', { photo: data.uri, result, petId, petName });
          }
        }, 600);
        return;
      }

      // ── Build XAI explanation based on rejection stage ─────────────────
      const showXai = (key, shortMsg) => {
        setScanState('error');
        setStatusMsg(shortMsg);
        const info = XAI_INFO[key];
        setXaiInfo(info);
        // Slide panel up
        Animated.spring(xaiSlide, {
          toValue: 0, useNativeDriver: true, tension: 70, friction: 12,
        }).start();
        // Auto-dismiss after 5s
        setTimeout(() => {
          if (mountedRef.current) {
            Animated.timing(xaiSlide, {
              toValue: 300, duration: 250, useNativeDriver: true,
            }).start(() => {
              if (mountedRef.current) {
                setXaiInfo(null);
                setScanState('idle');
                setStatusMsg('Hold still');
              }
            });
          }
        }, 5000);
      };

      if (result.status === 'rejected' && result.stage === 'dog_detector') {
        showXai('dog_detector', 'No dog detected');
      } else if (result.status === 'rejected' && result.reason?.includes('blurry')) {
        showXai('quality_blur', 'Image too blurry');
      } else if (result.status === 'rejected') {
        showXai('quality_exposure', 'Poor lighting');
      } else if (result.status === 'retake' && result.stage === 'entropy') {
        showXai('entropy', 'Image unclear');
      } else if (result.status === 'retake') {
        showXai('confidence', 'Low confidence');
      } else if (result.status === 'unknown') {
        showXai('ood', 'Unrecognized skin');
      } else {
        setScanState('idle');
        setStatusMsg('Hold still');
      }

    } catch (_) {
      if (mountedRef.current) {
        const info = XAI_INFO['server'];
        setXaiInfo(info);
        setScanState('error');
        setStatusMsg('Server not reachable');
        Animated.spring(xaiSlide, {
          toValue: 0, useNativeDriver: true, tension: 70, friction: 12,
        }).start();
        setTimeout(() => {
          if (mountedRef.current) {
            Animated.timing(xaiSlide, {
              toValue: 300, duration: 250, useNativeDriver: true,
            }).start(() => {
              if (mountedRef.current) {
                setXaiInfo(null);
                setScanState('idle');
                setStatusMsg('Hold still');
              }
            });
          }
        }, 5000);
      }
    } finally {
      isScanningRef.current = false;
    }
  }, [navigation, petId, petName]);

  // ── Auto-scan interval (start / stop based on autoMode) ───────────────────
  useEffect(() => {
    if (!permission?.granted) return;
    if (autoMode) {
      intervalRef.current = setInterval(runScan, AUTO_SCAN_INTERVAL);
    } else {
      clearInterval(intervalRef.current);
      setScanState('idle');
      setStatusMsg('Manual mode');
    }
    return () => clearInterval(intervalRef.current);
  }, [autoMode, permission, runScan]);

  // ── Manual shutter (for gallery / override) ───────────────────────────────
  const manualCapture = async () => {
    clearInterval(intervalRef.current);
    await runScan();
    if (autoMode) {
      intervalRef.current = setInterval(runScan, AUTO_SCAN_INTERVAL);
    }
  };

  // ── Gallery picker ────────────────────────────────────────────────────────
  const openGallery = async () => {
    clearInterval(intervalRef.current);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Please allow access to your photo library.');
      if (autoMode) intervalRef.current = setInterval(runScan, AUTO_SCAN_INTERVAL);
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
    });

    if (!picked.canceled && picked.assets?.length > 0) {
      const uri = picked.assets[0].uri;
      setScanState('scanning');
      setStatusMsg('Analyzing image');

      try {
        const formData = new FormData();
        formData.append('image', { uri, type: 'image/jpeg', name: 'gallery.jpg' });

        const response = await fetch(`${API_URL}/predict`, {
          method: 'POST', body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const result = await response.json();

        if (result.status === 'predicted') {
          navigation.navigate('Results', { photo: uri, result, petId, petName });
          return;
        }

        const msg = result.message || 'Could not analyze image. Try another.';
        Alert.alert('Result', msg, [{ text: 'OK' }]);
      } catch {
        Alert.alert('Error', 'Cannot connect to server.');
      }

      setScanState('idle');
      setStatusMsg('Hold still');
    }

    if (autoMode) intervalRef.current = setInterval(runScan, AUTO_SCAN_INTERVAL);
  };

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1], outputRange: [0, height * 0.40],
  });

  // ── Frame border color by state ───────────────────────────────────────────
  const frameColor = {
    idle:     'rgba(168,85,247,0.35)',
    scanning: 'rgba(168,85,247,0.9)',
    detected: '#4CAF50',
    error:    '#FF5252',
  }[scanState] || 'rgba(168,85,247,0.35)';

  const cornerColor = {
    idle:     '#A855F7',
    scanning: '#A855F7',
    detected: '#4CAF50',
    error:    '#FF5252',
  }[scanState] || '#A855F7';

  // ── Status badge ──────────────────────────────────────────────────────────
  const badgeBg = {
    idle:     'rgba(0,0,0,0.55)',
    scanning: 'rgba(100,40,200,0.8)',
    detected: 'rgba(30,140,60,0.9)',
    error:    'rgba(200,40,40,0.8)',
  }[scanState] || 'rgba(0,0,0,0.55)';

  // ─────────────────────────────────────────────────────────────────────────
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#A855F7" size="large" />
        <Text style={styles.centerText}>Requesting camera…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Ionicons name="camera-outline" size={60} color="#A855F7" />
        <Text style={styles.permTitle}>Camera Access Required</Text>
        <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
          <Text style={styles.grantBtnText}>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* LIVE CAMERA */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        flash={flash}       /* 'torch' keeps light on continuously */
      />

      {/* DARK VIGNETTE */}
      <View style={styles.vignette} />

      {/* ── OVERLAY ── */}
      <View style={styles.overlay}>

        {/* PET NAME BANNER */}
        {petName && (
          <View style={styles.petBanner}>
            <Ionicons name="paw" size={13} color="#A855F7" />
            <Text style={styles.petBannerText}>Scanning: {petName}</Text>
          </View>
        )}

        {/* SCANNER FRAME */}
        <Animated.View style={[styles.scannerFrame, { transform: [{ scale: pulseAnim }], borderColor: frameColor }]}>

          {/* Glow layer */}
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: frameColor, opacity: glowOpacity, borderRadius: 20 }]} />

          {/* Corner markers */}
          <View style={[styles.corner, styles.topLeft,     { borderColor: cornerColor }]} />
          <View style={[styles.corner, styles.topRight,    { borderColor: cornerColor }]} />
          <View style={[styles.corner, styles.bottomLeft,  { borderColor: cornerColor }]} />
          <View style={[styles.corner, styles.bottomRight, { borderColor: cornerColor }]} />

          {/* Scan line — only in scanning state */}
          {(scanState === 'idle' || scanState === 'scanning') && (
            <Animated.View style={[styles.scanLine, { backgroundColor: cornerColor, transform: [{ translateY }] }]} />
          )}

          {/* Detected checkmark */}
          {scanState === 'detected' && (
            <View style={styles.detectedOverlay}>
              <Ionicons name="checkmark-circle" size={70} color="#4CAF50" />
            </View>
          )}

          {/* Scanning spinner */}
          {scanState === 'scanning' && (
            <View style={styles.scanningSpinner}>
              <ActivityIndicator size="small" color="#A855F7" />
            </View>
          )}
        </Animated.View>

        {/* STATUS BADGE */}
        <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
          {scanState === 'scanning' && (
            <ActivityIndicator size={12} color="#fff" style={{ marginRight: 6 }} />
          )}
          <Text style={styles.statusText}>
            {statusMsg}{scanState === 'scanning' || scanState === 'idle' ? dots : ''}
          </Text>
        </View>

        {/* AUTO / MANUAL TOGGLE */}
        <TouchableOpacity
          style={[styles.modeToggle, autoMode ? styles.modeOn : styles.modeOff]}
          onPress={() => setAutoMode((p) => !p)}
        >
          <Ionicons
            name={autoMode ? 'radio-button-on' : 'radio-button-off'}
            size={14} color="#fff"
            style={{ marginRight: 5 }}
          />
          <Text style={styles.modeText}>{autoMode ? 'Auto-Scan ON' : 'Auto-Scan OFF'}</Text>
        </TouchableOpacity>
      </View>

      {/* BACK BUTTON */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={22} color="white" />
      </TouchableOpacity>

      {/* BOTTOM CONTROLS */}
      <View style={styles.bottomActions}>

        {/* GALLERY */}
        <TouchableOpacity onPress={openGallery} style={styles.sideBtn}>
          <MaterialCommunityIcons name="image-multiple" size={30} color="white" />
          <Text style={styles.sideBtnLabel}>Gallery</Text>
        </TouchableOpacity>

        {/* TORCH / FLASH toggle — torch keeps light on for captures */}
        <TouchableOpacity
          onPress={() => setFlash((p) => (p === 'off' ? 'torch' : 'off'))}
          style={[styles.sideBtn, styles.flashBtn, flash === 'torch' && styles.flashBtnActive]}
        >
          <MaterialCommunityIcons
            name={flash === 'torch' ? 'flash' : 'flash-off'}
            size={30}
            color={flash === 'torch' ? '#A855F7' : 'white'}
          />
          <Text style={[styles.sideBtnLabel, flash === 'torch' && { color: '#A855F7' }]}>
            {flash === 'torch' ? 'Torch On' : 'Torch Off'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* XAI REJECTION PANEL */}
      {xaiInfo && (
        <Animated.View style={[
          styles.xaiPanel,
          { transform: [{ translateY: xaiSlide }] }
        ]}>
          {/* Header bar */}
          <View style={[styles.xaiHeader, { backgroundColor: xaiInfo.color + '22' }]}>
            <View style={[styles.xaiIconCircle, { backgroundColor: xaiInfo.color + '33' }]}>
              <MaterialCommunityIcons name={xaiInfo.icon} size={26} color={xaiInfo.color} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.xaiTitle, { color: xaiInfo.color }]}>{xaiInfo.title}</Text>
              <Text style={styles.xaiStageLabel}>Why was it rejected?</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                Animated.timing(xaiSlide, {
                  toValue: 300, duration: 220, useNativeDriver: true,
                }).start(() => {
                  if (mountedRef.current) setXaiInfo(null);
                });
              }}
            >
              <Ionicons name="close-circle" size={22} color="#888" />
            </TouchableOpacity>
          </View>

          {/* Reason */}
          <View style={styles.xaiRow}>
            <Ionicons name="information-circle-outline" size={18} color="#aaa" style={{ marginTop: 1 }} />
            <Text style={styles.xaiReason}>{xaiInfo.reason}</Text>
          </View>

          {/* Fix tip */}
          <View style={[styles.xaiTipBox, { borderColor: xaiInfo.color + '55' }]}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={16} color={xaiInfo.color} />
            <Text style={[styles.xaiTip, { color: xaiInfo.color }]}>{xaiInfo.tip}</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000',
  },
  centerText: { color: '#aaa', marginTop: 12, fontSize: 14 },
  permTitle:  { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 20 },
  grantBtn:   { backgroundColor: '#A855F7', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 30 },
  grantBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Pet banner
  petBanner: {
    position: 'absolute',
    top: 58,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: '#A855F7',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 6,
  },
  petBannerText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  // Scanner frame
  scannerFrame: {
    width: width * 0.82,
    height: height * 0.44,
    borderRadius: 20,
    borderWidth: 2,
    overflow: 'hidden',
  },

  scanLine: {
    height: 3,
    width: '100%',
    shadowOpacity: 1,
    shadowRadius: 12,
  },

  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
  },
  topLeft:     { top: 0,    left:  0, borderLeftWidth: 4, borderTopWidth:    4 },
  topRight:    { top: 0,    right: 0, borderRightWidth: 4, borderTopWidth:   4 },
  bottomLeft:  { bottom: 0, left:  0, borderLeftWidth: 4, borderBottomWidth: 4 },
  bottomRight: { bottom: 0, right: 0, borderRightWidth: 4, borderBottomWidth: 4},

  detectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  scanningSpinner: {
    position: 'absolute',
    top: 10,
    right: 10,
  },

  // Status badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
  },
  statusText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Mode toggle
  modeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  modeOn:  { backgroundColor: 'rgba(168,85,247,0.25)', borderColor: '#A855F7' },
  modeOff: { backgroundColor: 'rgba(80,80,80,0.3)',    borderColor: '#888' },
  modeText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  // Back button
  backBtn: {
    position: 'absolute',
    top: 55,
    left: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },

  // Bottom controls
  bottomActions: {
    position: 'absolute',
    bottom: 90,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 60,
  },

  sideBtn: {
    alignItems: 'center',
    gap: 4,
  },
  sideBtnLabel: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 2,
  },

  flashBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  flashBtnActive: {
    backgroundColor: 'rgba(168,85,247,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.5)',
  },

  // ── XAI Panel ──────────────────────────────────────────────────────────────
  xaiPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1A1A2E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderColor: 'rgba(168,85,247,0.3)',
  },
  xaiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  xaiIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  xaiTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  xaiStageLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  xaiRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  xaiReason: {
    flex: 1,
    color: '#ccc',
    fontSize: 13,
    lineHeight: 19,
  },
  xaiTipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  xaiTip: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
});