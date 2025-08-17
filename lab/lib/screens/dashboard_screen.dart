// lib/screens/dashboard_screen.dart (New for Lab System)
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lab/providers/auth_provider.dart';
import 'package:lab/services/api_client.dart';
import 'dart:async';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final ApiClient _apiClient = ApiClient();
  Timer? _pollingTimer;

  Map<String, dynamic>? _sensorData;
  Map<String, dynamic> _relayStates = {
    'relay1': false,
    'relay2': false,
    'relay3': false,
    'relay4': false,
  };

  bool _isLoading = true;
  bool _hasSensorError = false;
  bool _isRelayLoading = false;

  @override
  void initState() {
    super.initState();
    _fetchData();
    // Poll data every 5 seconds
    _pollingTimer = Timer.periodic(
      const Duration(seconds: 5),
      (_) => _fetchData(),
    );
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchData() async {
    try {
      // Fetch sensor data
      final sensorResponse = await _apiClient.request(
        method: 'GET',
        path: '/esp32/sensors/current',
      );

      if (sensorResponse['success'] && sensorResponse['data'] != null) {
        setState(() {
          _sensorData = sensorResponse['data'];
          _hasSensorError = false;
        });
      } else {
        setState(() {
          _sensorData = null;
          _hasSensorError = true;
        });
      }

      // Fetch relay states
      final relayResponse = await _apiClient.request(
        method: 'GET',
        path: '/management/relays',
      );

      if (relayResponse['success'] && relayResponse['data'] != null) {
        setState(() {
          _relayStates = Map<String, dynamic>.from(relayResponse['data']);
        });
      }

      setState(() {
        _isLoading = false;
      });
    } catch (error) {
      setState(() {
        _sensorData = null;
        _hasSensorError = true;
        _isLoading = false;
      });
    }
  }

  Future<void> _toggleRelay(int relayId) async {
    try {
      setState(() {
        _isRelayLoading = true;
      });

      final response = await _apiClient.request(
        method: 'POST',
        path: '/management/relays/toggle/$relayId',
      );

      if (response['success'] && response['data'] != null) {
        setState(() {
          _relayStates = Map<String, dynamic>.from(response['data']);
        });
        _showSnackBar('Relay $relayId toggled successfully');
      } else {
        _showSnackBar('Failed to toggle relay', isError: true);
      }
    } catch (error) {
      _showSnackBar('Error toggling relay', isError: true);
    } finally {
      setState(() {
        _isRelayLoading = false;
      });
    }
  }

  Future<void> _setAllRelays(bool state) async {
    try {
      setState(() {
        _isRelayLoading = true;
      });

      final response = await _apiClient.request(
        method: 'POST',
        path: '/management/relays/${state ? 'all-on' : 'all-off'}',
      );

      if (response['success'] && response['data'] != null) {
        setState(() {
          _relayStates = Map<String, dynamic>.from(response['data']);
        });
        _showSnackBar('All relays turned ${state ? 'ON' : 'OFF'} successfully');
      } else {
        _showSnackBar('Failed to control relays', isError: true);
      }
    } catch (error) {
      _showSnackBar('Error controlling relays', isError: true);
    } finally {
      setState(() {
        _isRelayLoading = false;
      });
    }
  }

  void _showSnackBar(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.red : Colors.green,
      ),
    );
  }

  Widget _buildSensorCard(
    String title,
    String value,
    IconData icon,
    Color color,
  ) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Icon(icon, size: 32, color: color),
            const SizedBox(height: 8),
            Text(
              title,
              style: const TextStyle(fontSize: 14, color: Colors.grey),
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRelayCard(int relayId) {
    final isOn = _relayStates['relay$relayId'] ?? false;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Text(
              'Relay $relayId',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              isOn ? 'ON' : 'OFF',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: isOn ? Colors.green : Colors.red,
              ),
            ),
            const SizedBox(height: 8),
            ElevatedButton(
              onPressed: _isRelayLoading ? null : () => _toggleRelay(relayId),
              style: ElevatedButton.styleFrom(
                backgroundColor: isOn ? Colors.red : Colors.green,
                foregroundColor: Colors.white,
              ),
              child: Text(isOn ? 'Turn OFF' : 'Turn ON'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);

    if (!authProvider.isAuthenticated) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Navigator.pushReplacementNamed(context, '/login');
      });
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Lab System Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _isLoading ? null : _fetchData,
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await authProvider.logout();
              Navigator.pushReplacementNamed(context, '/login');
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Sensor Data Section
                  const Text(
                    'Sensor Data',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),

                  if (_hasSensorError)
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.orange.shade50,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.orange.shade200),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.warning, color: Colors.orange),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'No sensor data available. ESP32 may be offline.',
                              style: TextStyle(color: Colors.orange),
                            ),
                          ),
                        ],
                      ),
                    )
                  else
                    GridView.count(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisCount: 3,
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
                      children: [
                        _buildSensorCard(
                          'Temperature',
                          _sensorData?['temperature']?.toString() ?? 'No Data',
                          Icons.thermostat,
                          Colors.red,
                        ),
                        _buildSensorCard(
                          'Humidity',
                          '${_sensorData?['humidity']?.toString() ?? 'No Data'}%',
                          Icons.water_drop,
                          Colors.blue,
                        ),
                        _buildSensorCard(
                          'Light Status',
                          _sensorData?['lightLevel'] == 1 ? 'Day' : 'Night',
                          _sensorData?['lightLevel'] == 1
                              ? Icons.wb_sunny
                              : Icons.nightlight,
                          _sensorData?['lightLevel'] == 1
                              ? Colors.yellow
                              : Colors.indigo,
                        ),
                        _buildSensorCard(
                          'Flame Status',
                          _sensorData?['flameStatus'] == 1
                              ? 'Flame Detected'
                              : 'No Flame',
                          Icons.local_fire_department,
                          _sensorData?['flameStatus'] == 1
                              ? Colors.red
                              : Colors.green,
                        ),
                        _buildSensorCard(
                          'System Status',
                          _hasSensorError ? 'Offline' : 'Online',
                          _hasSensorError ? Icons.error : Icons.check_circle,
                          _hasSensorError ? Colors.red : Colors.green,
                        ),
                      ],
                    ),

                  const SizedBox(height: 32),

                  // Relay Control Section
                  const Text(
                    'Relay Controls',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),

                  // Master Controls
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton(
                          onPressed: _isRelayLoading
                              ? null
                              : () => _setAllRelays(true),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                          ),
                          child: const Text('Turn All ON'),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: _isRelayLoading
                              ? null
                              : () => _setAllRelays(false),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.red,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                          ),
                          child: const Text('Turn All OFF'),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Individual Relay Controls
                  GridView.count(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 2,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                    children: [
                      _buildRelayCard(1),
                      _buildRelayCard(2),
                      _buildRelayCard(3),
                      _buildRelayCard(4),
                    ],
                  ),

                  const SizedBox(height: 32),

                  // About Section
                  const Text(
                    'About',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Lab System IoT Management',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'This system manages lab equipment through IoT technology. '
                            'It monitors temperature, humidity, and light levels while '
                            'providing remote control of relays for equipment management.',
                            style: TextStyle(fontSize: 14, color: Colors.grey),
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            'Features:',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          const Text('• Real-time sensor monitoring'),
                          const Text('• Remote relay control'),
                          const Text('• Prayer time automation'),
                          const Text('• Mobile and web access'),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
