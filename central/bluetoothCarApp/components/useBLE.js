import { BleManager } from "react-native-ble-plx";
import { useMemo, useState, useEffect, useCallback } from "react";
import * as ExpoDevice from "expo-device";
import { PermissionsAndroid, Platform } from "react-native";
import { ToastAndroid } from "react-native";
import base64 from "react-native-base64";

const BCCAR_UUID = "2802f57b-d38b-4dca-a026-af1d10beee17";
const BCCAR_SERVO_CHARACTERISTIC_UUID = "2802f571-d381-4dca-a026-af1d10beee18";
const BCCAR_MOTOR_CHARACTERISTIC_UUID = "2802f571-d381-4dca-a026-af1d10beee19";
const SERVO_MOTOR_CHARACTERISTIC_UUID = "2802f571-d381-4dca-a026-af1d10beee20";

const useBLE = () => {
  const bleManager = useMemo(() => new BleManager(), []);
  const [allDevices, setAllDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);

  useEffect(() => {
    return () => {
      if (connectedDevice) {
        bleManager.cancelDeviceConnection(connectedDevice.id).catch((error) => {
          console.log(error);
        });
      }
    };
  }, [bleManager, connectedDevice]);

  const requestAndroid31Permissions = useCallback(async () => {
    const bluetoothScanPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );
    const bluetoothConnectPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );
    const fineLocationPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );

    return (
      bluetoothConnectPermission === PermissionsAndroid.RESULTS.GRANTED &&
      bluetoothScanPermission === PermissionsAndroid.RESULTS.GRANTED &&
      fineLocationPermission === PermissionsAndroid.RESULTS.GRANTED
    );
  }, []);

  const requestPermissions = useCallback(async () => {
    if (Platform.OS === "android") {
      if ((ExpoDevice.platformApiLevel ?? -1) < 31) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "Bluetooth requires Location",
            buttonPositive: "OK",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const isAndroid31PermissionsGranted =
          await requestAndroid31Permissions();
        return isAndroid31PermissionsGranted;
      }
    } else {
      return true;
    }
  }, [requestAndroid31Permissions]);

  const isDuplicateDevice = useCallback((devices, nextDevice) => {
    return devices.findIndex((device) => nextDevice.id === device.id) > -1;
  }, []);

  const scanForPeripherals = useCallback(() => {
    console.log("scanForPeripherals called");
    ToastAndroid.show("Scanning for Peripherals", ToastAndroid.SHORT);
    try {
      if (!bleManager) {
        console.log("bleManager is not initialized");
        return;
      }
      setAllDevices([]);
      bleManager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.log("Error: ", error);
          return;
        }
        if (device && device.name?.includes("BCCar")) {
          setAllDevices((prevState) => {
            if (!isDuplicateDevice(prevState, device)) {
              console.log(device.name);
              return [...prevState, device];
            }
            return prevState;
          });
        }
      });
    } catch (err) {
      ToastAndroid.show("Scan Failed", ToastAndroid.SHORT);
      console.log("Exception caught: ", err);
    }
  }, [bleManager, isDuplicateDevice]);

  const connectToDevice = useCallback(
    async (device) => {
      try {
        if (!bleManager) {
          console.log("bleManager is not initialized");
          return;
        }
        const deviceConnection = await bleManager
          .connectToDevice(device.id)
          .then((value) => {
            if (value) {
              ToastAndroid.show("Device Connected", ToastAndroid.SHORT);
            } else {
              ToastAndroid.show("Connection Failed", ToastAndroid.SHORT);
            }
            return value;
          });
        setConnectedDevice(deviceConnection);
        await deviceConnection
          .discoverAllServicesAndCharacteristics()
          .then((value) => {
            if (value) {
              ToastAndroid.show(
                "Device Services Connected",
                ToastAndroid.SHORT
              );
            } else {
              ToastAndroid.show("Device Services Failed", ToastAndroid.SHORT);
            }
          });
        deviceConnection.onDisconnected(handleDeviceDisconnection);
        bleManager.stopDeviceScan();
      } catch (error) {
        console.log("Connection Error", error);
      }
    },
    [bleManager, handleDeviceDisconnection]
  );

  const handleDeviceDisconnection = useCallback(() => {
    setConnectedDevice(null); // Clear connected device state
    ToastAndroid.show("Device Disconnected", ToastAndroid.SHORT);
  }, []);

  const stopScan = useCallback(() => {
    if (!bleManager) {
      console.log("bleManager is not initialized");
      return;
    }
    bleManager.stopDeviceScan();
  }, [bleManager]);

  const disconnectFromDevice = useCallback(() => {
    if (connectedDevice && bleManager) {
      bleManager.cancelDeviceConnection(connectedDevice.id);
      setConnectedDevice(null);
      ToastAndroid.show("Disconnected from Device", ToastAndroid.SHORT);
    }
  }, [bleManager, connectedDevice]);

  const sendServoData = useCallback(
    async (servoData) => {
      if (!connectedDevice || !bleManager) {
        console.log("BLE manager or connected device is not initialized");
        return;
      }
      const servoEncodedData = base64.encode(servoData.toString());
      try {
        await bleManager.writeCharacteristicWithoutResponseForDevice(
          connectedDevice.id,
          BCCAR_UUID,
          BCCAR_SERVO_CHARACTERISTIC_UUID,
          servoEncodedData
        );
        console.log("Servo data sent successfully:", servoData);
      } catch (e) {
        console.error("Error sending servo data:", e);
      }
    },
    [bleManager, connectedDevice]
  );

  const sendMotorData = useCallback(
    async (motorData) => {
      if (!connectedDevice || !bleManager) {
        console.log("BLE manager or connected device is not initialized");
        return;
      }
      const motorEncodedData = base64.encode(motorData.toString());
      try {
        await bleManager.writeCharacteristicWithoutResponseForDevice(
          connectedDevice.id,
          BCCAR_UUID,
          BCCAR_MOTOR_CHARACTERISTIC_UUID,
          motorEncodedData
        );
        console.log("Motor data sent successfully:", motorData);
      } catch (e) {
        console.error("Error sending motor data:", e);
      }
    },
    [bleManager, connectedDevice]
  );

  return {
    scanForPeripherals,
    requestPermissions,
    allDevices,
    connectToDevice,
    connectedDevice,
    stopScan,
    disconnectFromDevice,
    sendMotorData,
    sendServoData,
  };
};

export default useBLE;
