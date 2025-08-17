//src/pages/admin/WorkingHoursPage.jsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Clock, Save, RefreshCw, AlertCircle } from "lucide-react";
import { useApiRequest } from "@/hooks/useApiRequest";

export const WorkingHoursPage = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [workingHours, setWorkingHours] = useState({
    name: "Working Hours",
    startHour: 8,
    startMinute: 0,
    endHour: 17,
    endMinute: 0,
    isActive: true
  });

  const { request, isLoading: requestLoading } = useApiRequest();

  useEffect(() => {
    fetchWorkingHours();
  }, []);

  const fetchWorkingHours = async () => {
    try {
      setIsLoading(true);
      const data = await request({
        method: 'GET',
        url: '/management/working-hours'
      });
      
      if (data.success && data.data) {
        setWorkingHours(data.data);
      }
    } catch (error) {
      console.error("Error fetching working hours:", error);
      // Error is already handled by the useApiRequest hook
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await request(
        {
          method: 'POST',
          url: '/management/working-hours',
          data: workingHours
        },
        {
          successMessage: "Working hours updated successfully",
          onSuccess: (data) => {
            setWorkingHours(data.data);
          }
        }
      );
    } catch (error) {
      console.error("Error updating working hours:", error);
      // Error is already handled by the useApiRequest hook
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setWorkingHours(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatTime = (hour, minute) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const getCurrentStatus = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentMinutes = currentHour * 60 + currentMinute;
    const startMinutes = workingHours.startHour * 60 + workingHours.startMinute;
    const endMinutes = workingHours.endHour * 60 + workingHours.endMinute;
    
    if (!workingHours.isActive) return { status: "Disabled", color: "text-gray-500" };
    if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
      return { status: "Within Working Hours", color: "text-green-600" };
    } else {
      return { status: "Outside Working Hours", color: "text-red-600" };
    }
  };

  const currentStatus = getCurrentStatus();

  if (isLoading || requestLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Working Hours Management</h2>
          <p className="text-muted-foreground">
            Configure the working hours for the lab system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchWorkingHours} disabled={isLoading || requestLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Working Hours Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Working Hours Configuration
            </CardTitle>
            <CardDescription>
              Set the start and end times for working hours
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={workingHours.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Working Hours"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startHour">Start Hour</Label>
                <Input
                  id="startHour"
                  type="number"
                  min="0"
                  max="23"
                  value={workingHours.startHour}
                  onChange={(e) => handleInputChange('startHour', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startMinute">Start Minute</Label>
                <Input
                  id="startMinute"
                  type="number"
                  min="0"
                  max="59"
                  value={workingHours.startMinute}
                  onChange={(e) => handleInputChange('startMinute', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="endHour">End Hour</Label>
                <Input
                  id="endHour"
                  type="number"
                  min="0"
                  max="23"
                  value={workingHours.endHour}
                  onChange={(e) => handleInputChange('endHour', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endMinute">End Minute</Label>
                <Input
                  id="endMinute"
                  type="number"
                  min="0"
                  max="59"
                  value={workingHours.endMinute}
                  onChange={(e) => handleInputChange('endMinute', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={workingHours.isActive}
                onCheckedChange={(checked) => handleInputChange('isActive', checked)}
              />
              <Label htmlFor="isActive">Enable Working Hours</Label>
            </div>

            <Button 
              onClick={handleSave} 
              disabled={isSaving || requestLoading}
              className="w-full"
            >
              {isSaving || requestLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
            <CardDescription>
              Real-time working hours status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div>
                  <p className="font-medium">Status</p>
                  <p className={`text-sm font-semibold ${currentStatus.color}`}>
                    {currentStatus.status}
                  </p>
                </div>
                <AlertCircle className={`h-5 w-5 ${currentStatus.color}`} />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Start Time:</span>
                  <span className="font-medium">
                    {formatTime(workingHours.startHour, workingHours.startMinute)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">End Time:</span>
                  <span className="font-medium">
                    {formatTime(workingHours.endHour, workingHours.endMinute)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Duration:</span>
                  <span className="font-medium">
                    {Math.floor(((workingHours.endHour * 60 + workingHours.endMinute) - 
                      (workingHours.startHour * 60 + workingHours.startMinute)) / 60)}h 
                    {((workingHours.endHour * 60 + workingHours.endMinute) - 
                      (workingHours.startHour * 60 + workingHours.startMinute)) % 60}m
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-200">How it works</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    When working hours are enabled, relay controls will only work during the specified time period. 
                    Outside working hours, relay changes will be blocked by the ESP32 device.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
