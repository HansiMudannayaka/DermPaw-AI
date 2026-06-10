import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';

import { CameraView, useCameraPermissions, FlashMode } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function ScanScreen() {
  const cameraRef = useRef(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState('off');
  const [galleryImage, setGalleryImage] = useState(null);

  const scanAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // CAMERA PERMISSION
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  // SCAN ANIMATION
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // PULSE ANIMATION
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, height * 0.42],
  });

  // OPEN GALLERY
  const openGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setGalleryImage(result.assets[0].uri);
    }
  };

  // TOGGLE FLASH
  const toggleFlash = () => {
    setFlash((prev) => (prev === 'off' ? 'on' : 'off'));
  };

  // CAMERA NOT READY
  if (!permission) {
    return <View style={styles.center}><Text>Requesting permission...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ color: 'white' }}>No camera permission</Text>
        <TouchableOpacity onPress={requestPermission}>
          <Text style={{ color: 'purple', marginTop: 10 }}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* REAL CAMERA */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        flash={flash}
      />

      {/* SHOW SELECTED IMAGE FROM GALLERY */}
      {galleryImage && (
        <Image source={{ uri: galleryImage }} style={styles.previewImage} />
      )}

      {/* OVERLAY */}
      <View style={styles.overlay}>

        {/* DARK EFFECT */}
        <View style={styles.vignette} />

        {/* SCANNER FRAME */}
        <Animated.View
          style={[
            styles.scannerFrame,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          <Animated.View
            style={[
              styles.scanLine,
              { transform: [{ translateY }] },
            ]}
          />
        </Animated.View>

        {/* TEXT */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>POINT AT YOUR PET</Text>
          <Text style={styles.subStatus}>AI Detection Active...</Text>
        </View>
      </View>

      {/* CONTROLS */}
      <View style={styles.bottomActions}>

        {/* GALLERY */}
        <TouchableOpacity onPress={openGallery}>
          <MaterialCommunityIcons name="image-multiple" size={30} color="white" />
        </TouchableOpacity>

        {/* SHUTTER */}
        <TouchableOpacity style={styles.shutterBtn}>
          <View style={styles.shutterInner} />
        </TouchableOpacity>

        {/* FLASH */}
        <TouchableOpacity onPress={toggleFlash}>
          <MaterialCommunityIcons
            name={flash === 'on' ? 'flash' : 'flash-off'}
            size={30}
            color="white"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },

  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },

  scannerFrame: {
    width: width * 0.78,
    height: height * 0.42,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.25)',
    overflow: 'hidden',
  },

  scanLine: {
    height: 4,
    width: '100%',
    backgroundColor: '#A855F7',
    shadowColor: '#A855F7',
    shadowOpacity: 1,
    shadowRadius: 15,
  },

  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#A855F7',
  },

  topLeft: { top: 0, left: 0, borderLeftWidth: 4, borderTopWidth: 4 },
  topRight: { top: 0, right: 0, borderRightWidth: 4, borderTopWidth: 4 },
  bottomLeft: { bottom: 0, left: 0, borderLeftWidth: 4, borderBottomWidth: 4 },
  bottomRight: { bottom: 0, right: 0, borderRightWidth: 4, borderBottomWidth: 4 },

  statusContainer: {
    marginTop: 40,
    alignItems: 'center',
  },

  statusText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
  },

  subStatus: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 8,
  },

  bottomActions: {
    position: 'absolute',
    bottom: 100,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },

  shutterBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },

  previewImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
  },
});