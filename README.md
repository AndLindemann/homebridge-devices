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
    "accessory" : "devices",
    "name" : "Devices",
    "devices" : [
      { "name" : "Fire-TV", "target" : "192.168.1.65" },
      { "name" : "Sony TV", "target" : "sonytv" }
    ],
    "threshold" : 5,
    "interval" : 30
  }
],
```

```target``` may be either a hostname or an IP address

# How it works
* When started homebridge-devices will ping the IP address associated with each device defined in config.json every ```interval``` seconds.
* When a ping is successful the current timestamp is logged to a file (seen.db.json)
* When a Homekit enabled app looks up the state of a device, the last seen time for that device is compared to the current time minus ```threshold``` minutes, and if it is greater assumes that the device is active.

