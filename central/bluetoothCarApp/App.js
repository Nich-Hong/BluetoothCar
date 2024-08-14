import {
  SafeAreaView,
  StyleSheet,
  View,
  Button,
  StatusBar,
  Text,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useState } from "react";
import JoySticks from "./components/JoySticks";

export default function App() {
  return (
    <SafeAreaView style={styles.pageContainer}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar hidden />
        <JoySticks />
      </GestureHandlerRootView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: "#36393e",
    color: "white",
  },
});
