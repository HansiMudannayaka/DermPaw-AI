import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';

import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import {
    CameraView,
    useCameraPermissions,
} from 'expo-camera';

import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';

import {
    Ionicons,
    MaterialCommunityIcons,
} from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

import {
    BACKEND_URL,
    ML_URL,
} from '../services/api';


const { width, height } = Dimensions.get('window');


// ============================================================
// API CONFIG
// ============================================================

const API_URL = ML_URL || 'http://192.168.1.6:5000';

const AUTO_SCAN_INTERVAL = 3500;


// ============================================================
// XAI INFORMATION
// ============================================================

const XAI_INFO = {
  quality_blur: {
    icon: 'camera-iris',
    color: '#A855F7',
    title: 'Photo is a bit blurry',
    reason:
      "We can't see the skin clearly because the camera was moving or out of focus.",
    tip:
      'Hold your phone steady and tap the screen to focus. Keep your dog calm for 2 seconds and retake.',
  },

  quality_exposure: {
    icon: 'weather-sunny-alert',
    color: '#A855F7',
    title: 'Check the lighting',
    reason:
      'The photo is too dark or has too much glare to see the skin details.',
    tip:
      'Turn on torch for dark spots, or avoid direct bright flash reflection.',
  },

  dog_detector: {
    icon: 'dog-side',
    color: '#A855F7',
    title: "Dog's skin not detected",
    reason:
      "DermPaw AI only analyzes dog skin issues. We couldn't recognize your dog in this photo.",
    tip:
      "Point the camera directly at your dog's affected skin area. Avoid other objects or animals.",
  },

  ood: {
    icon: 'magnify-scan',
    color: '#A855F7',
    title: 'Move a bit closer',
    reason:
      'The camera is too far to clearly see the skin rash or wound.',
    tip:
      'Bring the phone 15–30 cm closer and gently part the fur so the skin is visible.',
  },

  entropy: {
    icon: 'image-filter-center-focus-weak',
    color: '#A855F7',
    title: 'Need a clearer angle',
    reason:
      'The skin symptoms look mixed from this angle. A clearer photo is needed.',
    tip:
      'Take another photo from a different angle with good lighting and clear focus.',
  },

  confidence: {
    icon: 'help-rhombus-outline',
    color: '#A855F7',
    title: 'Need a clearer angle',
    reason:
      "We couldn't confirm the skin condition from this angle.",
    tip:
      'Try another photo with better lighting. If your pet is in pain, please consult a vet.',
  },

  server: {
    icon: 'server-off',
    color: '#A855F7',
    title: 'Connection Issue',
    reason:
      'Could not reach the AI analysis server.',
    tip:
      'Please check your Wi-Fi or mobile network connection and try again.',
  },
};


// ============================================================
// MAIN SCREEN
// ============================================================

