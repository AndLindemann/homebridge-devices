# homebridge-devices
This is a plugin for homebridge. It monitors if configured network devices are online by pinging them in intervalls.

# Installation

1. Install homebridge (if not already installed) using: npm install -g homebridge
2. Install this plugin using: npm install -g homebridge-devices
3. Update your configuration file. See below for a sample.

# Configuration

```
"accessories": [
    {
    "accessory" : "Devices",
    "name" : "Devices",
    "devices" : [
      { "name" : "Schlafzimmer FireTV", "target" : "10.0.0.50" },
      { "name" : "Playstation", "target" : "10.0.0.35" },
      { "name" : "Wohnzimmer TV", "target" : "10.0.0.21" }
    ],
    "threshold" : 30
  }
],
```

```target``` may be either a hostname or an IP address

# How it works
* When started homebridge-devices will ping the IP address associated with each device defined in config.json every ```pingInterval``` seconds.
* When a Homekit enabled app looks up the state of a device, the online status for the device is returned

