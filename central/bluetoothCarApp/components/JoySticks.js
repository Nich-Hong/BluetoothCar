import {
  SafeAreaView,
  StyleSheet,
  View,
  Button,
  StatusBar,
  Text,
  Dimensions,
} from "react-native";
import { AxisPad, AxisPadTouchEvent } from "@fustaro/react-native-axis-pad";
import { AxisPadStyles } from "../DefaultStyles";
import { useState, useEffect } from "react";
import DeviceModal from "./DeviceModal";
import { BleManager, Device } from "react-native-ble-plx";
import useBLE from "../components/useBLE";
import { useCallback } from "react";
const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;
const JoySticks = () => {
  const {
    requestPermissions,
    scanForPeripherals,
    allDevices,
    connectedDevice,
    connectToDevice,
    stopScan,
    disconnectFromDevice,
    sendMotorData,
    sendServoData,
  } = useBLE();
  const [modalVisible, setModalVisible] = useState(false);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const onTouchEventX = useCallback(
    async (event = AxisPadTouchEvent) => {
      const mappedX = Math.round(event.ratio.x * 300);
      setX(mappedX);
      if (connectedDevice) {
        await sendServoData(mappedX);
      }
    },
    [connectedDevice, sendServoData]
  );

  const onTouchEventY = useCallback(
    async (event = AxisPadTouchEvent) => {
      const mappedY = Math.round(event.ratio.y * 300);
      setY(mappedY);
      if (connectedDevice) {
        await sendMotorData(mappedY);
      }
    },
    [connectedDevice, sendMotorData]
  );

  const scanForDevices = useCallback(async () => {
    const isPermissionsEnabled = await requestPermissions();
    if (isPermissionsEnabled) {
      scanForPeripherals();
    }
  }, [requestPermissions, scanForPeripherals]);

  const openModal = useCallback(async () => {
    scanForDevices();
    setModalVisible(true);
  }, [scanForDevices]);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    stopScan();
  }, [stopScan]);
  return (
    <View style={styles.padContainer}>
      <View style={[styles.buttonContainer, { flexDirection: "row" }]}>
        <AxisPad
          id={"pad-1"}
          size={300}
          padBackgroundStyle={AxisPadStyles.pad}
          stickStyle={AxisPadStyles.largeStick}
          controlStyle={AxisPadStyles.controlKnob}
          ignoreTouchDownInPadArea={false}
          initialTouchType={"snap-to-value"}
          onTouchEvent={onTouchEventX}
          disableY={true}
          keepControlCompletelyInPadBounds={true}
        />
        <View style={[styles.guideStyle, { flexDirection: "row" }]}>
          <Text style={[styles.buttonTextStyle, { right: 90 }]}>L</Text>
          <Text style={[styles.buttonTextStyle, { left: 90 }]}>R</Text>
        </View>
      </View>
      <View style={styles.textContainer}>
        {connectedDevice &&
        connectedDevice !== null &&
        connectedDevice !== undefined ? (
          <View>
            <Button
              title="Disconnect"
              titleStyle={styles.connectButton}
              onPress={disconnectFromDevice}
            />
            <Text style={{ color: "white" }}>
              Connected to: {connectedDevice.name}
            </Text>
          </View>
        ) : (
          <Button
            titleStyle={styles.connectButton}
            title="Connect BLE"
            onPress={openModal}
          />
        )}
        <View>
          <Text style={styles.coordinateTextStyle}>x:{x}</Text>
          <Text style={styles.coordinateTextStyle}>y:{y}</Text>
        </View>
      </View>

      <View style={[styles.buttonContainer, { flexDirection: "column" }]}>
        <View style={{ transform: [{ rotate: "180deg" }] }}>
          <AxisPad
            id={"pad-2"}
            size={300}
            padBackgroundStyle={AxisPadStyles.pad}
            stickStyle={AxisPadStyles.largeStick}
            controlStyle={AxisPadStyles.controlKnob}
            ignoreTouchDownInPadArea={false}
            initialTouchType={"snap-to-value"}
            onTouchEvent={onTouchEventY}
            disableX={true}
            keepControlCompletelyInPadBounds={true}
          />
        </View>
        <View style={styles.guideStyle}>
          <Text style={[styles.buttonTextStyle, { bottom: 80 }]}>F</Text>
          <Text style={[styles.buttonTextStyle, { top: 80 }]}>B</Text>
        </View>
      </View>
      {modalVisible ? (
        <DeviceModal
          allDevices={allDevices}
          closeModal={closeModal}
          connectToPeripheral={connectToDevice}
        />
      ) : (
        <></>
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  padContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    display: "relative",
  },
  buttonContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  textContainer: {
    flex: 0.25,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    //   position: "absolute",
    //   left: windowWidth / 2,
    //   alignItems: "center",
  },
  buttonTextStyle: {
    color: "white",
    fontSize: 30,
  },
  coordinateTextStyle: {
    color: "white",
    fontSize: 20,
  },
  guideStyle: {
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
  },
  connectButton: {
    fontSize: 10,
  },
});
export default JoySticks;
