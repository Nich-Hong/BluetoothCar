#include <ArduinoBLE.h>
#include <string.h>
#include <ESP32Servo.h>
bool buttonPressed();
void checkAndApplyAdvertise();
void currentlyAdvertising();

BLEService bcCar("2802f57b-d38b-4dca-a026-af1d10beee17");
BLEStringCharacteristic servoRequestCharacteristic("2802f571-d381-4dca-a026-af1d10beee18",  BLEWriteWithoutResponse, 4);
BLEStringCharacteristic motorRequestCharacteristic("2802f571-d381-4dca-a026-af1d10beee19", BLEWriteWithoutResponse, 4);

Servo myServo;
static const int SERVOPIN = 14;

static const int DIRPIN = 4;
static const int PWMPIN = 15;



int bleLED = 17;
int bleButton = 16;

bool ledBlink = false;
bool advertiseState = false;
bool isAdvertising = false;
int motorState = 0; //0 is stop, -1 is backwards, 1 is forward
unsigned long motorMillis = 0;
unsigned long startMillis = 0;
unsigned long blinkMillis = 0;
const long advertisingDuration = 60000;
const long blinkDuration = 1000;


void setup() {
  Serial.begin(9600);
  if(!BLE.begin()){
    Serial.println("Starting BLE failed.");
    
  }

  pinMode(bleLED, OUTPUT);
  pinMode(bleButton, INPUT_PULLUP);
  
  
  myServo.write(90);
  myServo.attach(SERVOPIN);
  myServo.write(90);

  pinMode(DIRPIN, OUTPUT);
  pinMode(PWMPIN, OUTPUT);
  digitalWrite(DIRPIN, LOW);
  digitalWrite(PWMPIN, LOW);

  BLE.setLocalName("BCCar");
  BLE.setDeviceName("BCCar");
  BLE.setAdvertisedService(bcCar);
  bcCar.addCharacteristic(servoRequestCharacteristic);
  bcCar.addCharacteristic(motorRequestCharacteristic);
  BLE.addService(bcCar);

  bool b = ledcAttachChannel(PWMPIN, 5000, 8, 5);
}

void loop() {
  buttonPressed();
  checkAndApplyAdvertise();
  if (isAdvertising){
    currentlyAdvertising();
  }

  BLEDevice central = BLE.central();
  if (central){
    digitalWrite(bleLED, HIGH); //turn on the pin, supplies 3.3v, to led
    Serial.println("connected");
    BLE.stopAdvertise();
    advertiseState = false;
    isAdvertising = false;
    while(central.connected()){
      if (buttonPressed()){
        Serial.println("entering pressed");
        central.disconnect();
        break;
      }
      if (!central.connected()){
        central.disconnect();
        break;
      }
      if(servoRequestCharacteristic.written()){
         String newAngle = servoRequestCharacteristic.value();
         int servoValue = newAngle.toInt();
         Serial.println("servo:"+newAngle);
         int x = map(servoValue, 300, -300, 20, 160);
         myServo.write(x);
      }

      if(motorRequestCharacteristic.written()){
         String newAngle = motorRequestCharacteristic.value();
         int motorValue = newAngle.toInt();
         Serial.println("motor:"+newAngle);
        int y = map(motorValue, -300, 300, -200, 250);
        motorPWM(y, DIRPIN, PWMPIN);
      }
    }
    Serial.println("Disconnected");
    digitalWrite(bleLED, LOW);
    motorPWM(0, DIRPIN, PWMPIN);
    myServo.write(90);

  }  
}
// when the button is pressed we want to signal that there is no connection and that we should start advertising
bool buttonPressed() {
  if(digitalRead(bleButton)==LOW){
    return (advertiseState = true);
  }
  return false;
}

//we need to check if the currect state should be advertising. If true, we need to start the count for the advertising duration.
void checkAndApplyAdvertise(){
  if (advertiseState){
    BLE.advertise();
    Serial.println("Advertising");
    blinkMillis = startMillis = millis();
    advertiseState = false;
    isAdvertising = true;
  }
}

//we will be blinking the light during the advertising and also checking if the duration for advertising is complete then we stop blinking
void currentlyAdvertising(){
    if (millis()-blinkMillis >= blinkDuration){
      blinkMillis = millis();
      if(ledBlink) digitalWrite(bleLED, HIGH);
      else digitalWrite(bleLED, LOW);
      ledBlink = !ledBlink;
    }
    if (millis() - startMillis >= advertisingDuration){
      BLE.stopAdvertise();
      isAdvertising = false;
      digitalWrite(bleLED,LOW);
      ledBlink = false;
    }
}

void motorPWM(int pwm, int pin1, int pin2){
  unsigned long timeDiff = millis() - motorMillis;
//if backwards signal and ((if motor was previously on forward and if the time delay of at least 500 milliseconds is complete) or (the motor is already spinning backwards or the motor was previously at 0))
   if(pwm < 0){ 
    if ((motorState == 1 && (timeDiff >= 300)) || motorState <= 0){
      digitalWrite(pin1, HIGH);
      ledcWrite(pin2, pwm);
      motorState = -1;
      motorMillis = millis();
    } else{
      digitalWrite(pin1, LOW);
      ledcWrite(pin2, 0);
    }
  } else if(pwm > 0){
    if ((motorState == -1 && (timeDiff >= 300)) || motorState >=0){
      digitalWrite(pin1, LOW);
      ledcWrite(pin2, pwm);
      motorState = 1;
      motorMillis = millis();
    } else{
      digitalWrite(pin1, LOW);
      ledcWrite(pin2, 0);
    }
  } else{
    digitalWrite(pin1, LOW);
    ledcWrite(pin2, 0);
    if (timeDiff >= 500) {
      motorState = 0;
    }
  } 
}