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
        duration: const Duration(seconds: 2),
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
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Container(
        padding: const EdgeInsets.all(12),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 28, color: color),
            const SizedBox(height: 8),
            Text(
              title,
              style: const TextStyle(
                fontSize: 12,
                color: Colors.grey,
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRelayCard(int relayId) {
    final isOn = _relayStates['relay$relayId'] ?? false;

    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Container(
        padding: const EdgeInsets.all(12),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Relay $relayId',
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: isOn ? Colors.green.shade100 : Colors.red.shade100,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                isOn ? 'ON' : 'OFF',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: isOn ? Colors.green.shade800 : Colors.red.shade800,
                ),
              ),
            ),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isRelayLoading ? null : () => _toggleRelay(relayId),
                style: ElevatedButton.styleFrom(
                  backgroundColor: isOn ? Colors.red : Colors.green,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: Text(
                  isOn ? 'Turn OFF' : 'Turn ON',
                  style: const TextStyle(fontSize: 12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;

    if (!authProvider.isAuthenticated) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Navigator.pushReplacementNamed(context, '/login');
      });
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Lab System Dashboard'),
        elevation: 2,
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
          : RefreshIndicator(
              onRefresh: _fetchData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Sensor Data Section
                    const Text(
                      'Sensor Data',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),

                    if (_hasSensorError)
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.orange.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.orange.shade200),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.warning, color: Colors.orange, size: 20),
                            SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'No sensor data available. ESP32 may be offline.',
                                style: TextStyle(
                                  color: Colors.orange,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                          ],
                        ),
                      )
                    else
                      LayoutBuilder(
                        builder: (context, constraints) {
                          // Responsive grid based on available width
                          int crossAxisCount = 2;
                          double childAspectRatio = 1.2;

                          if (constraints.maxWidth > 600) {
                            crossAxisCount = 3;
                            childAspectRatio = 1.0;
                          }

                          return GridView.count(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            crossAxisCount: crossAxisCount,
                            childAspectRatio: childAspectRatio,
                            crossAxisSpacing: 12,
                            mainAxisSpacing: 12,
                            children: [
                              _buildSensorCard(
                                'Temperature',
                                '${_sensorData?['temperature']?.toString() ?? 'No Data'}°C',
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
                                _sensorData?['lightLevel'] == 1
                                    ? 'Day'
                                    : 'Night',
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
                                _hasSensorError
                                    ? Icons.error
                                    : Icons.check_circle,
                                _hasSensorError ? Colors.red : Colors.green,
                              ),
                            ],
                          );
                        },
                      ),

                    const SizedBox(height: 24),

                    // Relay Control Section
                    const Text(
                      'Relay Controls',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Master Controls
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: _isRelayLoading
                                ? null
                                : () => _setAllRelays(true),
                            icon: const Icon(Icons.power, size: 18),
                            label: const Text(
                              'All ON',
                              style: TextStyle(fontSize: 12),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.green,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: _isRelayLoading
                                ? null
                                : () => _setAllRelays(false),
                            icon: const Icon(Icons.power_off, size: 18),
                            label: const Text(
                              'All OFF',
                              style: TextStyle(fontSize: 12),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.red,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 16),

                    // Individual Relay Controls
                    LayoutBuilder(
                      builder: (context, constraints) {
                        int crossAxisCount = 2;
                        double childAspectRatio = 1.1;

                        if (constraints.maxWidth > 600) {
                          crossAxisCount = 4;
                          childAspectRatio = 0.8;
                        }

                        return GridView.count(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          crossAxisCount: crossAxisCount,
                          childAspectRatio: childAspectRatio,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                          children: [
                            _buildRelayCard(1),
                            _buildRelayCard(2),
                            _buildRelayCard(3),
                            _buildRelayCard(4),
                          ],
                        );
                      },
                    ),

                    const SizedBox(height: 24),

                    // About Section
                    const Text(
                      'About',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Card(
                      elevation: 2,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Lab System IoT Management',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 8),
                            const Text(
                              'This system manages lab equipment through IoT technology. '
                              'It monitors temperature, humidity, and light levels while '
                              'providing remote control of relays for equipment management.',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey,
                              ),
                            ),
                            const SizedBox(height: 12),
                            const Text(
                              'Features:',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              '• Real-time sensor monitoring',
                              style: TextStyle(fontSize: 12),
                            ),
                            const Text(
                              '• Remote relay control',
                              style: TextStyle(fontSize: 12),
                            ),
                            const Text(
                              '• Prayer time automation',
                              style: TextStyle(fontSize: 12),
                            ),
                            const Text(
                              '• Mobile and web access',
                              style: TextStyle(fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    ),

                    // Add some bottom padding for better scrolling
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
    );
  }
}
