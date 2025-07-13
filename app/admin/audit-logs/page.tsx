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
import { Card, CardContent } from "@/components/ui/card";
import { 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Clock,
  User,
  FileText,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

export default function AdminAuditLogsPage() {
  const [foodIdFilter, setFoodIdFilter] = useState("");
  const [userIdFilter, setUserIdFilter] = useState("");
  const [page, setPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  
  const { data, isLoading } = api.admin.get_audit_logs.useQuery({
    page,
    limit: 20,
    food_id: foodIdFilter || undefined,
    changed_by: userIdFilter || undefined,
  });
  
  const toggleRowExpansion = (logId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedRows(newExpanded);
  };
  
  const getActionIcon = (action: string) => {
    switch (action) {
      case "create":
        return <Plus className="w-4 h-4 text-green-600" />;
      case "update":
        return <Edit className="w-4 h-4 text-blue-600" />;
      case "delete":
        return <Trash2 className="w-4 h-4 text-red-600" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };
  
  const getActionColor = (action: string) => {
    switch (action) {
      case "create":
        return "bg-green-100 text-green-800";
      case "update":
        return "bg-blue-100 text-blue-800";
      case "delete":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  const formatChanges = (oldValues: any, newValues: any) => {
    if (!oldValues) return null;
    
    const changes: string[] = [];
    const keys = new Set([...Object.keys(oldValues || {}), ...Object.keys(newValues || {})]);
    
    keys.forEach(key => {
      if (key === "updated_at" || key === "updated_by") return;
      
      const oldVal = oldValues?.[key];
      const newVal = newValues?.[key];
      
      if (oldVal !== newVal) {
        changes.push(`${key}: ${oldVal} → ${newVal}`);
      }
    });
    
    return changes;
  };
  
  return (
    <div>
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">Audit Logs</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          View all changes made to food items
        </p>
      </div>
      
      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Filter by food ID..."
            value={foodIdFilter}
            onChange={(e) => setFoodIdFilter(e.target.value)}
            className="pl-10 text-sm sm:text-base"
          />
        </div>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Filter by user ID..."
            value={userIdFilter}
            onChange={(e) => setUserIdFilter(e.target.value)}
            className="pl-10 text-sm sm:text-base"
          />
        </div>
      </div>
      
      {/* Audit Logs Table - Desktop */}
      <div className="hidden lg:block border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Food</TableHead>
              <TableHead>Changed By</TableHead>
              <TableHead>When</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data?.logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No audit logs found
                </TableCell>
              </TableRow>
            ) : (
              data?.logs.map((log: any) => {
                const isExpanded = expandedRows.has(log.id);
                const changes = log.action === "update" ? formatChanges(log.old_values, log.new_values) : null;
                
                return (
                  <>
                    <TableRow key={log.id} className="cursor-pointer" onClick={() => toggleRowExpansion(log.id)}>
                      <TableCell>
                        {log.old_values || log.new_values ? (
                          isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action)}
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                            {log.action.toUpperCase()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {log.food?.name || log.old_values?.name || log.new_values?.name || "Unknown"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ID: {log.food_id.slice(0, 8)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{log.changed_by.slice(0, 16)}...</div>
                          {log.ip_address && (
                            <div className="text-xs text-muted-foreground">
                              IP: {log.ip_address}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="w-4 h-4" />
                          <span title={format(new Date(log.changed_at), "PPpp")}>
                            {formatDistanceToNow(new Date(log.changed_at), { addSuffix: true })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.action === "update" && changes && (
                          <div className="text-xs text-muted-foreground">
                            {changes.length} field{changes.length > 1 ? "s" : ""} changed
                          </div>
                        )}
                        {log.action === "create" && (
                          <div className="text-xs text-muted-foreground">New food added</div>
                        )}
                        {log.action === "delete" && (
                          <div className="text-xs text-muted-foreground">Food removed</div>
                        )}
                      </TableCell>
                    </TableRow>
                    {isExpanded && (log.old_values || log.new_values) && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-gray-50">
                          <Card className="m-2">
                            <CardContent className="pt-4">
                              {log.action === "update" && changes && (
                                <div>
                                  <h4 className="font-medium mb-2">Changes:</h4>
                                  <ul className="space-y-1">
                                    {changes.map((change, idx) => (
                                      <li key={idx} className="text-sm font-mono">
                                        {change}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {log.action === "create" && log.new_values && (
                                <div>
                                  <h4 className="font-medium mb-2">Created with:</h4>
                                  <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
                                    {JSON.stringify(log.new_values, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.action === "delete" && log.old_values && (
                                <div>
                                  <h4 className="font-medium mb-2">Deleted data:</h4>
                                  <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
                                    {JSON.stringify(log.old_values, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.user_agent && (
                                <div className="mt-2">
                                  <span className="text-xs text-muted-foreground">
                                    User Agent: {log.user_agent}
                                  </span>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Audit Logs Cards - Mobile */}
      <div className="lg:hidden space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-sm">
            Loading...
          </div>
        ) : data?.logs.length === 0 ? (
          <div className="text-center py-8 text-sm">
            No audit logs found
          </div>
        ) : (
          data?.logs.map((log: any) => {
            const isExpanded = expandedRows.has(log.id);
            const changes = log.action === "update" ? formatChanges(log.old_values, log.new_values) : null;
            
            return (
              <div key={log.id} className="bg-white border rounded-lg p-4 space-y-3">
                {/* Action & Food */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    {getActionIcon(log.action)}
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                      {log.action.toUpperCase()}
                    </span>
                  </div>
                  {(log.old_values || log.new_values) && (
                    <button 
                      onClick={() => toggleRowExpansion(log.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                {/* Food Info */}
                <div>
                  <div className="font-medium text-sm">
                    {log.food?.name || log.old_values?.name || log.new_values?.name || "Unknown"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ID: {log.food_id.slice(0, 8)}...
                  </div>
                </div>

                {/* User & Time */}
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Changed by: </span>
                    <span className="font-medium">{log.changed_by.slice(0, 16)}...</span>
                    {log.ip_address && (
                      <span className="text-muted-foreground ml-2">IP: {log.ip_address}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span title={format(new Date(log.changed_at), "PPpp")}>
                      {formatDistanceToNow(new Date(log.changed_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="text-xs text-muted-foreground">
                  {log.action === "update" && changes && (
                    <div>{changes.length} field{changes.length > 1 ? "s" : ""} changed</div>
                  )}
                  {log.action === "create" && <div>New food added</div>}
                  {log.action === "delete" && <div>Food removed</div>}
                </div>

                {/* Expanded Details */}
                {isExpanded && (log.old_values || log.new_values) && (
                  <div className="mt-3 pt-3 border-t">
                    {log.action === "update" && changes && (
                      <div>
                        <h4 className="font-medium mb-2 text-sm">Changes:</h4>
                        <ul className="space-y-1">
                          {changes.map((change, idx) => (
                            <li key={idx} className="text-xs font-mono bg-gray-100 p-1 rounded">
                              {change}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {log.action === "create" && log.new_values && (
                      <div>
                        <h4 className="font-medium mb-2 text-sm">Created with:</h4>
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                          {JSON.stringify(log.new_values, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.action === "delete" && log.old_values && (
                      <div>
                        <h4 className="font-medium mb-2 text-sm">Deleted data:</h4>
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                          {JSON.stringify(log.old_values, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.user_agent && (
                      <div className="mt-2">
                        <span className="text-xs text-muted-foreground break-all">
                          User Agent: {log.user_agent}
                        </span>
                      </div>
                    )}
                  </div>
                )}
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
              Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.total)} of {data.total} audit logs
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