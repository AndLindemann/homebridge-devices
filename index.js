var ping = require('ping');
var moment = require('moment');

var Service, Characteristic, HomebridgeAPI;


module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  HomebridgeAPI = homebridge;

  homebridge.registerAccessory("homebridge-devices", "devices", DeviceAccessory);
}


function DeviceAccessory(log, config) {
  this.log = log;
  this.name = config['name'];
  this.devices = config['devices'];
  this.threshold = config['threshold'];
  this.interval = config['interval'];
  this.services = [];
  this.storage = require('node-persist');
  this.stateCache = [];

  //Init storage
  this.storage.initSync({
    dir: HomebridgeAPI.user.persistPath()
  });

  //Setup an OccupancySensor for each person defined in the config file
  config['devices'].forEach(function(deviceConfig) {
    var target = this.getTarget(deviceConfig);
    var service = new Service.OccupancySensor(deviceConfig.name, deviceConfig.name);
    service.target = target;
    service
      .getCharacteristic(Characteristic.OccupancyDetected)
      .on('get', this.getState.bind(this, target));

    this.services.push(service);
  }.bind(this));

  this.populateStateCache();

  //Start pinging the hosts
  this.pingHosts();
}

DeviceAccessory.prototype.populateStateCache = function() {
  this.devices.forEach(function(deviceConfig) {
    var target = this.getTarget(deviceConfig);
    var isActive = this.targetIsActive(target);

    this.stateCache[target] = isActive;
  }.bind(this));
}

DeviceAccessory.prototype.updateStateCache = function(target, state) {
  this.stateCache[target] = state;
}

DeviceAccessory.prototype.getStateFromCache = function(target) {
  return this.stateCache[target];
}

DeviceAccessory.prototype.getServices = function() {
  return this.services;
}

DeviceAccessory.prototype.getServiceForTarget = function(target) {
  var service = this.services.find(function(target, service) {
    return (service.target == target);
  }.bind(this, target));

  return service;
}


DeviceAccessory.prototype.getState = function(target, callback) {
  callback(null, this.getStateFromCache(target));
}

DeviceAccessory.prototype.pingHosts = function() {
  this.devices.forEach(function(deviceConfig) {

    var target = this.getTarget(deviceConfig);
    ping.sys.probe(target, function(state){
      //If target is alive update the last seen time
      if (state) {
        this.storage.setItem('device_' + target, Date.now());
      }

      var oldState = this.getStateFromCache(target);
      var newState = this.targetIsActive(target);
      if (oldState != newState) {
        //Update our internal cache of states
        this.updateStateCache(target, newState);

        //Trigger an update to the Homekit service associated with the target
        var service = this.getServiceForTarget(target);
        service.getCharacteristic(Characteristic.OccupancyDetected).setValue(newState);
      }
    }.bind(this));
  }.bind(this));

  setTimeout(DeviceAccessory.prototype.pingHosts.bind(this), this.interval * 1000);
}


/**
 * Handle old config entries that use a key of 'ip' instead of 'target'
 */
DeviceAccessory.prototype.getTarget = function(deviceConfig) {
  if (deviceConfig.ip) {
    return deviceConfig.ip;
  }

  return deviceConfig.target;
}


DeviceAccessory.prototype.targetIsActive = function(target) {
  var lastSeenUnix = this.storage.getItem('device_' + target);

  if (lastSeenUnix) {
    var lastSeenMoment = moment(lastSeenUnix);
    var activeThreshold = moment().subtract(this.threshold, 'm');
    //var activeThreshold = moment().subtract(2, 's');

    var isActive = lastSeenMoment.isAfter(activeThreshold);

    if (isActive) {
      return true;
    }
  }

  return false;
}
