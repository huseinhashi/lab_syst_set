import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import api from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Users, ShieldAlert, AlertCircle } from "lucide-react";
import { ValidationError, FormError } from "@/components/shared/ErrorComponents";
import { useFormValidation, hasFieldError } from "@/utils/errorHandling";
import { useApiRequest } from "@/hooks/useApiRequest";

export const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("user");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [hasError, setHasError] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
  });

  const { validationErrors, setErrors, clearErrors, clearFieldError } = useFormValidation();
  const { request, isLoading } = useApiRequest();
  const { toast } = useToast();

  const columns = [
    { 
      accessorKey: "username", 
      header: "Username",
      cell: ({ row }) => {
        const user = row.original;
        return user?.username || "Unknown";
      }
    },
    { 
      accessorKey: "email", 
      header: "Email",
      cell: ({ row }) => {
        const user = row.original;
        return user?.email || "No Email";
      }
    },
    { 
      accessorKey: "role", 
      header: "Role",
      cell: ({ row }) => {
        const role = row.original?.role;
        if (!role) return "Unknown";
        
        return (
          <div className={`px-2 py-1 rounded text-xs font-medium inline-block
              ${role === "admin" ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" : 
              "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"}`}>
            {role === "admin" ? "Administrator" : "User"}
          </div>
        );
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;
        if (!user) return null;
        
        return (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => handleEditClick(user)}>
              Edit
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(user)}>
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, users, activeTab]);

  const fetchUsers = async () => {
    try {
      const data = await request({
        method: 'GET',
        url: '/users'
      });
      
      if (data.success && data.data) {
        setUsers(data.data || []);
        setHasError(false);
      } else {
        setUsers([]);
        setHasError(true);
      }
    } catch (error) {
      setUsers([]);
      setHasError(true);
      // Error is already handled by the useApiRequest hook
    }
  };

  const filterUsers = () => {
    const filtered = users.filter((user) => {
      if (!user) return false;
      
      const matchesSearch = 
        (user.username?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || 
        (user.email?.toLowerCase() || "").includes(searchTerm.toLowerCase());
      const matchesRole = user.role === activeTab;
      return matchesSearch && matchesRole;
    });
    setFilteredUsers(filtered);
  };

  const handleAddClick = () => {
    setFormData({
      username: "",
      email: "",
      password: "",
      role: activeTab,
    });
    clearErrors();
    setIsAddDialogOpen(true);
  };

  const handleEditClick = (user) => {
    if (!user) return;
    
    setSelectedUser(user);
    setFormData({
      username: user.username || "",
      email: user.email || "",
      password: "", // Always reset password field when editing
      role: user.role || "user"
    });
    clearErrors();
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (user) => {
    if (!user) return;
    
    setSelectedUser(user);
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
          url: '/users',
          data: formData
        },
        {
          successMessage: `${formData.role === 'admin' ? 'Administrator' : 'User'} added successfully`,
          onSuccess: () => {
            fetchUsers();
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
    if (!selectedUser?._id) return;
    
    try {
      const updatedData = { ...formData };
      if (!updatedData.password) {
        delete updatedData.password; // Remove password if it's blank
      }

      await request(
        {
          method: 'PUT',
          url: `/users/${selectedUser._id}`,
          data: updatedData
        },
        {
          successMessage: `${updatedData.role === 'admin' ? 'Administrator' : 'User'} updated successfully`,
          onSuccess: () => {
            fetchUsers();
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
    if (!selectedUser?._id) return;
    
    try {
      await request(
        {
          method: 'DELETE',
          url: `/users/${selectedUser._id}`
        },
        {
          successMessage: `${selectedUser.role === 'admin' ? 'Administrator' : 'User'} deleted successfully`,
          onSuccess: () => {
            fetchUsers();
            setIsDeleteDialogOpen(false);
          }
        }
      );
    } catch (error) {
      // Errors are already handled by the request hook
    }
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
    setSearchTerm(""); // Reset search when changing tabs
    filterUsers(); // Re-filter with new tab
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
            placeholder={type === "password" && name === "password" && isEditDialogOpen 
              ? "Enter new password or leave blank" 
              : ""}
          />
        )}
        <ValidationError message={validationErrors[name]} />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
        <Button onClick={handleAddClick}>
          Add {activeTab === "admin" ? "Administrator" : "User"}
        </Button>
      </div>

      {/* Error Alert */}
      {hasError && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <div>
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200">No Users Available</h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                No users have been created yet. Add users to manage the system.
              </p>
            </div>
          </div>
        </div>
      )}

      <Tabs defaultValue="user" onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="user" className="flex gap-2 items-center">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex gap-2 items-center">
            <ShieldAlert className="h-4 w-4" />
            Administrators
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-4 mb-4">
          <Input
            placeholder={`Search ${activeTab === 'admin' ? 'administrators' : 'users'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <TabsContent value="user">
          <DataTable 
            columns={columns} 
            data={filteredUsers} 
            isLoading={isLoading} 
            noResultsMessage="No users found"
          />
        </TabsContent>
        
        <TabsContent value="admin">
          <DataTable 
            columns={columns} 
            data={filteredUsers} 
            isLoading={isLoading} 
            noResultsMessage="No administrators found"
          />
        </TabsContent>
      </Tabs>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) clearErrors();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {formData.role === 'admin' ? 'Administrator' : 'User'}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleAdd(); }}>
            <FormError error={validationErrors.general} />
            {renderFormField("Username", "username")}
            {renderFormField("Email", "email", "email")}
            {renderFormField("Role", "role", null, [
              { value: "user", label: "User" },
              { value: "admin", label: "Administrator" }
            ])}
            {renderFormField("Password", "password", "password")}
          </form>
          <DialogFooter>
            <Button onClick={handleAdd} disabled={isLoading}>
              {isLoading ? "Adding..." : "Add"}
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
            <DialogTitle>Edit {formData.role === 'admin' ? 'Administrator' : 'User'}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleEdit(); }}>
            <FormError error={validationErrors.general} />
            {renderFormField("Username", "username")}
            {renderFormField("Email", "email", "email")}
            {renderFormField("Role", "role", null, [
              { value: "user", label: "User" },
              { value: "admin", label: "Administrator" }
            ])}
            {renderFormField("New Password (leave blank to keep current)", "password", "password")}
          </form>
          <DialogFooter>
            <Button onClick={handleEdit} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedUser?.role === 'admin' ? 'Administrator' : 'User'}</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete {selectedUser?.username || 'Unknown User'}?</p>
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