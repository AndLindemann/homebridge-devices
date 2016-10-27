"use strict";

var ping = require("net-ping"),
  Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-devices", "Device", Device);
};

function Device(log, config) {
  var service = new Service.Switch(config.name),
    pingInterval = 1000 * (config.pingInterval || 5),
    isOnline = false,
    self = this;

  var pinger = new Pinger(config.ip, pingInterval, function(state) {
    this.setOnline(state);
  }.bind(this), log).start();


  service.getCharacteristic(Characteristic.On)
    .on('get', function(callback) {
      var online = this.getOnline();
      log('Call get for %s, return %s', config.ip, online);
      callback(null, online);
    }.bind(this));


  this.getServices = function() {
    return [service];
  };

  this.setOnline = function(newState) {
    var online = this.getOnline();
    if (newState !== online) {
      log('Updating state for %s %s -> %s', config.ip, online, newState);
      isOnline = newState;
      service.getCharacteristic(Characteristic.On).getValue();
    }
  };

  this.getOnline = function() {
    return isOnline;
  };

  return this;
}


function Pinger(ip, interval, callback, log) {
  var running = false,
    pingSession = ping.createSession(),
    pingTimer;

  var log = log || function() {};


  function run() {
    if (running) {
  log('Skip Pinging %s', ip);
      return;
    }


  log('Pinging %s', ip);
    running = true;
    pingSession.pingHost(ip, function(error) {
      running = false;
      callback(!error);
    });
  }


  return {
    start: function() {
      this.stop();
      log('Starting timer on %dms interval for %s.', interval, ip);
      pingTimer = setInterval(run, interval);
      return this;
    },

    stop: function() {
      if (pingTimer) {
        log('Stopping the current timer for %s.', ip);
        pingTimer = clearInterval(pingTimer);
      }

      return this;
    }
  };
}
