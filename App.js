import React, { useEffect } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import AsyncStorage from '@react-native-community/async-storage';
import * as Notifications from 'expo-notifications';
import * as Permission from 'expo-permissions';

const STORAGE_KEY = 'date2';

Notifications.setNotificationHandler({
  handleNotification: async () => {
    return {
      shouldPlaySound: true,
      shouldShowAlert: true,
    };
  },
});

export default class App extends React.Component {
  constructor() {
    super();
    this.state = {
      ModalVisibility: false,
      value: 'Yearly',
      pickDate: false,
      dateDisplay: '',
      title: '',
      allReminders: [],
    };
  }
  useEffect = () => {
    Permission.getAsync(Permission.NOTIFICATIONS)
      .then((response) => {
        if (response.status !== 'granted') {
          return Permission.askAsync(Permission.NOTIFICATIONS);
        }
        return response;
      })
      .then((response) => {
        if (response.status !== 'granted') {
          return;
        }
      });
  };

  async componentDidMount() {
    try {
      const content = await AsyncStorage.getItem(STORAGE_KEY).then(
        (content) => {
          if (content !== null) {
            this.setState({ allReminders: JSON.parse(content) });
            console.log('storage retrieved: ' + this.state.allReminders);
          }
        }
      );
    } catch (error) {
      console.log(error);
    }
  }

  displayModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={this.state.ModalVisibility}>
        <View style={styles.modalView}>
          <TextInput
            style={styles.title}
            placeholder="Reminder Title"
            onChangeText={(text) => {
              this.setState({ title: text });
            }}
          />
          <View
            style={{
              alignItems: 'center',
              flexDirection: 'row',
              marginTop: 20,
            }}>
            <Text
              style={{
                fontSize: 20,
              }}>
              Repeat:{' '}
            </Text>
            <Picker
              style={styles.picker}
              selectedValue={this.state.value}
              onValueChange={(itemValue, itemIndex) =>
                this.setState({ value: itemValue })
              }>
              <Picker.Item label="Yearly" value="Yearly" />
              <Picker.Item label="Monthly" value="Monthly" />
              <Picker.Item label="Day-Wise" value="Day-Wise" />
            </Picker>
          </View>

          <View style={{ marginTop: 100 }}>
            <TouchableOpacity
              style={styles.pick}
              onPress={() => {
                this.setState({ pickDate: true });
              }}>
              <Text>Pick Time</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={() => this.setState({ ModalVisibility: false })}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  };

  handleNotification = async (Totalseconds) => {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: this.state.title,
        body: 'Reminder',
        sound: true,
      },
      trigger: {
        seconds: Totalseconds,
        repeats: false,
      },
    }).then((response) => {
      Notifications.addNotificationReceivedListener((notif) => {
        console.log('Notification Recieved');
        this.setState({
          dateDisplay: '',
        });
      });
    });
    console.log(identifier)
  };

  handleConfirm = (date) => {
    this.setState({ pickDate: false });
    var currentDate = new Date();

    var seconds = (date - currentDate) / 1000;
    console.log(seconds);
    console.log(currentDate.toString());

    if (seconds > 0) {
      Alert.alert('Reminder Is Set!');
      this.handleNotification(seconds);
      this.setState({
        ModalVisibility: false,
        dateDisplay: date.toString() + ' ' + this.state.title,
      });
      this.state.allReminders.push(this.state.dateDisplay);
      console.log(this.state.allReminders);
      this.saveStorage();
    } else {
      Alert.alert('Choose A Valid Date/Time!');
    }
  };

  saveStorage = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.state.allReminders));
      console.log('Succesfully Stored');
    } catch (error) {
      Alert.alert('Failed To Store');
      console.log(error);
    }
  };
  cancelNotification = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  };


  remove= (index)=>{
      const newNoti = this.state.allReminders;
      newNoti.splice(index, 1)
      this.setState({allReminders: newNoti})
      this.saveStorage();
       this.cancelNotification();
  }

  render() {
    return (
      <View style={styles.screen}>
        {this.displayModal()}
        <Text style={styles.title}>Reminder App</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => this.setState({ ModalVisibility: true })}>
          <Text style={styles.buttonText}>Add A Reminder</Text>
        </TouchableOpacity>

        <DateTimePickerModal
          isVisible={this.state.pickDate}
          onConfirm={this.handleConfirm}
          onCancel={() => this.setState({ pickDate: false })}
          mode="datetime"
        />

        <ScrollView style={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          {this.state.allReminders.map((item, index) => {
            if(item !== null && item !== 0) {
            return (
              <View
                style={{
                  marginTop: 30,
                }}>
                <View
                  style={{
                    justifyContent: 'space-between',
                    flexDirection: 'row',
                    marginLeft: 20,
                    marginRight: 20,
                  }}>
                  <Text
                    style={{
                      fontSize: 20,
                    }}>
                    {item.slice(4, 15)}
                  </Text>
                  <Text
                    style={{
                      fontSize: 20,
                    }}>
                    {item.slice(40)}
                  </Text>
                </View>
                <View style={styles.reminder}>
                  <Text style={{ fontSize: 30 }}>⏰ {item.slice(16, 21)}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      this.remove(index);
                    }}>
                    <Text style={{ fontSize: 30 }}>🚫</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          })}
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#a8fff6',
  },
  title: {
    backgroundColor: '#daf78b',
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    borderColor: 'grey',
    borderWidth: 5,
  },
  button: {
    marginTop: 30,
    borderColor: 'black',
    borderWidth: 3,
    borderRadius: 30,
    padding: 10,
    width: '70%',
    alignSelf: 'center',
    backgroundColor: '#fc0341',
  },

  buttonText: { textAlign: 'center', fontSize: 15, fontWeight: 'Bold' },

  modalView: {
    flex: 1,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    backgroundColor: '#24a0ed',
    marginTop: 30,
    fontSize: 25,
    fontWeight: 'bold',
    textAlign: 'center',
    borderColor: 'black',
    borderWidth: 2,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  picker: {
    height: 30,
    width: 150,
    fontSize: 20,
    borderColor: 'black',
    borderWidth: 2,
  },
  repeat: {
    borderColor: 'black',
    borderWidth: 1,
    width: 50,
    fontSize: 20,
    textAlign: 'center',
  },

  pick: {
    borderColor: 'black',
    borderWidth: 3,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#e2f587',
  },
  reminder: {
    flexDirection: 'row',
    borderColor: 'white',
    borderRadius: 100,
    borderWidth: 3,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    width: '60%',
    marginLeft: 70,
    justifyContent: 'space-between',
  },
});
