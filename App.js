import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Pressable,
    StatusBar,
    Dimensions,
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SHIP_WIDTH = 60;
const SHIP_HEIGHT = 70;
const SHIP_BOTTOM_OFFSET = 120;
const MOVE_STEP = 30;

const ASTEROID_SIZE = 44;
const ASTEROID_START_Y = -50;
const FALL_STEP = 6;
const TICK_MS = 30;

const HIGH_SCORE_KEY = '@space_escape_runner_high_score';
const SHIP_START_X = (SCREEN_WIDTH - SHIP_WIDTH) / 2;

export default function App() {
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [shipX, setShipX] = useState(SHIP_START_X);
    const [asteroidX, setAsteroidX] = useState(randomX());
    const [asteroidY, setAsteroidY] = useState(ASTEROID_START_Y);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);

    const shipXRef = useRef(shipX);
    useEffect(() => {
        shipXRef.current = shipX;
    }, [shipX]);

    // ---- Animated values (drive visuals only, never used in game logic) ----
    const animatedShipX = useRef(new Animated.Value(SHIP_START_X)).current;
    const asteroidSpin = useRef(new Animated.Value(0)).current;
    const flamePulse = useRef(new Animated.Value(0)).current;
    const gameOverOpacity = useRef(new Animated.Value(0)).current;
    const buttonScale = useRef(new Animated.Value(1)).current;

    function randomX() {
        return Math.random() * (SCREEN_WIDTH - ASTEROID_SIZE);
    }

    // Smoothly slide the ship to its new x position whenever shipX changes
    useEffect(() => {
        Animated.timing(animatedShipX, {
            toValue: shipX,
            duration: 150,
            useNativeDriver: false,
        }).start();
    }, [shipX]);

    // Continuous asteroid rotation loop (runs forever, independent of falling)
    useEffect(() => {
        const spinLoop = Animated.loop(
            Animated.timing(asteroidSpin, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: true,
            })
        );
        spinLoop.start();
        return () => spinLoop.stop();
    }, []);

    // Continuous thruster flame flicker loop
    useEffect(() => {
        const flameLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(flamePulse, { toValue: 1, duration: 250, useNativeDriver: true }),
                Animated.timing(flamePulse, { toValue: 0, duration: 250, useNativeDriver: true }),
            ])
        );
        flameLoop.start();
        return () => flameLoop.stop();
    }, []);

    // Fade in the Game Over panel when it appears
    useEffect(() => {
        if (isGameOver) {
            gameOverOpacity.setValue(0);
            Animated.timing(gameOverOpacity, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }).start();
        }
    }, [isGameOver]);

    useEffect(() => {
        const loadHighScore = async () => {
            try {
                const savedValue = await AsyncStorage.getItem(HIGH_SCORE_KEY);
                if (savedValue !== null) setHighScore(parseInt(savedValue, 10));
            } catch (error) {
                console.log('Failed to load high score:', error);
            }
        };
        loadHighScore();
    }, []);

    const saveHighScoreIfNeeded = async (finalScore) => {
        if (finalScore > highScore) {
            setHighScore(finalScore);
            try {
                await AsyncStorage.setItem(HIGH_SCORE_KEY, finalScore.toString());
            } catch (error) {
                console.log('Failed to save high score:', error);
            }
        }
    };

    const handleStartGame = () => {
        setScore(0);
        setShipX(SHIP_START_X);
        animatedShipX.setValue(SHIP_START_X);
        setAsteroidX(randomX());
        setAsteroidY(ASTEROID_START_Y);
        setIsGameOver(false);
        setIsPlaying(true);
    };

    const moveLeft = () => setShipX((prevX) => Math.max(prevX - MOVE_STEP, 0));
    const moveRight = () =>
        setShipX((prevX) => Math.min(prevX + MOVE_STEP, SCREEN_WIDTH - SHIP_WIDTH));

    const animateButtonPress = (pressedIn) => {
        Animated.spring(buttonScale, {
            toValue: pressedIn ? 0.94 : 1,
            useNativeDriver: true,
            speed: 30,
        }).start();
    };

    useEffect(() => {
        if (!isPlaying) return;

        const intervalId = setInterval(() => {
            setAsteroidY((prevY) => {
                const nextY = prevY + FALL_STEP;

                const shipTop = SCREEN_HEIGHT - SHIP_BOTTOM_OFFSET - SHIP_HEIGHT;
                const shipLeft = shipXRef.current;
                const shipRight = shipLeft + SHIP_WIDTH;
                const shipBottom = SCREEN_HEIGHT - SHIP_BOTTOM_OFFSET;

                const asteroidLeft = asteroidX;
                const asteroidRight = asteroidX + ASTEROID_SIZE;
                const asteroidTop = nextY;
                const asteroidBottom = nextY + ASTEROID_SIZE;

                const horizontalOverlap = asteroidLeft < shipRight && asteroidRight > shipLeft;
                const verticalOverlap = asteroidTop < shipBottom && asteroidBottom > shipTop;

                if (horizontalOverlap && verticalOverlap) {
                    setIsPlaying(false);
                    setIsGameOver(true);
                    setScore((currentScore) => {
                        saveHighScoreIfNeeded(currentScore);
                        return currentScore;
                    });
                    return nextY;
                }

                if (nextY > SCREEN_HEIGHT) {
                    setScore((prevScore) => prevScore + 1);
                    setAsteroidX(randomX());
                    return ASTEROID_START_Y;
                }

                return nextY;
            });
        }, TICK_MS);

        return () => clearInterval(intervalId);
    }, [isPlaying, asteroidX]);

    const spinDeg = asteroidSpin.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });
    const flameScale = flamePulse.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] });
    const flameOpacity = flamePulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

    return (
        <LinearGradient colors={['#0B0F1A', '#161B33', '#0B0F1A']} style={styles.container}>
            <StatusBar barStyle="light-content" />

            <Text style={styles.title}>Space Escape Runner</Text>

            <View style={styles.scoreRow}>
                <View style={styles.scoreBox}>
                    <Text style={styles.scoreLabel}>Score</Text>
                    <Text style={styles.scoreValue}>{score}</Text>
                </View>
                <View style={styles.scoreBox}>
                    <Text style={styles.scoreLabel}>High Score</Text>
                    <Text style={styles.highScoreValue}>{highScore}</Text>
                </View>
            </View>

            {!isPlaying && !isGameOver && (
                <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                    <Pressable
                        style={styles.button}
                        onPress={handleStartGame}
                        onPressIn={() => animateButtonPress(true)}
                        onPressOut={() => animateButtonPress(false)}
                    >
                        <Text style={styles.buttonText}>Start Game</Text>
                    </Pressable>
                </Animated.View>
            )}

            {isGameOver && (
                <Animated.View style={[styles.gameOverBox, { opacity: gameOverOpacity }]}>
                    <Text style={styles.gameOverText}>Game Over</Text>
                    <Text style={styles.finalScoreText}>Final Score: {score}</Text>
                    <Pressable style={styles.button} onPress={handleStartGame}>
                        <Text style={styles.buttonText}>Restart Game</Text>
                    </Pressable>
                </Animated.View>
            )}

            {isPlaying && (
                <View style={[styles.asteroidWrapper, { left: asteroidX, top: asteroidY }]}>
                    <Animated.View style={[styles.asteroid, { transform: [{ rotate: spinDeg }] }]}>
                        <View style={[styles.crater, styles.craterOne]} />
                        <View style={[styles.crater, styles.craterTwo]} />
                        <View style={[styles.crater, styles.craterThree]} />
                    </Animated.View>
                </View>
            )}

            <Animated.View style={[styles.spaceship, { left: animatedShipX }]}>
                <View style={styles.cockpitGlow} />
                <View style={styles.cockpit} />
                <View style={styles.body}>
                    <View style={styles.bodyStripe} />
                </View>
                <View style={styles.wings}>
                    <View style={styles.wingLeft} />
                    <View style={styles.wingRight} />
                </View>
                <Animated.View
                    style={[
                        styles.thruster,
                        { transform: [{ scaleY: flameScale }], opacity: flameOpacity },
                    ]}
                />
            </Animated.View>

            <View style={styles.controls}>
                <Pressable style={styles.controlButton} onPress={moveLeft}>
                    <Text style={styles.controlButtonText}>◀</Text>
                </Pressable>
                <Pressable style={styles.controlButton} onPress={moveRight}>
                    <Text style={styles.controlButtonText}>▶</Text>
                </Pressable>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 30,
        textAlign: 'center',
        letterSpacing: 1,
        textShadowColor: 'rgba(0,229,255,0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 12,
    },
    scoreRow: {
        flexDirection: 'row',
        marginBottom: 50,
    },
    scoreBox: {
        backgroundColor: 'rgba(26,32,53,0.7)',
        borderRadius: 16,
        paddingVertical: 20,
        paddingHorizontal: 30,
        alignItems: 'center',
        marginHorizontal: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,229,255,0.25)',
    },
    scoreLabel: {
        color: '#8A93A8',
        fontSize: 13,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 6,
    },
    scoreValue: {
        color: '#00E5FF',
        fontSize: 38,
        fontWeight: 'bold',
    },
    highScoreValue: {
        color: '#FFD700',
        fontSize: 38,
        fontWeight: 'bold',
    },
    button: {
        backgroundColor: '#00E5FF',
        paddingVertical: 16,
        paddingHorizontal: 48,
        borderRadius: 30,
        shadowColor: '#00E5FF',
        shadowOpacity: 0.6,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
    },
    buttonText: {
        color: '#0B0F1A',
        fontSize: 18,
        fontWeight: '700',
    },
    gameOverBox: {
        alignItems: 'center',
    },
    gameOverText: {
        color: '#FF4D4D',
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    finalScoreText: {
        color: '#FFFFFF',
        fontSize: 18,
        marginBottom: 20,
    },
    asteroidWrapper: {
        position: 'absolute',
        width: ASTEROID_SIZE,
        height: ASTEROID_SIZE,
    },
    asteroid: {
        width: '100%',
        height: '100%',
        borderRadius: 14,
        backgroundColor: '#9C6B45',
        borderWidth: 3,
        borderColor: '#5C3D22',
        overflow: 'hidden',
    },
    crater: {
        position: 'absolute',
        backgroundColor: '#5C3D22',
        borderRadius: 20,
    },
    craterOne: { width: 12, height: 12, top: 6, left: 8 },
    craterTwo: { width: 8, height: 8, top: 20, left: 24 },
    craterThree: { width: 6, height: 6, top: 26, left: 10 },
    spaceship: {
        position: 'absolute',
        bottom: SHIP_BOTTOM_OFFSET,
        width: 60,
        height: 70,
        alignItems: 'center',
    },
    cockpitGlow: {
        position: 'absolute',
        top: -4,
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: 'rgba(0,229,255,0.35)',
    },
    cockpit: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#00E5FF',
        marginBottom: -4,
        zIndex: 2,
    },
    body: {
        width: 30,
        height: 40,
        backgroundColor: '#E0E0E0',
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        borderBottomLeftRadius: 6,
        borderBottomRightRadius: 6,
        alignItems: 'center',
        overflow: 'hidden',
    },
    bodyStripe: {
        width: 6,
        height: '100%',
        backgroundColor: '#3B6FE0',
    },
    wings: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: 60,
        marginTop: -10,
    },
    wingLeft: {
        width: 0,
        height: 0,
        borderLeftWidth: 18,
        borderTopWidth: 18,
        borderLeftColor: 'transparent',
        borderTopColor: '#3B6FE0',
    },
    wingRight: {
        width: 0,
        height: 0,
        borderRightWidth: 18,
        borderTopWidth: 18,
        borderRightColor: 'transparent',
        borderTopColor: '#3B6FE0',
    },
    thruster: {
        width: 12,
        height: 10,
        backgroundColor: '#FF6B35',
        borderBottomLeftRadius: 6,
        borderBottomRightRadius: 6,
        marginTop: -2,
        shadowColor: '#FF6B35',
        shadowOpacity: 0.9,
        shadowRadius: 8,
    },
    controls: {
        position: 'absolute',
        bottom: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '60%',
    },
    controlButton: {
        backgroundColor: 'rgba(26,32,53,0.8)',
        borderWidth: 1,
        borderColor: '#00E5FF',
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    controlButtonText: {
        color: '#00E5FF',
        fontSize: 22,
        fontWeight: '700',
    },
});