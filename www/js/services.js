angular.module('app.services', [])

.factory('BlankFactory', [function(){

}])

.service('BlankService', [function(){

}])

.factory('BLE', function($q) {

  var connected;

  return {

    devices: [],

    scan: function(duration) {
        var that = this;
        var deferred = $q.defer();

        that.devices.length = 0;

        // disconnect the connected device (hack, device should disconnect when leaving detail page)
        if (connected) {
            var id = connected.id;
            ble.disconnect(connected.id, function() {
                console.log("Disconnected " + id);
            });
            connected = null;
        }

        ble.startScan([],  /* scan for all services */
            function(peripheral){
                that.devices.push(peripheral);
            },
            function(error){
                deferred.reject(error);
            });

        setTimeout(ble.stopScan, duration,
            function() {
                deferred.resolve();
            },
            function() {
                deferred.reject("Error - stopping scan");
            }
        );

        return deferred.promise;
    },
    readRSSI: function(deviceId) {
        var deferred = $q.defer();
        
        ble.readRSSI(deviceId, function(rssi) {
            deferred.resolve(rssi);
        }, function(err) {
            deferred.reject(err);
        });
        
        return deferred.promise;
    },
    read: function(device_id, service_uuid, characteristic_uuid) {
        var deferred = $q.defer();
        
        ble.read(device_id, service_uuid, characteristic_uuid, function(data) {
            deferred.resolve(data);
        }, function(err) {
            deferred.reject(err);
        });
        
        return deferred.promise;
    },
    isDefined: function() {
        return typeof ble !== 'undefined';
    },
    isEnabled: function() {
        var deferred = $q.defer();
        
        ble.isEnabled(function(){
            deferred.resolve();
        }, function() {
            deferred.reject("Bluetooth is not enabled");  
        });
        
        return deferred.promise;
    },
    isConnected: function(deviceId) {
        var deferred = $q.defer();
        
        ble.isConnected(deviceId, function(){
            deferred.resolve();
        }, function() {
            deferred.reject("Device is not connected");   
        });
        
        return deferred.promise;
    },
    enable: function() {
        var deferred = $q.defer();
        
        ble.enable(function(){
            deferred.resolve();
        }, function() {
            deferred.reject("The user did *not* enable Bluetooth");
        });
        
        return deferred.promise;
    },
    connect: function(deviceId) {
        var deferred = $q.defer();

        ble.connect(deviceId, function(peripheral) {
            connected = peripheral;
            deferred.resolve(peripheral);
        }, function(reason) {
            deferred.reject(reason);
        });

        return deferred.promise;
    },
    disconnect: function(deviceId) {
        var deferred = $q.defer();

        ble.discconnect(deviceId, function() {
            connected = null;
            deferred.resolve();
        }, function(reason) {
            deferred.reject(reason);
        });

        return deferred.promise;
    }
  };
});