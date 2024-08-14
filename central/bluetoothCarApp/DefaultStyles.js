import { StyleSheet } from "react-native";

export const padBackgroundColor = "#7289da";
export const padBorderColor = "#a2b7ff";

export const AxisPadStyles = StyleSheet.create({
  pad: {
    backgroundColor: padBackgroundColor,
    borderColor: padBorderColor,
    borderWidth: 1.5,
  },
  controlKnob: {
    backgroundColor: "#4a63bd",
    borderColor: padBorderColor,
    borderWidth: 1.5,
  },
  largeStick: {
    width: 20,
    backgroundColor: "#f4d2d2",
    borderColor: "#ffffff",
    borderWidth: 1,
  },
  smallStick: {
    width: 20,
    borderColor: "#ffffff",
    backgroundColor: "#f4d2d2",
    borderWidth: 1,
  },
});