export default function ScanScreen({
  navigation,
  route,
}) {
  const cameraRef = useRef(null);
  const intervalRef = useRef(null);
  const isScanningRef = useRef(false);
  const mountedRef = useRef(true);


  // ==========================================================
  // PET STATE
  // ==========================================================

  const [pets, setPets] = useState([]);

  const [
    selectedPetId,
    setSelectedPetId,
  ] = useState(
    route?.params?.petId || null
  );

  const [
    selectedPetName,
    setSelectedPetName,
  ] = useState(
    route?.params?.petName || null
  );

  const [
    selectedPetImage,
    setSelectedPetImage,
  ] = useState(null);

  const [
    petModalVisible,
    setPetModalVisible,
  ] = useState(false);

  const [
    isPetReady,
    setIsPetReady,
  ] = useState(false);


  // ==========================================================
  // CAMERA STATE
  // ==========================================================

  const [
    permission,
    requestPermission,
  ] = useCameraPermissions();

  const [
    torchEnabled,
    setTorchEnabled,
  ] = useState(false);

  const [
    autoMode,
    setAutoMode,
  ] = useState(true);

  const [
    scanState,
    setScanState,
  ] = useState('idle');

  const [
    statusMsg,
    setStatusMsg,
  ] = useState('Hold still…');

  const [
    dotCount,
    setDotCount,
  ] = useState(0);

  const [
    xaiInfo,
    setXaiInfo,
  ] = useState(null);


  // ==========================================================
  // ANIMATIONS
  // ==========================================================

  const scanAnim =
    useRef(
      new Animated.Value(0)
    ).current;

  const pulseAnim =
    useRef(
      new Animated.Value(1)
    ).current;

  const glowOpacity =
    useRef(
      new Animated.Value(0.25)
    ).current;

  const xaiSlide =
    useRef(
      new Animated.Value(300)
    ).current;


  // ==========================================================
  // CLEAR AUTO SCAN INTERVAL
  // ==========================================================

  const clearAutoScan =
    useCallback(() => {
      if (
        intervalRef.current
      ) {
        clearInterval(
          intervalRef.current
        );

        intervalRef.current =
          null;
      }
    }, []);


  // ==========================================================
  // CLEANUP
  // ==========================================================

  useEffect(() => {
    mountedRef.current =
      true;

    return () => {
      mountedRef.current =
        false;

      clearAutoScan();
    };
  }, [
    clearAutoScan,
  ]);


  // ==========================================================
  // FETCH OWNER PETS
  // ==========================================================

  useFocusEffect(
    useCallback(() => {
      let isCurrent =
        true;

      const fetchOwnerPets =
        async () => {
          try {
            const token =
              await AsyncStorage.getItem(
                'token'
              );

            console.log(
              'Pet API URL:',
              `${BACKEND_URL}/api/pets`
            );

            const res =
              await fetch(
                `${BACKEND_URL}/api/pets`,
                {
                  headers: {
                    Authorization:
                      `Bearer ${token}`,
                  },
                }
              );

            const responseText =
              await res.text();

            let data;

            try {
              data =
                responseText
                  ? JSON.parse(
                      responseText
                    )
                  : {};
            } catch (error) {
              console.error(
                'Pet API invalid JSON:',
                responseText
              );

              return;
            }

            if (
              !res.ok
            ) {
              console.error(
                'Pet API HTTP error:',
                res.status
              );

              console.error(
                'Pet API response:',
                data?.message ||
                  data
              );

              return;
            }

            if (
              !isCurrent ||
              !data.success
            ) {
              return;
            }

            const petList =
              data.pets || [];

            setPets(
              petList
            );


            // -----------------------------------------------
            // PET PASSED FROM ANOTHER SCREEN
            // -----------------------------------------------

            if (
              route?.params?.petId
            ) {
              const matched =
                petList.find(
                  (p) =>
                    p._id ===
                    route.params.petId
                );

              setSelectedPetId(
                route.params.petId
              );

              setSelectedPetName(
                route.params.petName ||
                  matched?.name ||
                  'Pet'
              );

              setSelectedPetImage(
                matched?.image ||
                  null
              );

              setIsPetReady(
                true
              );

              setPetModalVisible(
                false
              );

              return;
            }


            // -----------------------------------------------
            // REQUIRE PET SELECTION
            // -----------------------------------------------

            setIsPetReady(
              false
            );

            setPetModalVisible(
              true
            );
          } catch (error) {
            console.error(
              'Pet fetch error:',
              error?.message
            );
          }
        };

      fetchOwnerPets();

      return () => {
        isCurrent =
          false;
      };
    }, [
      route?.params?.petId,
      route?.params?.petName,
    ])
  );


  // ==========================================================
  // CAMERA PERMISSION
  // ==========================================================

  useEffect(() => {
    if (
      permission &&
      !permission.granted
    ) {
      requestPermission();
    }
  }, [
    permission,
    requestPermission,
  ]);


  // ==========================================================
  // SCAN LINE ANIMATION
  // ==========================================================

  useEffect(() => {
    const animation =
      Animated.loop(
        Animated.sequence([
          Animated.timing(
            scanAnim,
            {
              toValue: 1,
              duration: 1800,
              useNativeDriver: true,
            }
          ),

          Animated.timing(
            scanAnim,
            {
              toValue: 0,
              duration: 1800,
              useNativeDriver: true,
            }
          ),
        ])
      );

    animation.start();

    return () =>
      animation.stop();
  }, [
    scanAnim,
  ]);


  // ==========================================================
  // PULSE ANIMATION
  // ==========================================================

  useEffect(() => {
    const animation =
      Animated.loop(
        Animated.sequence([
          Animated.timing(
            pulseAnim,
            {
              toValue: 1.06,
              duration: 900,
              useNativeDriver: true,
            }
          ),

          Animated.timing(
            pulseAnim,
            {
              toValue: 1,
              duration: 900,
              useNativeDriver: true,
            }
          ),
        ])
      );

    animation.start();

    return () =>
      animation.stop();
  }, [
    pulseAnim,
  ]);


  // ==========================================================
  // GLOW
  // ==========================================================

  useEffect(() => {
    const target =
      scanState ===
      'scanning'
        ? 1
        : 0.25;

    Animated.timing(
      glowOpacity,
      {
        toValue:
          target,
        duration:
          400,
        useNativeDriver:
          true,
      }
    ).start();
  }, [
    scanState,
    glowOpacity,
  ]);


  // ==========================================================
  // STATUS DOTS
  // ==========================================================

  useEffect(() => {
    const timer =
      setInterval(() => {
        if (
          mountedRef.current
        ) {
          setDotCount(
            (previous) =>
              (previous + 1) %
              4
          );
        }
      }, 500);

    return () =>
      clearInterval(timer);
  }, []);


  const dots =
    '.'.repeat(dotCount);


  // ==========================================================
  // SHOW XAI PANEL
  // ==========================================================

  const showXai =
    useCallback(
      (
        key,
        shortMsg,
        customReason = null,
        customTitle = null,
        customInstructions = null
      ) => {
        if (
          !mountedRef.current
        ) {
          return;
        }

        const baseInfo =
          XAI_INFO[key] ||
          XAI_INFO.server;

        const info = {
          ...baseInfo,
          title:
            customTitle ||
            baseInfo.title,
          reason:
            customReason ||
            baseInfo.reason,
          instructions:
            customInstructions ||
            (baseInfo.tip
              ? [baseInfo.tip]
              : []),
        };

        setScanState(
          'error'
        );

        setStatusMsg(
          shortMsg
        );

        setXaiInfo(
          info
        );

        xaiSlide.setValue(
          300
        );

        Animated.spring(
          xaiSlide,
          {
            toValue: 0,
            useNativeDriver:
              true,
            tension: 70,
            friction: 12,
          }
        ).start();

        setTimeout(() => {
          if (
            !mountedRef.current
          ) {
            return;
          }

          Animated.timing(
            xaiSlide,
            {
              toValue:
                300,
              duration:
                250,
              useNativeDriver:
                true,
            }
          ).start(() => {
            if (
              mountedRef.current
            ) {
              setXaiInfo(
                null
              );

              setScanState(
                'idle'
              );

              setStatusMsg(
                'Hold still'
              );
            }
          });
        }, 6000);
      },
      [
        xaiSlide,
      ]
    );


  // ==========================================================
  // FLASK REQUEST
  // ==========================================================

  const sendImageToML =
    useCallback(
      async (
        imageUri,
        fileName =
          'image.jpg'
      ) => {
        const predictionUrl =
          `${API_URL}/predict`;

        try {
          console.log(
            '==================================='
          );

          console.log(
            'ML Prediction Request'
          );

          console.log(
            'URL:',
            predictionUrl
          );

          console.log(
            'Image URI:',
            imageUri
          );

          console.log(
            '==================================='
          );

          if (!imageUri) {
            throw new Error(
              'Image URI is missing.'
            );
          }

          console.log(
            'Checking local image file...'
          );

          const fileInfo =
            await FileSystem.getInfoAsync(
              imageUri
            );

          console.log(
            'File exists:',
            fileInfo.exists
          );

          console.log(
            'File size:',
            fileInfo.size ||
              'unknown'
          );

          if (!fileInfo.exists) {
            throw new Error(
              'Image file does not exist.'
            );
          }

          const lowerUri =
            imageUri.toLowerCase();

          let mimeType =
            'image/jpeg';

          if (
            lowerUri.endsWith('.png')
          ) {
            mimeType =
              'image/png';
          } else if (
            lowerUri.endsWith('.webp')
          ) {
            mimeType =
              'image/webp';
          }

          console.log(
            'Upload filename:',
            fileName
          );

          console.log(
            'Upload MIME:',
            mimeType
          );

          console.log(
            'Starting multipart upload...'
          );

          const uploadResult =
            await FileSystem.uploadAsync(
              predictionUrl,
              imageUri,
              {
                httpMethod:
                  'POST',

                uploadType:
                  FileSystem
                    .FileSystemUploadType
                    .MULTIPART,

                fieldName:
                  'image',

                mimeType,

                parameters: {
                  filename:
                    fileName,
                },
              }
            );

          console.log(
            'ML HTTP Status:',
            uploadResult.status
          );

          console.log(
            'ML response length:',
            uploadResult.body?.length ||
              0
          );

          let result = {};

          try {
            result =
              uploadResult.body
                ? JSON.parse(
                    uploadResult.body
                  )
                : {};
          } catch {
            result = {};
          }

          if (
            uploadResult.status < 200 ||
            uploadResult.status >= 300
          ) {
            console.warn(
              'ML Status Error:',
              uploadResult.status,
              result?.message || uploadResult.body
            );

            if (result?.status === 'rejected') {
              return result;
            }

            throw new Error(
              result?.message ||
                `ML server returned HTTP ${uploadResult.status}`
            );
          }

          console.log(
            'ML Status:',
            result?.status
          );

          console.log(
            'ML Disease:',
            result?.disease ||
              'none'
          );

          return result;
        } catch (error) {
          console.warn(
            'ML REQUEST ERROR:',
            error?.message,
            predictionUrl
          );

          throw error;
        }
      },
      []
    );


  // ==========================================================
  // FETCH GRAD-CAM HEATMAP
  // ==========================================================

  const fetchGradCam = useCallback(
    async (imageUri, classIndex) => {
      try {
        const gradcamUrl = `${API_URL}/gradcam`;

        const uploadResult = await FileSystem.uploadAsync(
          gradcamUrl,
          imageUri,
          {
            httpMethod: 'POST',
            uploadType: FileSystem.FileSystemUploadType.MULTIPART,
            fieldName: 'image',
            mimeType: 'image/jpeg',
            parameters: {
              class_index: String(classIndex ?? ''),
            },
          }
        );

        if (uploadResult.status === 200) {
          const gcRes = JSON.parse(uploadResult.body || '{}');
          if (gcRes.status === 'success' && gcRes.gradcam_image) {
            return gcRes.gradcam_image;
          }
        }
        return null;
      } catch (err) {
        console.warn('Grad-CAM fetch error:', err?.message);
        return null;
      }
    },
    []
  );


  // ==========================================================
  // HANDLE AI RESULT
  // ==========================================================

  const handleRejectedResult =
    useCallback(
      (
        result,
        galleryMode =
          false
      ) => {
        let key =
          'quality_exposure';

        if (
          result.stage ===
            'dog_detector' ||
          result.reason ===
            'dog_skin_photo_required'
        ) {
          key =
            'dog_detector';
        } else if (
          result.reason
            ?.toLowerCase()
            .includes(
              'blur'
            ) ||
          result.reason ===
            'blurred_image'
        ) {
          key =
            'quality_blur';
        } else if (
          result.reason ===
            'too_dark' ||
          result.reason ===
            'too_bright'
        ) {
          key =
            'quality_exposure';
        } else if (
          result.stage ===
            'entropy' ||
          result.reason ===
            'ambiguous_categories'
        ) {
          key =
            'entropy';
        } else if (
          result.status ===
            'retake' ||
          result.reason ===
            'low_confidence'
        ) {
          key =
            'confidence';
        } else if (
          result.status ===
            'unknown' ||
          result.reason ===
            'image_not_suitable'
        ) {
          key =
            'ood';
        } else if (
          result.status ===
          'error'
        ) {
          key =
            'server';
        }

        const defaultInfo =
          XAI_INFO[key] ||
          XAI_INFO.server;

        const title =
          result.title ||
          defaultInfo.title;

        const message =
          result.message ||
          result.reason ||
          defaultInfo.reason;

        const instructions =
          Array.isArray(
            result.instructions
          ) &&
          result.instructions.length > 0
            ? result.instructions
            : result.tip
              ? [result.tip]
              : defaultInfo.tip
                ? [defaultInfo.tip]
                : [];

        if (
          galleryMode
        ) {
          let alertBody =
            message;

          if (
            instructions.length > 0
          ) {
            alertBody +=
              '\n\nSuggestions to fix:\n' +
              instructions
                .map(
                  (
                    inst
                  ) =>
                    `• ${inst}`
                )
                .join(
                  '\n'
                );
          }

          Alert.alert(
            `⚠️ ${title}`,
            alertBody,
            [
              {
                text:
                  'Try Again',
                style:
                  'default',
              },
            ]
          );

          return;
        }

        showXai(
          key,
          title,
          message,
          title,
          instructions
        );
      },
      [
        showXai,
      ]
    );


  // ==========================================================
  // CAMERA SCAN
  // ==========================================================

  const runScan =
    useCallback(
      async () => {
        if (
          !cameraRef.current ||
          isScanningRef.current ||
          !mountedRef.current ||
          !isPetReady ||
          !selectedPetId
        ) {
          return;
        }


        isScanningRef.current =
          true;


        try {
          setScanState(
            'scanning'
          );

          setStatusMsg(
            'Analyzing skin'
          );


          const data =
            await cameraRef.current
              .takePictureAsync({
                quality:
                  0.6,

                skipProcessing:
                  false,

                base64:
                  true,
              });


          if (
            !data?.uri
          ) {
            throw new Error(
              'Camera image URI was not created.'
            );
          }


          if (
            !mountedRef.current
          ) {
            return;
          }


          const base64Image =
            data.base64
              ? `data:image/jpeg;base64,${data.base64}`
              : data.uri;


          const result =
            await sendImageToML(
              data.uri,
              'frame.jpg'
            );


          if (
            !mountedRef.current
          ) {
            return;
          }


          // ==============================================
          // SUCCESS
          // ==============================================

          if (
            result.status ===
            'predicted'
          ) {
            clearAutoScan();

            setScanState(
              'detected'
            );

            setStatusMsg(
              'Detected!'
            );

            setXaiInfo(
              null
            );


            // Use Grad-CAM from predict response or fetch if missing
            const classIndex =
              typeof result.class_index === 'number'
                ? result.class_index
                : typeof result.classIndex === 'number'
                  ? result.classIndex
                  : undefined;

            const gradcamImage =
              result.gradcam_image ||
              (await fetchGradCam(
                data.uri,
                classIndex
              ));

            const resultWithGradcam = {
              ...result,
              gradcam_image: gradcamImage || '',
            };

            if (mountedRef.current) {
              navigation.navigate(
                'Results',
                {
                  photo:
                    data.uri,

                  base64Image,

                  result: resultWithGradcam,

                  petId:
                    selectedPetId,

                  petName:
                    selectedPetName,
                }
              );
            }

            return;
          }


          handleRejectedResult(
            result,
            false
          );
        } catch (error) {
          console.warn(
            'CAMERA SCAN ERROR:',
            error?.message,
            API_URL
          );

          if (
            mountedRef.current
          ) {
            showXai(
              'server',
              'Analysis failed',
              error?.message ||
                'The AI analysis could not be completed.'
            );
          }
        } finally {
          isScanningRef.current =
            false;
        }
      },
      [
        navigation,
        selectedPetId,
        selectedPetName,
        isPetReady,
        sendImageToML,
        fetchGradCam,
        handleRejectedResult,
        showXai,
        clearAutoScan,
      ]
    );


  // ==========================================================
  // AUTO SCAN
  // ==========================================================

  useEffect(() => {
    clearAutoScan();


    if (
      !permission?.granted ||
      !isPetReady ||
      !selectedPetId
    ) {
      return;
    }


    if (
      autoMode
    ) {
      intervalRef.current =
        setInterval(
          runScan,
          AUTO_SCAN_INTERVAL
        );
    } else {
      setScanState(
        'idle'
      );

      setStatusMsg(
        'Manual mode'
      );
    }


    return () => {
      clearAutoScan();
    };
  }, [
    autoMode,
    permission?.granted,
    isPetReady,
    selectedPetId,
    runScan,
    clearAutoScan,
  ]);


  // ==========================================================
  // MANUAL CAPTURE
  // ==========================================================

  const manualCapture =
    async () => {
      if (
        !selectedPetId
      ) {
        setPetModalVisible(
          true
        );

        return;
      }


      clearAutoScan();

      await runScan();


      if (
        autoMode &&
        isPetReady &&
        mountedRef.current
      ) {
        intervalRef.current =
          setInterval(
            runScan,
            AUTO_SCAN_INTERVAL
          );
      }
    };


  // ==========================================================
  // GALLERY
  // ==========================================================

  const openGallery =
    async () => {
      if (
        !selectedPetId
      ) {
        setPetModalVisible(
          true
        );

        return;
      }


      clearAutoScan();


      try {
        const {
          status,
        } =
          await ImagePicker
            .requestMediaLibraryPermissionsAsync();


        if (
          status !==
          'granted'
        ) {
          Alert.alert(
            'Permission Needed',
            'Please allow access to your photo library.'
          );

          return;
        }


        const picked =
          await ImagePicker
            .launchImageLibraryAsync({
              // Expo SDK 57
              mediaTypes:
                ['images'],

              allowsEditing:
                true,

              aspect:
                [1, 1],

              quality:
                0.7,

              base64:
                true,
            });


        if (
          picked.canceled ||
          !picked.assets?.length
        ) {
          return;
        }


        const asset =
          picked.assets[0];

        const uri =
          asset.uri;


        if (
          !uri
        ) {
          throw new Error(
            'Selected image URI is missing.'
          );
        }


        const base64Image =
          asset.base64
            ? `data:image/jpeg;base64,${asset.base64}`
            : uri;


        setScanState(
          'scanning'
        );

        setStatusMsg(
          'Analyzing image'
        );


        console.log(
          'Gallery image URI:',
          uri
        );


        const result =
          await sendImageToML(
            uri,
            'gallery.jpg'
          );


        // ==============================================
        // SUCCESS
        // ==============================================

        if (
          result.status ===
          'predicted'
        ) {
          setScanState(
            'detected'
          );

          setStatusMsg(
            'Detected!'
          );

          // Fetch Grad-CAM heatmap for gallery image
          const classIndex =
            typeof result.class_index === 'number'
              ? result.class_index
              : typeof result.classIndex === 'number'
                ? result.classIndex
                : undefined;

          const gradcamImage =
            result.gradcam_image ||
            (await fetchGradCam(uri, classIndex));

          const resultWithGradcam = {
            ...result,
            gradcam_image: gradcamImage || '',
          };

          navigation.navigate(
            'Results',
            {
              photo:
                uri,

              base64Image,

              result: resultWithGradcam,

              petId:
                selectedPetId,

              petName:
                selectedPetName,
            }
          );

          return;
        }


        handleRejectedResult(
          result,
          true
        );


        setScanState(
          'idle'
        );

        setStatusMsg(
          'Hold still'
        );
      } catch (error) {
        console.error(
          '========== GALLERY ERROR =========='
        );

        console.error(
          'Error message:',
          error?.message
        );

        console.error(
          'ML URL:',
          API_URL
        );

        console.error(
          '==================================='
        );


        Alert.alert(
          'Prediction Error',
          error?.message ||
            'Cannot complete AI prediction.'
        );


        setScanState(
          'idle'
        );

        setStatusMsg(
          'Hold still'
        );
      } finally {
        if (
          autoMode &&
          isPetReady &&
          selectedPetId &&
          mountedRef.current
        ) {
          clearAutoScan();

          intervalRef.current =
            setInterval(
              runScan,
              AUTO_SCAN_INTERVAL
            );
        }
      }
    };


  // ==========================================================
  // SCANNER ANIMATION
  // ==========================================================

  const translateY =
    scanAnim.interpolate({
      inputRange:
        [0, 1],

      outputRange:
        [
          0,
          height * 0.40,
        ],
    });


  const frameColor =
    {
      idle:
        'rgba(168,85,247,0.45)',

      scanning:
        'rgba(192,132,252,0.95)',

      detected:
        '#4CAF50',

      error:
        '#FF5252',
    }[scanState] ||
    'rgba(168,85,247,0.45)';


  const cornerColor =
    {
      idle:
        '#A855F7',

      scanning:
        '#C084FC',

      detected:
        '#4CAF50',

      error:
        '#FF5252',
    }[scanState] ||
    '#A855F7';


  const badgeBg =
    {
      idle:
        'rgba(26,11,46,0.85)',

      scanning:
        'rgba(88,28,135,0.9)',

      detected:
        'rgba(20,83,45,0.9)',

      error:
        'rgba(153,27,27,0.9)',
    }[scanState] ||
    'rgba(26,11,46,0.85)';


  // ==========================================================
  // PERMISSION LOADING
  // ==========================================================

  if (
    !permission
  ) {
    return (
      <View
        style={
          styles.center
        }
      >
        <ActivityIndicator
          color="#A855F7"
          size="large"
        />

        <Text
          style={
            styles.centerText
          }
        >
          Requesting camera…
        </Text>
      </View>
    );
  }


  // ==========================================================
  // PERMISSION DENIED
  // ==========================================================

  if (
    !permission.granted
  ) {
    return (
      <View
        style={
          styles.center
        }
      >
        <Ionicons
          name="camera-outline"
          size={60}
          color="#A855F7"
        />

        <Text
          style={
            styles.permTitle
          }
        >
          Camera Access Required
        </Text>

        <TouchableOpacity
          style={
            styles.grantBtn
          }
          onPress={
            requestPermission
          }
        >
          <Text
            style={
              styles.grantBtnText
            }
          >
            Allow Camera
          </Text>
        </TouchableOpacity>
      </View>
    );
  }


  // ==========================================================
  // UI
  // ==========================================================

  return (
    <View
      style={
        styles.container
      }
    >

      {/* LIVE CAMERA */}

      <CameraView
        ref={cameraRef}
        style={
          StyleSheet.absoluteFill
        }
        facing="back"
        enableTorch={
          torchEnabled
        }
      />


      {/* =====================================================
          PET MODAL
      ===================================================== */}

      <Modal
        visible={
          petModalVisible
        }
        animationType="slide"
        transparent
        onRequestClose={() => {
          if (
            selectedPetId
          ) {
            setPetModalVisible(
              false
            );

            setIsPetReady(
              true
            );
          } else {
            navigation.goBack();
          }
        }}
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.modalCard
            }
          >

            <View
              style={
                styles.modalHeader
              }
            >
              <View
                style={{
                  flex: 1,
                }}
              >
                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  🐾 Select Pet to Scan
                </Text>

                <Text
                  style={
                    styles.modalSubtitle
                  }
                >
                  {
                    pets.length > 0
                      ? 'Choose which pet you want AI to scan today'
                      : 'No pet profile found. Please add a profile first.'
                  }
                </Text>
              </View>


              {
                selectedPetId &&
                (
                  <TouchableOpacity
                    onPress={() => {
                      setPetModalVisible(
                        false
                      );

                      setIsPetReady(
                        true
                      );
                    }}
                    style={
                      styles.modalCloseBtn
                    }
                  >
                    <Ionicons
                      name="close"
                      size={20}
                      color="#fff"
                    />
                  </TouchableOpacity>
                )
              }
            </View>


            {
              pets.length > 0
                ? (
                  <ScrollView
                    style={{
                      maxHeight:
                        280,
                    }}
                    showsVerticalScrollIndicator={
                      false
                    }
                  >
                    {
                      pets.map(
                        (pet) => {
                          const isSelected =
                            selectedPetId ===
                            pet._id;


                          const petImg =
                            pet.image &&
                            (
                              pet.image.startsWith(
                                'http'
                              ) ||
                              pet.image.startsWith(
                                'data:'
                              )
                            )
                              ? {
                                  uri:
                                    pet.image,
                                }
                              : require(
                                  '../../../assets/images/dog1.png'
                                );


                          return (
                            <TouchableOpacity
                              key={
                                pet._id
                              }
                              style={[
                                styles.petSelectRow,
                                isSelected &&
                                  styles.petSelectRowActive,
                              ]}
                              onPress={() => {
                                setSelectedPetId(
                                  pet._id
                                );

                                setSelectedPetName(
                                  pet.name
                                );

                                setSelectedPetImage(
                                  pet.image ||
                                    null
                                );

                                setIsPetReady(
                                  true
                                );

                                setPetModalVisible(
                                  false
                                );
                              }}
                              activeOpacity={
                                0.8
                              }
                            >
                              <Image
                                source={
                                  petImg
                                }
                                style={
                                  styles.petSelectImg
                                }
                              />

                              <View
                                style={{
                                  flex: 1,
                                }}
                              >
                                <Text
                                  style={
                                    styles.petSelectName
                                  }
                                >
                                  {pet.name}
                                </Text>

                                <Text
                                  style={
                                    styles.petSelectInfo
                                  }
                                >
                                  {pet.color || 'Dog'} • {pet.age || '?'} • {pet.gender || ''}
                                </Text>
                              </View>


                              {
                                isSelected
                                  ? (
                                    <Ionicons
                                      name="checkmark-circle"
                                      size={24}
                                      color="#A855F7"
                                    />
                                  )
                                  : (
                                    <Ionicons
                                      name="ellipse-outline"
                                      size={22}
                                      color="#666"
                                    />
                                  )
                              }
                            </TouchableOpacity>
                          );
                        }
                      )
                    }
                  </ScrollView>
                )
                : (
                  <View
                    style={{
                      alignItems:
                        'center',
                      paddingVertical:
                        20,
                    }}
                  >
                    <Ionicons
                      name="paw"
                      size={48}
                      color="rgba(168,85,247,0.5)"
                      style={{
                        marginBottom:
                          10,
                      }}
                    />

                    <Text
                      style={{
                        color:
                          '#fff',
                        fontSize:
                          16,
                        fontWeight:
                          'bold',
                      }}
                    >
                      No Pets Registered
                    </Text>

                    <Text
                      style={{
                        color:
                          '#aaa',
                        fontSize:
                          13,
                        textAlign:
                          'center',
                        marginTop:
                          4,
                        paddingHorizontal:
                          20,
                      }}
                    >
                      You need to create a pet profile first before using the AI Skin Scanner.
                    </Text>
                  </View>
                )
            }


            <TouchableOpacity
              style={
                styles.addPetModalBtn
              }
              onPress={() => {
                setPetModalVisible(
                  false
                );

                navigation.navigate(
                  'PetProfile'
                );
              }}
              activeOpacity={
                0.8
              }
            >
              <Ionicons
                name="add-circle-outline"
                size={20}
                color="#A855F7"
              />

              <Text
                style={
                  styles.addPetModalBtnText
                }
              >
                {
                  pets.length === 0
                    ? 'Create Pet Profile'
                    : 'Add New Pet Profile'
                }
              </Text>
            </TouchableOpacity>


            {
              !selectedPetId &&
                (
                  <TouchableOpacity
                    style={{
                      alignItems:
                        'center',
                      marginTop:
                        12,
                      paddingVertical:
                        8,
                    }}
                    onPress={() =>
                      navigation.goBack()
                    }
                  >
                    <Text
                      style={{
                        color:
                          '#888',
                        fontSize:
                          14,
                      }}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                )
            }
          </View>
        </View>
      </Modal>


      {/* DARK OVERLAY */}

      <View
        style={
          styles.vignette
        }
      />


      {/* TOP HEADER BAR */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color="white"
          />
        </TouchableOpacity>

        {
          selectedPetName ? (
            <TouchableOpacity
              style={styles.petBanner}
              onPress={() => {
                if (pets.length > 1) {
                  setPetModalVisible(true);
                }
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="paw"
                size={14}
                color="#A855F7"
              />
              <Text style={styles.petBannerText}>
                Scanning: {selectedPetName}
              </Text>
              {pets.length > 1 && (
                <Ionicons
                  name="chevron-down"
                  size={14}
                  color="#A855F7"
                  style={{ marginLeft: 3 }}
                />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.petBanner,
                {
                  backgroundColor: 'rgba(239,68,68,0.25)',
                  borderColor: 'rgba(239,68,68,0.6)',
                },
              ]}
              onPress={() => setPetModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="paw-outline"
                size={14}
                color="#FF6B6B"
              />
              <Text
                style={[
                  styles.petBannerText,
                  { color: '#FF6B6B' },
                ]}
              >
                Select Pet 🐾
              </Text>
            </TouchableOpacity>
          )
        }

        <TouchableOpacity
          style={[
            styles.headerBtn,
            torchEnabled && styles.headerBtnActive,
          ]}
          onPress={() => setTorchEnabled((previous) => !previous)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={torchEnabled ? 'flash' : 'flash-off'}
            size={20}
            color={torchEnabled ? '#A855F7' : 'white'}
          />
        </TouchableOpacity>
      </View>


      {/* MAIN SCANNER OVERLAY */}
      <View style={styles.overlay}>
        {/* SCANNER FRAME */}
        <Animated.View
          style={[
            styles.scannerFrame,
            {
              transform: [
                {
                  scale: pulseAnim,
                },
              ],
              borderColor: frameColor,
            },
          ]}
        >
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: frameColor,
                opacity: glowOpacity,
                borderRadius: 20,
              },
            ]}
          />

          <View style={[styles.corner, styles.topLeft, { borderColor: cornerColor }]} />
          <View style={[styles.corner, styles.topRight, { borderColor: cornerColor }]} />
          <View style={[styles.corner, styles.bottomLeft, { borderColor: cornerColor }]} />
          <View style={[styles.corner, styles.bottomRight, { borderColor: cornerColor }]} />

          {(scanState === 'idle' || scanState === 'scanning') && (
            <Animated.View
              style={[
                styles.scanLine,
                {
                  backgroundColor: cornerColor,
                  transform: [
                    {
                      translateY,
                    },
                  ],
                },
              ]}
            />
          )}

          {scanState === 'detected' && (
            <View style={styles.detectedOverlay}>
              <Ionicons
                name="checkmark-circle"
                size={70}
                color="#4CAF50"
              />
            </View>
          )}

          {scanState === 'scanning' && (
            <View style={styles.scanningSpinner}>
              <ActivityIndicator
                size="small"
                color="#A855F7"
              />
            </View>
          )}
        </Animated.View>

        {/* STATUS BADGE */}
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: badgeBg,
            },
          ]}
        >
          {scanState === 'scanning' && (
            <ActivityIndicator
              size={12}
              color="#fff"
              style={{ marginRight: 6 }}
            />
          )}

          <Text style={styles.statusText}>
            {statusMsg}
            {(scanState === 'scanning' || scanState === 'idle') ? dots : ''}
          </Text>
        </View>

        {/* AUTO SCAN TOGGLE */}
        <TouchableOpacity
          style={[
            styles.modeToggle,
            autoMode ? styles.modeOn : styles.modeOff,
          ]}
          onPress={() => setAutoMode((previous) => !previous)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={autoMode ? 'radio-button-on' : 'radio-button-off'}
            size={14}
            color="#fff"
            style={{ marginRight: 5 }}
          />

          <Text style={styles.modeText}>
            {autoMode ? 'Auto-Scan ON' : 'Auto-Scan OFF'}
          </Text>
        </TouchableOpacity>
      </View>


      {/* =====================================================
          XAI PANEL
      ===================================================== */}

      {
        xaiInfo &&
          (
            <Animated.View
              style={[
                styles.xaiPanel,
                {
                  transform: [
                    {
                      translateY:
                        xaiSlide,
                    },
                  ],
                },
              ]}
            >
              <View
                style={[
                  styles.xaiHeader,
                  {
                    backgroundColor:
                      `${xaiInfo.color}22`,
                  },
                ]}
              >
                <View
                  style={[
                    styles.xaiIconCircle,
                    {
                      backgroundColor:
                        `${xaiInfo.color}33`,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={
                      xaiInfo.icon
                    }
                    size={26}
                    color={
                      xaiInfo.color
                    }
                  />
                </View>


                <View
                  style={{
                    flex: 1,
                    marginLeft:
                      12,
                  }}
                >
                  <Text
                    style={[
                      styles.xaiTitle,
                      {
                        color:
                          xaiInfo.color,
                      },
                    ]}
                  >
                    ⚠️ {xaiInfo.title}
                  </Text>

                  <Text
                    style={
                      styles.xaiStageLabel
                    }
                  >
                    Why was it rejected?
                  </Text>
                </View>


                <TouchableOpacity
                  onPress={() => {
                    Animated.timing(
                      xaiSlide,
                      {
                        toValue:
                          300,
                        duration:
                          220,
                        useNativeDriver:
                          true,
                      }
                    ).start(() => {
                      if (
                        mountedRef.current
                      ) {
                        setXaiInfo(
                          null
                        );
                      }
                    });
                  }}
                >
                  <Ionicons
                    name="close-circle"
                    size={22}
                    color="#888"
                  />
                </TouchableOpacity>
              </View>


              <View
                style={
                  styles.xaiRow
                }
              >
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color="#aaa"
                  style={{
                    marginTop:
                      1,
                  }}
                />

                <Text
                  style={
                    styles.xaiReason
                  }
                >
                  {xaiInfo.reason}
                </Text>
              </View>


              {
                ((xaiInfo.instructions && xaiInfo.instructions.length > 0) || xaiInfo.tip) &&
                (
                  <View
                    style={[
                      styles.xaiTipBox,
                      {
                        borderColor:
                          `${xaiInfo.color}55`,
                      },
                    ]}
                  >
                    <View
                      style={{
                        flexDirection:
                          'row',
                        alignItems:
                          'center',
                        marginBottom:
                          6,
                      }}
                    >
                      <MaterialCommunityIcons
                        name="lightbulb-on-outline"
                        size={16}
                        color={
                          xaiInfo.color
                        }
                      />

                      <Text
                        style={[
                          styles.xaiTip,
                          {
                            color:
                              xaiInfo.color,
                            fontWeight:
                              '700',
                            marginLeft:
                              6,
                          },
                        ]}
                      >
                        Suggestions to fix:
                      </Text>
                    </View>

                    {
                      xaiInfo.instructions && xaiInfo.instructions.length > 0
                        ? xaiInfo.instructions.map((item, idx) => (
                            <Text
                              key={idx}
                              style={[
                                styles.xaiTip,
                                {
                                  color:
                                    xaiInfo.color,
                                  marginTop:
                                    3,
                                },
                              ]}
                            >
                              • {item}
                            </Text>
                          ))
                        : (
                            <Text
                              style={[
                                styles.xaiTip,
                                {
                                  color:
                                    xaiInfo.color,
                                },
                              ]}
                            >
                              • {xaiInfo.tip}
                            </Text>
                          )
                    }
                  </View>
                )
              }
            </Animated.View>
          )
      }
    </View>
  );
}


// ============================================================
// STYLES
// ============================================================

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        '#000',
    },

    center: {
      flex: 1,
      justifyContent:
        'center',
      alignItems:
        'center',
      backgroundColor:
        '#000',
    },

    centerText: {
      color:
        '#aaa',
      marginTop:
        12,
      fontSize:
        14,
    },

    permTitle: {
      color:
        '#fff',
      fontSize:
        18,
      fontWeight:
        '700',
      marginTop:
        16,
      marginBottom:
        20,
    },

    grantBtn: {
      backgroundColor:
        '#A855F7',
      paddingHorizontal:
        32,
      paddingVertical:
        14,
      borderRadius:
        30,
    },

    grantBtnText: {
      color:
        '#fff',
      fontWeight:
        '700',
      fontSize:
        15,
    },


    vignette: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        'rgba(0,0,0,0.45)',
    },

    topHeader: {
      position: 'absolute',
      top: 52,
      left: 16,
      right: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 20,
    },

    headerBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: 'rgba(30, 14, 56, 0.85)',
      borderWidth: 1,
      borderColor: 'rgba(168, 85, 247, 0.35)',
      justifyContent: 'center',
      alignItems: 'center',
    },

    headerBtnActive: {
      backgroundColor: 'rgba(168, 85, 247, 0.35)',
      borderColor: '#A855F7',
    },

    petBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(30, 14, 56, 0.88)',
      borderWidth: 1.5,
      borderColor: '#A855F7',
      borderRadius: 22,
      paddingHorizontal: 16,
      paddingVertical: 8,
      gap: 6,
      shadowColor: '#A855F7',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
    },

    petBannerText: {
      color: '#F3E8FF',
      fontWeight: '600',
      fontSize: 14,
    },

    overlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 45,
    },

    scannerFrame: {
      width: width * 0.82,
      height: height * 0.42,
      borderRadius: 24,
      borderWidth: 2,
      overflow: 'hidden',
    },

    scanLine: {
      height: 3,
      width: '100%',
      shadowOpacity: 1,
      shadowRadius: 14,
    },

    corner: {
      position: 'absolute',
      width: 28,
      height: 28,
    },

    topLeft: {
      top: 0,
      left: 0,
      borderLeftWidth: 4,
      borderTopWidth: 4,
    },

    topRight: {
      top: 0,
      right: 0,
      borderRightWidth: 4,
      borderTopWidth: 4,
    },

    bottomLeft: {
      bottom: 0,
      left: 0,
      borderLeftWidth: 4,
      borderBottomWidth: 4,
    },

    bottomRight: {
      bottom: 0,
      right: 0,
      borderRightWidth: 4,
      borderBottomWidth: 4,
    },

    detectedOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(20, 10, 40, 0.45)',
    },

    scanningSpinner: {
      position: 'absolute',
      top: 10,
      right: 10,
    },

    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 20,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 30,
      borderWidth: 1,
      borderColor: 'rgba(168, 85, 247, 0.35)',
    },

    statusText: {
      color: '#F3E8FF',
      fontSize: 15,
      fontWeight: '600',
      letterSpacing: 0.5,
    },

    modeToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
    },

    modeOn: {
      backgroundColor: 'rgba(147, 51, 234, 0.28)',
      borderColor: '#A855F7',
    },

    modeOff: {
      backgroundColor: 'rgba(30, 14, 56, 0.7)',
      borderColor: 'rgba(168, 85, 247, 0.25)',
    },

    modeText: {
      color: '#E9D5FF',
      fontSize: 13,
      fontWeight: '600',
    },

    xaiPanel: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#140826',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 30,
      borderTopWidth: 1.5,
      borderColor: 'rgba(168, 85, 247, 0.4)',
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
      color: '#C084FC',
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
      color: '#E9D5FF',
      fontSize: 13,
      lineHeight: 19,
    },

    xaiTipBox: {
      alignItems: 'flex-start',
      backgroundColor: 'rgba(168, 85, 247, 0.12)',
      borderWidth: 1,
      borderRadius: 12,
      padding: 12,
    },

    xaiTip: {
      fontSize: 13,
      lineHeight: 19,
      fontWeight: '600',
    },

    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(10, 3, 20, 0.75)',
      justifyContent: 'flex-end',
    },

    modalCard: {
      backgroundColor: '#16082B',
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 24,
      paddingBottom: 36,
      borderTopWidth: 1.5,
      borderColor: 'rgba(168, 85, 247, 0.35)',
    },

    modalHeader: {
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'center',
      marginBottom:
        18,
    },

    modalTitle: {
      color:
        '#fff',
      fontSize:
        19,
      fontWeight:
        'bold',
    },

    modalSubtitle: {
      color:
        '#aaa',
      fontSize:
        13,
      marginTop:
        3,
    },

    modalCloseBtn: {
      backgroundColor:
        'rgba(255,255,255,0.1)',
      borderRadius:
        16,
      padding:
        6,
    },

    petSelectRow: {
      flexDirection:
        'row',
      alignItems:
        'center',
      backgroundColor:
        'rgba(255,255,255,0.06)',
      borderRadius:
        16,
      padding:
        12,
      marginBottom:
        10,
      gap:
        12,
      borderWidth:
        1,
      borderColor:
        'transparent',
    },

    petSelectRowActive: {
      backgroundColor:
        'rgba(168,85,247,0.15)',
      borderColor:
        '#A855F7',
    },

    petSelectImg: {
      width:
        50,
      height:
        50,
      borderRadius:
        25,
      backgroundColor:
        '#2D1B4E',
    },

    petSelectName: {
      color:
        '#fff',
      fontSize:
        16,
      fontWeight:
        '700',
    },

    petSelectInfo: {
      color:
        '#aaa',
      fontSize:
        12,
      marginTop:
        2,
    },

    addPetModalBtn: {
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'center',
      gap:
        8,
      borderWidth:
        1.5,
      borderColor:
        '#A855F7',
      borderRadius:
        16,
      padding:
        14,
      marginTop:
        8,
      backgroundColor:
        'rgba(168,85,247,0.08)',
    },

    addPetModalBtnText: {
      color:
        '#A855F7',
      fontWeight:
        '700',
      fontSize:
        14,
    },
  });