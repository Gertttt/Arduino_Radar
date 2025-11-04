#include <Servo.h>
Servo s;
int trigPin = 10;
int echoPin = 11;
long duration;
int distance;

void setup() {
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  Serial.begin(9600);
  s.attach(12);
}

void loop() {

  for (int angle = 180; angle >= 0; angle--) {
    s.write(angle);
    delay(120);
    distance = getDistance();
    if (distance > 40) distance = 40;
    Serial.print(angle);
    Serial.print(",");
    Serial.println(distance);
  }

  for (int angle = 0; angle <= 180; angle++) {
    s.write(angle);
    delay(120);
    distance = getDistance();
    if (distance > 40) distance = 40;
    Serial.print(angle);
    Serial.print(",");
    Serial.println(distance);
  }
}

int getDistance() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  duration = pulseIn(echoPin, HIGH);
  int cm = duration * 0.034 / 2;
  return cm;
}
