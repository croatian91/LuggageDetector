angular.module('app.controllers', [])
  
.controller('homeCtrl', ['$scope', '$stateParams', '$state', '$ionicLoading', '$ionicPopup', '$ionicListDelegate', 'BLE', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
function ($scope, $stateParams, $state, $ionicLoading, $ionicPopup, $ionicListDelegate, BLE) {

	$scope.scanning = false;
	
	$scope.$on('$ionicView.beforeEnter', function(scopes, states) {
        $scope.devices = JSON.parse(window.localStorage.getItem('devices')) || [];
    });
    
    $scope.toggleExplanation = function() {
        $scope.explanation = !$scope.explanation;
    };
    
    $scope.push_back = function() {
        $state.go('menu.devices');
    };
    
    $scope.rename = function(deviceId) {
        $ionicListDelegate.closeOptionButtons();
        $state.go('menu.rename', {deviceId: deviceId});
    };
    
    $scope.delete = function(index, deviceId) {
        $ionicListDelegate.closeOptionButtons();
        $ionicPopup.confirm({
            title: 'Confirmation',
            template: 'Etes-vous certain(e)?',
        }).then(function(res) {
            if (res) {
                for (var i = 0; i < $scope.devices.length; i++)
                    if ($scope.devices[i].id == deviceId)
                        $scope.devices.splice(index, 1);
                        
                window.localStorage.setItem('devices', JSON.stringify($scope.devices));
            }
        });
    };
	
	$scope.scan = function(deviceId) {
        if (!$scope.scanning){
            $ionicLoading.show({template: '<ion-spinner icon="ripple" class="spinner-assertive"></ion-spinner>'});
            $scope.scanning = true;
            
            if (BLE.isDefined()){
                BLE.enable().then(function() {
					BLE.scan(1000).finally(function() {
						$ionicLoading.hide().then(function(){
							$scope.scanning = false;
							$state.go('menu.details', {deviceId: deviceId});
						});
					});
				});
            }
        }
    };
}])
   
.controller('menuCtrl', ['$scope', '$stateParams', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
function ($scope, $stateParams) {


}])
   
.controller('settingsCtrl', ['$scope', '$stateParams', '$translate', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
function ($scope, $stateParams, $translate) {

    $scope.settings = {
        scanDuration: parseInt(window.localStorage.getItem('scanDuration'), 10) || 5,
        refreshInterval: parseInt(window.localStorage.getItem('refreshInterval'), 10) || 1,
        vibration: window.localStorage.getItem('vibration') === 'true',
        sound: window.localStorage.getItem('sound') === 'true',
        language: window.localStorage.getItem('language') || $translate.use()
    };
    
    $scope.onScanDurationDrag = function() {
        window.localStorage.setItem('scanDuration', $scope.settings.scanDuration);
    };
    
    $scope.onRefreshIntervalDrag = function() {
        window.localStorage.setItem('refreshInterval', $scope.settings.refreshInterval);
    };
    
    $scope.onVibrationChange = function() {
        window.localStorage.setItem('vibration', $scope.settings.vibration);
    };
    
    $scope.onSoundChange = function() {
        window.localStorage.setItem('sound', $scope.settings.sound);
    };
    
    $scope.onLanguageChange = function() {
        window.localStorage.setItem('language', $scope.settings.language);
		$translate.use($scope.settings.language);
    };
}])
   
