Speakagent AAC
=====================

Mal Test!

An assistive audio control application for mobile devices.

## Pre-requisites

* [NodeJS](http://nodejs.org)
* iOS Developer Tools (including XCode)

## Installation

Install Cordova, [Ionic Framework](http://ionicframework.com), ios-sim, gulp globally:

```bash
$ sudo npm install -g cordova ionic ios-sim gulp
```

Then run:

```bash
$ cd <location-of-this-project>
$ npm install
$ gulp install
```

More info on this can be found on the Ionic [Documentation](http://ionicframework.com/docs) page.

## Live reload web preview

For convenient development, can run the application in a web browser with live reload enabled.

You will need two shell instances, so open the first tab/pane/whatever and run:

```bash
$ cd <location-of-this-project>
$ gulp watch
```

Then, in the second shell, run:

```bash
$ cd <location-of-this-project>
$ ionic serve
```

This will open the system default web browser to the running application.

## Mobile device emulation

To emulate iOS experience using the iOS simulator, run the following:

```bash
$ cd <location-of-this-project>
$ ionic emulate ios
```
