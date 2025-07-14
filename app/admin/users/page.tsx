"use client";

import { useState } from "react";
import { api } from "@/lib/trpc/provider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/lib/hooks/use-toast";
import { 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Shield,
  User,
  Calendar,
  Activity
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "user" | "admin">("all");
  const [page, setPage] = useState(1);
  
  const { data, isLoading, refetch } = api.admin.get_users.useQuery({
    page,
    limit: 20,
    search: search || undefined,
    role: roleFilter,
  });
  
  const updateRoleMutation = api.admin.update_user_role.useMutation({
    onSuccess: () => {
      toast({
        title: "Role updated",
        description: "User role has been updated successfully.",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleRoleChange = async (userId: string, newRole: "user" | "admin") => {
    await updateRoleMutation.mutateAsync({
      user_id: userId,
      role: newRole,
    });
  };
  
  return (
    <div>
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">Manage Users</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          View and manage user accounts and roles
        </p>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by username or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 text-sm sm:text-base"
          />
        </div>
        <Select 
          value={roleFilter} 
          onValueChange={(value) => setRoleFilter(value as typeof roleFilter)}
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="user">Users</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Users Table - Desktop */}
      <div className="hidden lg:block border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Stats</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data?.users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              data?.users.map((userSettings: { 
                user_id: string;
                role: string;
                daily_limit: number;
                weekly_limit: number;
                monthly_limit: number;
                tracking_period: string;
                created_at: string;
                users?: {
                  username?: string;
                  first_name?: string;
                  last_name?: string;
                  email?: string;
                  image_url?: string;
                };
              }) => {
                const user = userSettings.users;
                return (
                  <TableRow key={userSettings.user_id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {user?.image_url ? (
                          <Image 
                            src={user.image_url} 
                            alt={user.username || "User"} 
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">
                            {user?.username || user?.first_name || "Unknown"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ID: {userSettings.user_id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user?.email || "-"}</TableCell>
                    <TableCell>
                      <Select
                        value={userSettings.role}
                        onValueChange={(value) => handleRoleChange(userSettings.user_id, value as "user" | "admin")}
                        disabled={updateRoleMutation.isPending}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              User
                            </div>
                          </SelectItem>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4" />
                              Admin
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Activity className="w-4 h-4" />
                          <span className="text-muted-foreground">
                            {userSettings.daily_limit} μg/day
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {formatDistanceToNow(new Date(userSettings.created_at), { addSuffix: true })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Could add a user details modal here
                          toast({
                            title: "User Details",
                            description: "User details view coming soon",
                          });
                        }}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Users Cards - Mobile */}
      <div className="lg:hidden space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-sm">
            Loading...
          </div>
        ) : data?.users.length === 0 ? (
          <div className="text-center py-8 text-sm">
            No users found
          </div>
        ) : (
          data?.users.map((userSettings: { 
            user_id: string;
            role: string;
            daily_limit: number;
            weekly_limit: number;
            monthly_limit: number;
            tracking_period: string;
            created_at: string;
            users?: {
              username?: string;
              first_name?: string;
              last_name?: string;
              email?: string;
              image_url?: string;
            };
          }) => {
            const user = userSettings.users;
            return (
              <div key={userSettings.user_id} className="bg-white border rounded-lg p-4 space-y-3">
                {/* User Info */}
                <div className="flex items-start gap-3">
                  {user?.image_url ? (
                    <Image 
                      src={user.image_url} 
                      alt={user.username || "User"} 
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">
                      {user?.username || user?.first_name || "Unknown"}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {user?.email || "-"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ID: {userSettings.user_id.slice(0, 8)}...
                    </div>
                  </div>
                </div>

                {/* Role & Stats */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground block mb-1">Role</label>
                    <Select
                      value={userSettings.role}
                      onValueChange={(value) => handleRoleChange(userSettings.user_id, value as "user" | "admin")}
                      disabled={updateRoleMutation.isPending}
                    >
                      <SelectTrigger className="w-full h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3" />
                            User
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Shield className="w-3 h-3" />
                            Admin
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground block mb-1">Daily Limit</label>
                    <div className="flex items-center gap-1 text-xs">
                      <Activity className="w-3 h-3" />
                      <span>{userSettings.daily_limit} μg/day</span>
                    </div>
                  </div>
                </div>

                {/* Joined & Actions */}
                <div className="flex justify-between items-center pt-2 border-t">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {formatDistanceToNow(new Date(userSettings.created_at), { addSuffix: true })}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => {
                      toast({
                        title: "User Details",
                        description: "User details view coming soon",
                      });
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4">
          <p className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1">
            <span className="hidden sm:inline">
              Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.total)} of {data.total} users
            </span>
            <span className="sm:hidden">
              {((page - 1) * 20) + 1}-{Math.min(page * 20, data.total)} of {data.total}
            </span>
          </p>
          <div className="flex gap-2 order-1 sm:order-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="text-xs sm:text-sm"
            >
              <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === data.total_pages}
              className="text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">Next</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}