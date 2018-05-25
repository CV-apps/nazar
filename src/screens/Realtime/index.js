"use strict";
import React, { Component } from "react";
import {
  Animated,
  AppRegistry,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  Linking,
  View,
  ScrollView
} from "react-native";
import { RNCamera } from "react-native-camera";
import { Text, Icon } from "react-native-elements";
import timer from "react-native-timer";

import Clarifai from "clarifai";
import { CLARIFAY_KEY } from "react-native-dotenv";
import { TfImageRecognition } from "react-native-tensorflow";

import styles from "./styles";

export default class Realtime extends Component {
  static navigationOptions = ({ navigation }) => ({
    header: null
  });

  constructor(props) {
    super(props);
    this.image = require("../../../assets/dumbbell.jpg");
    this.state = {
      result: "",
      value: null,
      flashMode: RNCamera.Constants.FlashMode.auto,
      flash: "auto",
      showFlashOptions: false,
      type: RNCamera.Constants.Type.back
    };
    //this.alreadySelectedImages = this.props.navigation.state.params.alreadySelectedImages;
    this.goBack = this.goBack.bind(this);
    this.takePicture = this.takePicture.bind(this);
    this.selectFlashMode = this.selectFlashMode.bind(this);
    this.showFlashOptionsBlock = this.showFlashOptionsBlock.bind(this);
    this.switchCamera = this.switchCamera.bind(this);
    timer.setInterval(this, "takePicture", () => this.takePicture(), 1000);
    timer.setInterval(this, "clearInterval", () => this.clearInterval(), 30000);
  }

  componentDidMount() {
    /*
    const clarifai = new Clarifai.App({
      apiKey: CLARIFAY_KEY //dummy
    });
    */
    process.nextTick = setImmediate; // RN polyfill
  }

  async _reg(img) {
    var preder = null;
    try {
      const tfImageRecognition = new TfImageRecognition({
        model: require("../../../assets/tensorflow_inception_graph.pb"),
        labels: require("../../../assets/tensorflow_labels.txt")
      });

      const results = await tfImageRecognition.recognize({
        image: img //this.image
      });

      // const resultText = `Name: ${results[0].name} - Confidence: ${results[0].confidence}`

      const items = results
        .map(item => {
          return item.name;
        })
        .join("、");
      const resultText = `Found: ${items}`;

      results.forEach(result => (preder = result.confidence));

      await tfImageRecognition.close();

      this.setState({
        result: resultText,
        value: preder
      });

      return resultText;
    } catch (err) {
      alert(err);
    }
  }

  takePicture = async function() {
    if (this.camera) {
      const options = { quality: 0.5, base64: true };
      const data = await this.camera.takePictureAsync(options);
      this._reg(data.uri.replace("file:///", "")).then(res => {
        this.setState({ result: res });
      });
      /*
      console.log(data.uri);
      clarifai.models
        .predict(Clarifai.GENERAL_MODEL, data.base64)
        .then(response => {
          const { concepts } = response.outputs[0].data.uri;

          if (concepts && concepts.length > 0) {
            for (const prediction of concepts) {
              this.setState({
                result: prediction.name,
                value: prediction.value
              });
            }
          }
        })
        .catch(err => alert(err));*/
      //this.props.navigation.navigate('CameraPreview', {'imageData': data, 'alreadySelectedImages': this.alreadySelectedImages});
    }
  };

  componentWillUnmount() {
    timer.clearInterval(this);
  }

  async clearInterval() {
    timer.clearInterval(this);
    this.setState({
      result: "",
      value: ""
    });
  }

  goBack() {
    this.props.navigation.goBack();
  }

  selectFlashMode(type) {
    if (type === "auto") {
      this.setState({
        flashMode: RNCamera.Constants.FlashMode.auto,
        flash: "auto",
        showFlashOptions: false
      });
    } else if (type === "off") {
      this.setState({
        flashMode: RNCamera.Constants.FlashMode.off,
        flash: "off",
        showFlashOptions: false
      });
    } else {
      this.setState({
        flashMode: RNCamera.Constants.FlashMode.on,
        flash: "on",
        showFlashOptions: false
      });
    }
  }