.controller('detailsCtrl', ['$scope', '$stateParams', '$ionicLoading', 'BLE', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
function ($scope, $stateParams, $ionicLoading, BLE) {
    
    $scope.settings = {
        refreshInterval: parseInt(window.localStorage.getItem('refreshInterval'), 10) || 1,
        vibration: window.localStorage.getItem('vibration') === 'true',
        sound: window.localStorage.getItem('sound') === 'true'
    };
    $scope.devices = JSON.parse(window.localStorage.getItem('devices')) || [];
    $scope.index = -1;
    $scope.added = false;
    $scope.connecting = false;
    $scope.connected = false;
    $scope.device = null;
    $scope.distance = -1;
    $scope.last = -1;
    
    if (window.plugins && window.plugins.NativeAudio)
		window.plugins.NativeAudio.preloadSimple('beep', 'audio/beep.mp3');
    
    $scope.playBeep = function() {
        if (window.plugins && window.plugins.NativeAudio && $scope.settings.sound)
            window.plugins.NativeAudio.play('beep');
	};
	
	$scope.vibrate = function() {
        if ($scope.settings.vibration)
            navigator.vibrate(300);
	};
    
    $scope.toggleExplanation = function() {
        $scope.explanation = !$scope.explanation;
    };
    
    $scope.$on("$ionicView.leave", function(){
		if (BLE.isDefined())
			BLE.isConnected($stateParams.deviceId, function(){
                BLE.disconnect($stateParams.deviceId);
			});
	});
    
    $scope.init = function() {
        for (var i = 0; $scope.index < 0 && i < $scope.devices.length; i++)
            if ($scope.devices[i].id == $stateParams.deviceId)
                $scope.index = i;
                
        $scope.added = $scope.index > -1;
            
        if (BLE.isDefined()){
            $ionicLoading.show({template: '<ion-spinner icon="ripple" class="spinner-assertive"></ion-spinner>'});
            
            $scope.connecting = true;
            
            BLE.connect($stateParams.deviceId).then(function(peripheral) {	
				$scope.device = peripheral;
				$scope.device['distance'] = -1;
				
				BLE.read($stateParams.deviceId, '1804', '2A07').then(function(buffer){
					var txPower = new Uint8Array(buffer)[0] - 52;
					
					setInterval(function(){
						BLE.readRSSI($stateParams.deviceId).then(function(rssi) {
                            var distance = Math.pow(10, (txPower - rssi) / 20).toFixed(1);
                            var rounded = Math.round(distance);
                            
							$scope.device.rssi = rssi;
							$scope.device.distance = distance;
							
							if (rounded < 4 && rounded !== $scope.last) {
                                $scope.last = rounded;
                                
                                $scope.vibrate();
                                $scope.playBeep();
							}
						});
					}, $scope.settings.refreshInterval * 1000);
				});
            }).then(function(){
				$ionicLoading.hide().then(function(){
					$scope.connected = true;
					$scope.connecting = false;
					
					$scope.vibrate();
					$scope.playBeep();
				});
			});
        } else {
            $scope.connected = true;
            $scope.device = {
                id: 'fsfsdfsd',
                name: 'fsdfsd',
                advertising: {},
                rssi: -45
            };
        }
    };
    
    $scope.onFavoriteChange = function() {
        $scope.devices[$scope.index] ? $scope.devices.splice($scope.index, 1) : $scope.devices.push($scope.device);
                
        window.localStorage.setItem('devices', JSON.stringify($scope.devices));
        
        $scope.added = !$scope.added;
    };
    
    $scope.init();
}])
   
.controller('renameCtrl', ['$scope', '$stateParams', '$state', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
function ($scope, $stateParams, $state) {

	var devices = JSON.parse(window.localStorage.getItem('devices')) || [];
    
    $scope.device = {
        name: 'Aucun nom' 
    };
    $scope.index = -1;
        
    for (var i = 0; i < devices.length; i++)
        if (devices[i].id == $stateParams.deviceId){
            $scope.device.name = devices[i].name;
            $scope.index = i;
            
            break;
        }

    $scope.save = function() {
        if ($scope.index > -1) {
            devices[$scope.index].name = $scope.device.name;
                        
            window.localStorage.setItem('devices', JSON.stringify(devices));
        }
        
        $state.go('menu.home');
    };
}])
   
.controller('devicesCtrl', ['$scope', '$stateParams', '$ionicHistory', '$ionicLoading', 'BLE', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
function ($scope, $stateParams, $ionicHistory, $ionicLoading, BLE) {
    
    var success = function () {
	};

	var failure = function (error) {
		alert(error);
	};

    $scope.scanning = false;
    $scope.explanation = true;
    $scope.scanDuration = parseInt(window.localStorage.getItem('scanDuration'), 10) || 5;
    $scope.devices = BLE.isDefined() ? BLE.devices : [];
    
    $scope.toggleExplanation = function() {
        $scope.explanation = !$scope.explanation;
    };
    
    $scope.finish = function() {
        $ionicHistory.goBack();
    };
    
    $scope.scan = function() {
        if (!$scope.scanning){
            $ionicLoading.show({template: '<ion-spinner icon="ripple" class="spinner-assertive"></ion-spinner>'});
            $scope.scanning = true;
            
            if (BLE.isDefined()){
                BLE.enable().then(function() {
					BLE.scan($scope.scanDuration * 1000).finally(function() {
						$ionicLoading.hide().then(function(){
							$scope.scanning = false;
						});
					});
				});
            } else {
                $scope.devices.push({
                    id: 'fsfsdfsd',
                    name: 'fsdfsd',
                    advertising: {},
                    rssi: -45
                });
				
				$ionicLoading.hide().then(function(){
                    $scope.scanning = false;
                });
            }
        }
    };
    
    $scope.scan();
}])
 