import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing, Image } from "react-native";
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
} from "react-native-svg";

const Logo = () => {
  // Animation values for standard Animated API
  const rotateAnim1 = useRef(new Animated.Value(0)).current;
  const rotateAnim2 = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Infinite loops for rotation and scaling

    // Blob 1 Rotation (Clockwise)
    Animated.loop(
      Animated.timing(rotateAnim1, {
        toValue: 1,
        duration: 10000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Blob 2 Rotation (Counter-Clockwise)
    Animated.loop(
      Animated.timing(rotateAnim2, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Breathing Scale Effect (Made slightly more pronounced for "bigger" feel)
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.15,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Interpolate rotation values
  const rotate1 = rotateAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const rotate2 = rotateAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: ["360deg", "0deg"],
  });

  return (
    <View style={styles.container}>
      {/* Liquid Blob Container */}
      <View style={styles.blobContainer}>
        {/* Blob 1 - Main Body */}
        <Animated.View
          style={[
            styles.absoluteBlob,
            {
              transform: [{ rotate: rotate1 }, { scale: scaleAnim }],
            },
          ]}
        >
          <Svg width={350} height={350} viewBox="0 0 200 200">
            <Defs>
              <LinearGradient id="grad1" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#00FFFF" stopOpacity="0.9" />
                <Stop offset="1" stopColor="#FF00FF" stopOpacity="0.9" />
              </LinearGradient>
            </Defs>
            <Path
              d="M45.7,-76.2C58.9,-69.3,69.1,-56.4,76.3,-42.2C83.5,-28,87.7,-12.5,85.6,1.9C83.5,16.3,75.1,29.6,65.2,40.8C55.3,52,43.9,61.1,31.2,65.8C18.5,70.5,4.5,70.8,-8.2,68.7C-20.9,66.6,-32.3,62.1,-42.6,54.4C-52.9,46.7,-62.1,35.8,-69.1,22.9C-76.1,10,-80.9,-4.9,-77.8,-18.2C-74.7,-31.5,-63.7,-43.2,-51.4,-50.6C-39.1,-58,-25.5,-61.1,-11.9,-61.6C1.7,-62.1,13.4,-60,25.1,-57.9"
              fill="url(#grad1)"
              transform="translate(100, 100) scale(0.9)"
            />
          </Svg>
        </Animated.View>

        {/* Blob 2 - Overlay for fluid morphing effect */}
        <Animated.View
          style={[
            styles.absoluteBlob,
            {
              transform: [{ rotate: rotate2 }, { scale: 1.2 }], // Larger scale
              opacity: 0.6,
            },
          ]}
        >
          <Svg width={350} height={350} viewBox="0 0 200 200">
            <Defs>
              <LinearGradient id="grad2" x1="1" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#8A2BE2" stopOpacity="0.8" />
                <Stop offset="1" stopColor="#00FFFF" stopOpacity="0.8" />
              </LinearGradient>
            </Defs>
            <Path
              d="M38.9,-66.4C51.1,-58.5,62.1,-49.3,70.9,-38.1C79.7,-26.9,86.3,-13.7,84.8,-1.1C83.3,11.5,73.7,23.5,63.7,33.7C53.7,43.9,43.3,52.3,32.2,57.9C21.1,63.5,9.3,66.3,-2.1,69.9C-13.5,73.5,-24.5,77.9,-34.9,72.9C-45.3,67.9,-55.1,53.5,-63.3,39.3C-71.5,25.1,-78.1,11.1,-76.8,-2.3C-75.5,-15.7,-66.3,-28.5,-56,-39.7C-45.7,-50.9,-34.3,-60.5,-22.3,-68.6C-10.3,-76.7,2.3,-83.3,14.5,-83.3"
              fill="url(#grad2)"
              transform="translate(100, 100) scale(0.85)"
            />
          </Svg>
        </Animated.View>

        {/* Logo Image Inside the Blob */}
        <View style={styles.logoImageContainer}>
          <Image
            source={require("../assets/nomix-logo2 .png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Text Section */}
      <View style={styles.textContainer}>
        <Svg width={220} height={80} viewBox="0 0 200 60">
          <Defs>
            <LinearGradient id="textGrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#00FFFF" stopOpacity="1" />
              <Stop offset="0.5" stopColor="#D500F9" stopOpacity="1" />
              <Stop offset="1" stopColor="#FF00FF" stopOpacity="1" />
            </LinearGradient>
            <LinearGradient id="glowGrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#00FFFF" stopOpacity="0.5" />
              <Stop offset="0.5" stopColor="#D500F9" stopOpacity="0.5" />
              <Stop offset="1" stopColor="#FF00FF" stopOpacity="0.5" />
            </LinearGradient>
          </Defs>

          <SvgText
            x="100"
            y="45"
            fill="url(#textGrad)"
            fontSize="52"
            fontWeight="bold"
            textAnchor="middle"
            fontFamily="sans-serif"
            letterSpacing="2"
          >
            Nomix
          </SvgText>
          <SvgText
            x="100"
            y="45"
            stroke="url(#glowGrad)"
            strokeWidth="2"
            fill="none"
            fontSize="52"
            fontWeight="bold"
            textAnchor="middle"
            fontFamily="sans-serif"
            letterSpacing="2"
            opacity="0.5"
          >
            Nomix
          </SvgText>
        </Svg>
      </View>
    </View>
  );
};

export default Logo;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  blobContainer: {
    width: 350,
    height: 350,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: -40,
  },
  absoluteBlob: {
    position: "absolute",
    width: 350,
    height: 350,
    alignItems: "center",
    justifyContent: "center",
  },
  logoImageContainer: {
    width: 160,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
    elevation: 10,
    borderRadius: 80, // Make container round
    overflow: "hidden", // Clip content to round shape
    backgroundColor: "rgba(0,0,0,0.2)", // Optional: subtle backing if image has transparency
  },
  logoImage: {
    width: "100%",
    height: "100%",
    borderRadius: 80, // Ensure image itself is rounded if not clipped by container
  },
  textContainer: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
});