  showFlashOptionsBlock() {
    this.setState({
      showFlashOptions: true
    });
  }

  switchCamera() {
    if (this.state.type === RNCamera.Constants.Type.back) {
      this.setState({
        type: RNCamera.Constants.Type.front
      });
    } else {
      this.setState({
        type: RNCamera.Constants.Type.back
      });
    }
  }

  render() {
    let autoColor = this.state.flash === "auto" ? "yellow" : "white";
    let onColor = this.state.flash === "on" ? "yellow" : "white";
    let offColor = this.state.flash === "off" ? "yellow" : "white";
    return (
      <View style={styles.container}>
        <View style={styles.cameraOptionsHeader}>
          <TouchableOpacity onPress={this.goBack}>
            <Icon iconStyle={styles.backButton} name="arrow-back" />
          </TouchableOpacity>
          {this.state.showFlashOptions ? (
            <View style={styles.flashOptionsContainer}>
              <TouchableOpacity
                style={{ paddingRight: 5 }}
                onPress={() => this.selectFlashMode("auto")}
              >
                <Text style={[{ color: autoColor }, styles.flashOptionsText]}>
                  Auto
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ paddingRight: 5 }}
                onPress={() => this.selectFlashMode("on")}
              >
                <Text style={[{ color: onColor }, styles.flashOptionsText]}>
                  On
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ paddingRight: 5 }}
                onPress={() => this.selectFlashMode("off")}
              >
                <Text style={[{ color: offColor }, styles.flashOptionsText]}>
                  Off
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={this.showFlashOptionsBlock}>
              <Icon
                iconStyle={styles.flashIcon}
                type="MaterialIcons"
                name={
                  this.state.flash === "auto"
                    ? "flash-auto"
                    : this.state.flash === "on"
                      ? "flash-on"
                      : "flash-off"
                }
              />
            </TouchableOpacity>
          )}
        </View>
        <RNCamera
          ref={ref => {
            this.camera = ref;
          }}
          style={styles.preview}
          type={this.state.type}
          flashMode={this.state.flashMode}
          mirrorImage={true}
          permissionDialogTitle={"Permission to use camera"}
          permissionDialogMessage={
            "We need your permission to use your camera phone"
          }
        />
        <View style={styles.cameraClickBlock}>
          <View style={{ flex: 1 }} />
          <Animated.View style={[styles.animator]}>
            <ScrollView style={{ height: 100 }}>
              <Text
                style={{
                  fontSize: 26,
                  color: "#fff",
                  fontFamily: "bold",
                  textAlign: "center",
                  marginTop: 10
                }}
              >
                {this.state.result}
              </Text>
              <Text
                style={{
                  fontSize: 22,
                  color: "#fff",
                  fontFamily: "bold",
                  textAlign: "center",
                  marginTop: 10
                }}
              >
                {this.state.value}
              </Text>
            </ScrollView>
          </Animated.View>
          <Icon
            iconStyle={styles.googleLink}
            type="font-awesome"
            name="google"
            onPress={() =>
              Linking.openURL(
                `https://www.google.com/search?q=${this.state.result}`
              )
            }
          />
          <Icon
            iconStyle={styles.wikiLink}
            type="font-awesome"
            name="wikipedia-w"
            onPress={() =>
              Linking.openURL(
                `https://en.m.wikipedia.org/w/index.php?search=${
                  this.state.result
                }&title=Special:Search&fulltext=1`
              )
            }
          />
          <TouchableOpacity
            style={{
              flex: 1,
              flexDirection: "row",
              justifyContent: "flex-end"
            }}
            onPress={this.switchCamera}
          >
            <Icon iconStyle={styles.cameraIcon} name="switch-camera" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}
