"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/trpc/provider";
import { useToast } from "@/lib/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { DonateButton } from "@/components/donate/donate-button";

const settings_schema = z.object({
  daily_limit: z.number().positive("Daily limit must be positive"),
  weekly_limit: z.number().positive("Weekly limit must be positive"),
  monthly_limit: z.number().positive("Monthly limit must be positive"),
  tracking_period: z.enum(["daily", "weekly", "monthly"]),
});

type SettingsForm = z.infer<typeof settings_schema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const { data: settings, isLoading } = api.user.getSettings.useQuery();
  const utils = api.useUtils();

  const updateSettings = api.user.updateSettings.useMutation({
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Your Vitamin K limits have been saved.",
      });
      utils.user.getSettings.invalidate();
      utils.credit.getAllBalances.invalidate();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SettingsForm>({
    resolver: zodResolver(settings_schema),
    defaultValues: settings ? {
      daily_limit: settings.daily_limit,
      weekly_limit: settings.weekly_limit,
      monthly_limit: settings.monthly_limit,
      tracking_period: settings.tracking_period,
    } : undefined,
  });

  const onSubmit = (data: SettingsForm) => {
    updateSettings.mutate(data);
  };


  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your Vitamin K limits and preferences
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            Manage your account settings
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <UserButton />
          <div>
            <p className="text-sm font-medium">Manage your Clerk account</p>
            <p className="text-sm text-muted-foreground">
              Update profile, email, and security settings
            </p>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Vitamin K Limits</CardTitle>
            <CardDescription>
              Set your daily, weekly, and monthly Vitamin K limits in micrograms (mcg)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="daily_limit">Daily Limit (mcg)</Label>
                <Input
                  id="daily_limit"
                  type="number"
                  step="1"
                  {...register("daily_limit", { valueAsNumber: true })}
                  defaultValue={settings?.daily_limit}
                />
                {errors.daily_limit && (
                  <p className="text-sm text-destructive">
                    {errors.daily_limit.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="weekly_limit">Weekly Limit (mcg)</Label>
                <Input
                  id="weekly_limit"
                  type="number"
                  step="1"
                  {...register("weekly_limit", { valueAsNumber: true })}
                  defaultValue={settings?.weekly_limit}
                />
                {errors.weekly_limit && (
                  <p className="text-sm text-destructive">
                    {errors.weekly_limit.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthly_limit">Monthly Limit (mcg)</Label>
                <Input
                  id="monthly_limit"
                  type="number"
                  step="1"
                  {...register("monthly_limit", { valueAsNumber: true })}
                  defaultValue={settings?.monthly_limit}
                />
                {errors.monthly_limit && (
                  <p className="text-sm text-destructive">
                    {errors.monthly_limit.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tracking_period">Primary Tracking Period</Label>
              <Select
                defaultValue={settings?.tracking_period}
                onValueChange={(value) => setValue("tracking_period", value as "daily" | "weekly" | "monthly")}
              >
                <SelectTrigger id="tracking_period">
                  <SelectValue placeholder="Select tracking period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                This determines which period is highlighted on your dashboard
              </p>
            </div>

            <Button type="submit" disabled={updateSettings.isPending}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Recommended Limits</CardTitle>
          <CardDescription>
            General guidelines for Vitamin K intake on warfarin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">
            Most patients on warfarin are advised to maintain consistent Vitamin K intake:
          </p>
          <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
            <li>Daily: 80-120 mcg</li>
            <li>Weekly: 560-840 mcg</li>
            <li>Monthly: 2,400-3,600 mcg</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-4">
            Note: These are general guidelines. Always consult with your healthcare
            provider to determine the appropriate limits for your specific situation.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Support VitaK Tracker</CardTitle>
          <CardDescription>
            Help keep VitaK Tracker free for everyone
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            VitaK Tracker is a free service built to help warfarin patients
            manage their Vitamin K intake. Your support helps cover hosting
            costs and future development.
          </p>
          <DonateButton />
        </CardContent>
      </Card>
    </div>
  );
}