//src/pages/admin/AdminDashboard.jsx
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Thermometer,
  Droplets,
  Sun,
  Moon,
  Zap,
  Power,
  PowerOff,
  RefreshCw,
  Settings,
  Activity,
  AlertCircle,
  Flame
} from "lucide-react";
import api from "@/lib/axios";

export const AdminDashboard = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [sensorData, setSensorData] = useState(null);
  const [relayStates, setRelayStates] = useState({
    relay1: false,
    relay2: false,
    relay3: false,
    relay4: false
  });
  const [hasSensorError, setHasSensorError] = useState(false);
  const [isRelayLoading, setIsRelayLoading] = useState(false);
  const pollingRef = useRef(null);

  useEffect(() => {
    fetchData();
    // Poll sensor data every 5 seconds
    pollingRef.current = setInterval(fetchData, 5000);
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const fetchData = async () => {
    try {
      // Fetch current sensor data
      const sensorResponse = await api.get("/esp32/sensors/current");
      if (sensorResponse.data.success && sensorResponse.data.data) {
        setSensorData(sensorResponse.data.data);
        setHasSensorError(false);
      } else {
        setSensorData(null);
        setHasSensorError(true);
      }

      // Fetch relay states
      const relayResponse = await api.get("/management/relays");
      if (relayResponse.data.success && relayResponse.data.data) {
        setRelayStates(relayResponse.data.data);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        // No sensor data available
        setSensorData(null);
        setHasSensorError(true);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load sensor data. Please try again.",
        });
      }
      
      setIsLoading(false);
    }
  };

  const toggleRelay = async (relayId) => {
    try {
      setIsRelayLoading(true);
      const response = await api.post(`/management/relays/toggle/${relayId}`);
      if (response.data.success) {
        setRelayStates(response.data.data);
        toast({
          title: "Success",
          description: `Relay ${relayId} toggled successfully`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to toggle relay. Please try again.",
      });
    } finally {
      setIsRelayLoading(false);
    }
  };

  const setAllRelays = async (state) => {
    try {
      setIsRelayLoading(true);
      const response = await api.post(`/management/relays/${state ? 'all-on' : 'all-off'}`);
      if (response.data.success) {
        setRelayStates(response.data.data);
        toast({
          title: "Success",
          description: `All relays turned ${state ? 'ON' : 'OFF'} successfully`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to control relays. Please try again.",
      });
    } finally {
      setIsRelayLoading(false);
    }
  };

  const getLightStatus = () => {
    if (!sensorData || sensorData.lightLevel === undefined) {
      return { icon: Moon, text: "Unknown", color: "text-gray-500" };
    }
    return sensorData.lightLevel === 1 
      ? { icon: Sun, text: "Day", color: "text-yellow-500" }
      : { icon: Moon, text: "Night", color: "text-blue-500" };
  };

  const getFlameStatus = () => {
    if (!sensorData || sensorData.flameStatus === undefined) {
      return { icon: Flame, text: "Unknown", color: "text-gray-500" };
    }
    return sensorData.flameStatus === 1 
      ? { icon: Flame, text: "Flame Detected", color: "text-red-500" }
      : { icon: Flame, text: "No Flame", color: "text-green-500" };
  };

  const lightStatus = getLightStatus();
  const flameStatus = getFlameStatus();

  const renderSensorValue = (value, unit, fallback = "No Data") => {
    if (value === null || value === undefined) {
      return fallback;
    }
    return `${value}${unit}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Lab System Dashboard</h2>
        <div className="flex items-center gap-2">
          <Button onClick={fetchData} disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Sensor Data Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temperature</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {renderSensorValue(sensorData?.temperature, "°C", "No Data")}
            </div>
            <p className="text-xs text-muted-foreground">
              Current temperature
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Humidity</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {renderSensorValue(sensorData?.humidity, "%", "No Data")}
            </div>
            <p className="text-xs text-muted-foreground">
              Current humidity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Light Status</CardTitle>
            <lightStatus.icon className={`h-4 w-4 ${lightStatus.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${lightStatus.color}`}>
              {sensorData ? lightStatus.text : "No Data"}
            </div>
            <p className="text-xs text-muted-foreground">
              Day/Night detection
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flame Status</CardTitle>
            <flameStatus.icon className={`h-4 w-4 ${flameStatus.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${flameStatus.color}`}>
              {sensorData ? flameStatus.text : "No Data"}
            </div>
            <p className="text-xs text-muted-foreground">
              Flame detection
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${hasSensorError ? 'text-red-600' : 'text-green-600'}`}>
              {hasSensorError ? "Offline" : "Online"}
            </div>
            <p className="text-xs text-muted-foreground">
              {hasSensorError ? "ESP32 disconnected" : "ESP32 connected"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sensor Error Alert */}
      {hasSensorError && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <div>
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200">No Sensor Data Available</h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                The ESP32 device may be offline or no sensor data has been sent yet. Relay controls will still work.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Relay Control Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Individual Relay Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Relay Controls</CardTitle>
            <CardDescription>Control individual relays</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((relayId) => (
                <div key={relayId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Relay {relayId}</p>
                    <p className="text-sm text-muted-foreground">
                      {relayStates[`relay${relayId}`] ? "ON" : "OFF"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={relayStates[`relay${relayId}`] ? "default" : "outline"}
                    onClick={() => toggleRelay(relayId)}
                    disabled={isRelayLoading}
                  >
                    {relayStates[`relay${relayId}`] ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Master Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Master Controls</CardTitle>
            <CardDescription>Control all relays at once</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => setAllRelays(true)}
                disabled={isRelayLoading}
                className="h-12"
              >
                <Power className="h-4 w-4 mr-2" />
                Turn All ON
              </Button>
              <Button
                variant="outline"
                onClick={() => setAllRelays(false)}
                disabled={isRelayLoading}
                className="h-12"
              >
                <PowerOff className="h-4 w-4 mr-2" />
                Turn All OFF
              </Button>
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Current Status</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[1, 2, 3, 4].map((relayId) => (
                  <div key={relayId} className="flex justify-between">
                    <span>Relay {relayId}:</span>
                    <span className={relayStates[`relay${relayId}`] ? "text-green-600" : "text-red-600"}>
                      {relayStates[`relay${relayId}`] ? "ON" : "OFF"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>Lab system status and details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-blue-500" />
              <div>
                <p className="font-medium">ESP32 Status</p>
                <p className="text-sm text-muted-foreground">
                  {hasSensorError ? "Disconnected" : "Connected & Active"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4 text-green-500" />
              <div>
                <p className="font-medium">Sensors</p>
                <p className="text-sm text-muted-foreground">
                  {hasSensorError ? "No Data" : "DHT22, LDR Active"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-purple-500" />
              <div>
                <p className="font-medium">Relays</p>
                <p className="text-sm text-muted-foreground">4 Channels Available</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};