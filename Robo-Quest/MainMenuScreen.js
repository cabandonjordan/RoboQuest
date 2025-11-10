import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, SafeAreaView, Image, Text, Animated, Dimensions, ImageBackground } from 'react-native'; 
import { useNavigation } from '@react-navigation/native';
const DARK_ACCENT_GREY = '#333333'; 
const LIGHT_GREY = '#AAA9AD';  
const ACCENT_GREY = '#5B676D'; 
const PANEL_DARK_BG = '#2A3439';
const CIRCLE_BG_COLOR = 'rgba(255, 255, 255, 0.2)'; 
const ICON_SIZE = 30; 
const CONTAINER_SIZE = 45; 
const screenWidth = Dimensions.get('window').width;

const QUEST_LIST_WIDTH = screenWidth * 0.90; 
const QUEST_LIST_OFFSET = (screenWidth / 2) - (QUEST_LIST_WIDTH / 2); 

const ICONS = {
    settings: require('./assets/icons/settings.png'),
    shop: require('./assets/icons/shop.png'),
    quest: require('./assets/icons/quest.png'), 
    main_menubg: require('./assets/background/MainMenubg.png'), 
};

const baseIconStyle = {
    width: CONTAINER_SIZE,
    height: CONTAINER_SIZE,
    borderRadius: CONTAINER_SIZE / 2,
    backgroundColor: CIRCLE_BG_COLOR, 
    justifyContent: 'center',
    alignItems: 'center',
};

const QuestList = ({ show, slideAnim, questIconLayout }) => {
    if (!show || !questIconLayout) return null; 

    const topPosition = questIconLayout.y + questIconLayout.height + 5; 
    
    const animatedStyle = {
        transform: [{
            translateX: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-QUEST_LIST_WIDTH, QUEST_LIST_OFFSET - 20], 
            }),
        }],
        top: topPosition,
        left: 0, 
    };

    const QUESTS = ["• Collect 5 Energy Cells", "• Defeat Boss Unit 3", "• Visit the Workshop"];

    return (
        <Animated.View style={[questListStyles.container, animatedStyle, { width: QUEST_LIST_WIDTH }]}>
            {QUESTS.map((quest, index) => (
                <View key={index} style={questListStyles.item}>
                    <Text style={questListStyles.text}>{quest}</Text> 
                </View>
            ))}
        </Animated.View>
    );
};


function MainMenuScreen() {
    const navigation = useNavigation();
    const [showQuestList, setShowQuestList] = useState(false);
    const slideAnim = useRef(new Animated.Value(0)).current; 
    const questIconRef = useRef(null);
    const [questIconLayout, setQuestIconLayout] = useState(null);

    const captureQuestIconLayout = () => {
        questIconRef.current?.measure((fx, fy, width, height, px, py) => {
            setQuestIconLayout({ x: px, y: py, width, height });
        });
    };

    useEffect(() => {
        const timeout = setTimeout(captureQuestIconLayout, 200);
        return () => clearTimeout(timeout);
    }, []);

    const toggleQuestList = () => {
        if (!questIconLayout) {
            captureQuestIconLayout();
        }
        
        setShowQuestList(prev => {
            const nextState = !prev;
            Animated.timing(slideAnim, {
                toValue: nextState ? 1 : 0,
                duration: 300, 
                useNativeDriver: true,
            }).start();
            return nextState;
        });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            
            <QuestList 
                show={showQuestList} 
                slideAnim={slideAnim} 
                questIconLayout={questIconLayout}
            />

            <ImageBackground 
                source={ICONS.main_menubg}
                style={styles.background}
                resizeMode="cover"
            >
                <View style={styles.floatingIconsLayer}>
                    
                    <TouchableOpacity 
                        style={baseIconStyle} 
                        onPress={toggleQuestList} 
                        activeOpacity={0.7} 
                        ref={questIconRef} 
                        onLayout={captureQuestIconLayout} 
                    >
                        <Image 
                            source={ICONS.quest} 
                            style={[styles.floatingIcon, { tintColor: showQuestList ? '#00FFFF' : DARK_ACCENT_GREY }]} 
                            resizeMode="contain"
                        />
                    </TouchableOpacity>

                    <View style={styles.topRightIcons}>
                        <TouchableOpacity 
                            style={baseIconStyle} 
                            onPress={() => navigation.navigate('Shop')}
                        >
                            <Image 
                                source={ICONS.shop} 
                                style={styles.floatingIcon} 
                                resizeMode="contain"
                            />
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={baseIconStyle} 
                            onPress={() => navigation.navigate('Settings')}
                        >
                            <Image 
                                source={ICONS.settings} 
                                style={styles.floatingIcon} 
                                resizeMode="contain"
                            />
                        </TouchableOpacity>
                    </View>
                </View>
                
            </ImageBackground>
        </SafeAreaView>
    );
}

const questListStyles = StyleSheet.create({
    container: {
        position: 'absolute',
        backgroundColor: PANEL_DARK_BG,
        borderRadius: 8,
        padding: 10,
        zIndex: 50, 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation: 10,
    },
    item: {
        paddingVertical: 8,
        paddingHorizontal: 5,
        borderBottomWidth: 1,
        borderBottomColor: ACCENT_GREY,
    },
    text: {
        color: LIGHT_GREY,
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'left',
    },
});


const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: LIGHT_GREY,
    },
    background: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    
    floatingIconsLayer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20, 
        width: '100%',
        zIndex: 10,
    },
    topLeftIcons: {
        width: 0, 
    },
    topRightIcons: {
        flexDirection: 'row',
        gap: 15,
    },
    
    floatingIcon: {
        width: ICON_SIZE, 
        height: ICON_SIZE,
        tintColor: DARK_ACCENT_GREY, 
    },
});

export default MainMenuScreen;