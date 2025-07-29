import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import api from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Clock, Plus, Edit, Trash2, AlertCircle } from "lucide-react";
import { ValidationError, FormError } from "@/components/shared/ErrorComponents";
import { useFormValidation, hasFieldError } from "@/utils/errorHandling";
import { useApiRequest } from "@/hooks/useApiRequest";

export const PrayerTimesPage = () => {
  const [prayerTimes, setPrayerTimes] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPrayerTime, setSelectedPrayerTime] = useState(null);
  const [hasError, setHasError] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    hour: "",
    minute: "",
    duration: 30,
  });

  const { validationErrors, setErrors, clearErrors, clearFieldError } = useFormValidation();
  const { request, isLoading } = useApiRequest();
  const { toast } = useToast();

  const columns = [
    { accessorKey: "name", header: "Prayer Name" },
    { 
      accessorKey: "time", 
      header: "Time",
      cell: ({ row }) => {
        const prayer = row.original;
        if (!prayer || prayer.hour === undefined || prayer.minute === undefined) {
          return "Invalid Time";
        }
        const hour = prayer.hour.toString().padStart(2, '0');
        const minute = prayer.minute.toString().padStart(2, '0');
        return `${hour}:${minute}`;
      }
    },
    { 
      accessorKey: "duration", 
      header: "Duration (min)",
      cell: ({ row }) => {
        const prayer = row.original;
        return prayer?.duration || "N/A";
      }
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleEditClick(row.original)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(row.original)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  useEffect(() => {
    fetchPrayerTimes();
  }, []);

  const fetchPrayerTimes = async () => {
    try {
      const data = await request({
        method: 'GET',
        url: '/management/prayer-times'
      });
      
      if (data.success && data.data) {
        setPrayerTimes(data.data || []);
        setHasError(false);
      } else {
        setPrayerTimes([]);
        setHasError(true);
      }
    } catch (error) {
      setPrayerTimes([]);
      setHasError(true);
      // Error is already handled by the useApiRequest hook
    }
  };

  const handleAddClick = () => {
    setFormData({
      name: "",
      hour: "",
      minute: "",
      duration: 30,
    });
    clearErrors();
    setIsAddDialogOpen(true);
  };

  const handleEditClick = (prayerTime) => {
    if (!prayerTime) return;
    
    setSelectedPrayerTime(prayerTime);
    setFormData({
      name: prayerTime.name || "",
      hour: prayerTime.hour?.toString() || "",
      minute: prayerTime.minute?.toString() || "",
      duration: prayerTime.duration || 30,
    });
    clearErrors();
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (prayerTime) => {
    if (!prayerTime) return;
    
    setSelectedPrayerTime(prayerTime);
    setIsDeleteDialogOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearFieldError(name);
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearFieldError(name);
  };

  const handleAdd = async () => {
    try {
      await request(
        {
          method: 'POST',
          url: '/management/prayer-times',
          data: {
            ...formData,
            hour: parseInt(formData.hour) || 0,
            minute: parseInt(formData.minute) || 0,
            duration: parseInt(formData.duration) || 30,
          }
        },
        {
          successMessage: "Prayer time added successfully",
          onSuccess: () => {
            fetchPrayerTimes();
            setIsAddDialogOpen(false);
          },
          onError: (errors) => setErrors(errors)
        }
      );
    } catch (error) {
      // Errors are already handled by the request hook
    }
  };

  const handleEdit = async () => {
    if (!selectedPrayerTime?._id) return;
    
    try {
      await request(
        {
          method: 'PUT',
          url: `/management/prayer-times/${selectedPrayerTime._id}`,
          data: {
            ...formData,
            hour: parseInt(formData.hour) || 0,
            minute: parseInt(formData.minute) || 0,
            duration: parseInt(formData.duration) || 30,
          }
        },
        {
          successMessage: "Prayer time updated successfully",
          onSuccess: () => {
            fetchPrayerTimes();
            setIsEditDialogOpen(false);
          },
          onError: (errors) => setErrors(errors)
        }
      );
    } catch (error) {
      // Errors are already handled by the request hook
    }
  };

  const handleDelete = async () => {
    if (!selectedPrayerTime?._id) return;
    
    try {
      await request(
        {
          method: 'DELETE',
          url: `/management/prayer-times/${selectedPrayerTime._id}`
        },
        {
          successMessage: "Prayer time deleted successfully",
          onSuccess: () => {
            fetchPrayerTimes();
            setIsDeleteDialogOpen(false);
          }
        }
      );
    } catch (error) {
      // Errors are already handled by the request hook
    }
  };

  const renderFormField = (label, name, type = "text", options = null) => {
    const hasError = hasFieldError(validationErrors, name);
    const errorClass = hasError ? 'border-destructive' : '';
    
    return (
      <div className="space-y-2">
        <Label htmlFor={name}>{label}</Label>
        {options ? (
          <Select
            value={formData[name] || ""}
            onValueChange={(value) => handleSelectChange(name, value)}
          >
            <SelectTrigger className={errorClass}>
              <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map(option => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id={name}
            name={name}
            type={type}
            value={formData[name] || ""}
            onChange={handleInputChange}
            className={errorClass}
          />
        )}
        <ValidationError message={validationErrors[name]} />
      </div>
    );
  };

  const generateHourOptions = () => {
    return Array.from({ length: 24 }, (_, i) => ({
      value: i.toString(),
      label: i.toString().padStart(2, '0')
    }));
  };

  const generateMinuteOptions = () => {
    return Array.from({ length: 60 }, (_, i) => ({
      value: i.toString(),
      label: i.toString().padStart(2, '0')
    }));
  };

  const generateDurationOptions = () => {
    return [
      { value: "15", label: "15 minutes" },
      { value: "30", label: "30 minutes" },
      { value: "45", label: "45 minutes" },
      { value: "60", label: "1 hour" },
      { value: "90", label: "1.5 hours" },
      { value: "120", label: "2 hours" },
    ];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Prayer Times Management</h2>
        <Button onClick={handleAddClick}>
          <Plus className="h-4 w-4 mr-2" />
          Add Prayer Time
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Manage prayer times for automatic relay control</span>
        </div>
      </div>

      {/* Error Alert */}
      {hasError && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <div>
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200">No Prayer Times Available</h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                No prayer times have been configured yet. Add prayer times to enable automatic relay control.
              </p>
            </div>
          </div>
        </div>
      )}

      <DataTable 
        columns={columns} 
        data={prayerTimes} 
        isLoading={isLoading} 
        noResultsMessage="No prayer times found"
      />

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) clearErrors();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Prayer Time</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleAdd(); }}>
            <FormError error={validationErrors.general} />
            {renderFormField("Prayer Name", "name")}
            <div className="grid grid-cols-2 gap-4">
              {renderFormField("Hour", "hour", null, generateHourOptions())}
              {renderFormField("Minute", "minute", null, generateMinuteOptions())}
            </div>
            {renderFormField("Duration", "duration", null, generateDurationOptions())}
          </form>
          <DialogFooter>
            <Button onClick={handleAdd} disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Prayer Time"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) clearErrors();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Prayer Time</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleEdit(); }}>
            <FormError error={validationErrors.general} />
            {renderFormField("Prayer Name", "name")}
            <div className="grid grid-cols-2 gap-4">
              {renderFormField("Hour", "hour", null, generateHourOptions())}
              {renderFormField("Minute", "minute", null, generateMinuteOptions())}
            </div>
            {renderFormField("Duration", "duration", null, generateDurationOptions())}
          </form>
          <DialogFooter>
            <Button onClick={handleEdit} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Prayer Time</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete the prayer time "{selectedPrayerTime?.name || 'Unknown'}"?</p>
          {validationErrors.general && (
            <FormError error={validationErrors.general} />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 