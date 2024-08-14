import React from "react";
import {
  View,
  Modal,
  FlatList,
  Text,
  Button,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useCallback } from "react";

const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;

const DeviceModal = ({ allDevices, closeModal, connectToPeripheral }) => {
  const connectAndCloseModal = useCallback(
    async (itemData) => {
      await connectToPeripheral(itemData.item);
      closeModal();
    },
    [connectToPeripheral, closeModal]
  );

  return (
    <Modal
      animationType={"fade"}
      onRequestClose={closeModal}
      transparent={true}
      presentationStyle="overFullScreen"
    >
      <View style={styles.modalContainer}>
        <Text style={styles.textColor}>Choose Device...</Text>
        <FlatList
          style={styles.choiceView}
          alwaysBounceVertical={true}
          data={allDevices}
          keyExtractor={(item, index) => item.id}
          renderItem={(itemData) => (
            <View style={styles.buttonView}>
              <Button
                color="#5768a2"
                style={styles.textColor}
                title={itemData.item.name}
                onPress={() => connectAndCloseModal(itemData)}
              />
            </View>
          )}
        />
      </View>
      <Button title="close" onPress={closeModal} />
    </Modal>
  );
};

export default DeviceModal;

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: "#282b30",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  textColor: {
    color: "white",
    fontSize: 30,
  },
  choiceView: {
    flex: 1,
    backgroundColor: "#7289da",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  buttonView: {
    margin: 8,
  },
  lastItem: {
    marginBottom: 20, // Extra margin for the last item
  },
});
