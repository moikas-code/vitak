"use client";

import { useEffect, useState } from "react";
import { 
  Smartphone, 
  Monitor, 
  Download, 
  Share2, 
  Plus, 
  MoreVertical,
  CheckCircle2,
  Wifi,
  Zap,
  Bell,
  Shield
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { detect_device, type DeviceInfo } from "@/lib/utils/platform-detection";
import type { BeforeInstallPromptEvent } from "@/lib/types/pwa";

export default function InstallPage() {
  const [device_info, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [deferred_prompt, setDeferredPrompt] = useState<Event | null>(null);
  const [show_install_button, setShowInstallButton] = useState(false);

  useEffect(() => {
    setDeviceInfo(detect_device());

    // Listen for beforeinstallprompt event
    const handle_before_install_prompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handle_before_install_prompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handle_before_install_prompt);
    };
  }, []);

  const handle_install_click = async () => {
    if (!deferred_prompt) return;

    const prompt = deferred_prompt as BeforeInstallPromptEvent;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;

    if (outcome === 'accepted') {
      setShowInstallButton(false);
    }
    setDeferredPrompt(null);
  };

  const get_default_tab = () => {
    if (!device_info) return "android";
    
    switch (device_info.platform) {
      case 'ios':
        return 'ios';
      case 'android':
        return 'android';
      case 'windows':
      case 'macos':
        return 'desktop';
      default:
        return 'android';
    }
  };

  if (!device_info) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Install VitaK Tracker</h1>
        <p className="text-xl text-muted-foreground mb-6">
          Get the full app experience with offline access and home screen convenience
        </p>
        
        {device_info.is_standalone && (
          <Alert className="mb-6">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Great! You&apos;re already using VitaK Tracker as an installed app.
            </AlertDescription>
          </Alert>
        )}

        {show_install_button && device_info.browser === 'chrome' && (
          <Button onClick={handle_install_click} size="lg" className="mb-6">
            <Download className="mr-2 h-5 w-5" />
            Install VitaK Tracker
          </Button>
        )}
      </div>

      {/* Benefits Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <Wifi className="h-8 w-8 mb-2 text-primary" />
            <CardTitle className="text-lg">Offline Access</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Log meals offline with encrypted local storage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <Zap className="h-8 w-8 mb-2 text-primary" />
            <CardTitle className="text-lg">Faster Loading</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Instant app launch from your home screen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <Bell className="h-8 w-8 mb-2 text-primary" />
            <CardTitle className="text-lg">Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Get reminders to log your meals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <Shield className="h-8 w-8 mb-2 text-primary" />
            <CardTitle className="text-lg">Secure & Private</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Data encrypted locally with automatic cloud sync
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Installation Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Installation Instructions</CardTitle>
          <CardDescription>
            Choose your device type for specific instructions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={get_default_tab()} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ios" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                iOS
              </TabsTrigger>
              <TabsTrigger value="android" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Android
              </TabsTrigger>
              <TabsTrigger value="desktop" className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Desktop
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ios" className="space-y-6 mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Install on iPhone/iPad</h3>
                
                {device_info.platform === 'ios' && device_info.browser !== 'safari' && (
                  <Alert>
                    <AlertDescription>
                      Please open this page in Safari to install the app on iOS.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Open in Safari</p>
                      <p className="text-sm text-muted-foreground">
                        Make sure you&apos;re using Safari browser (not Chrome or other browsers)
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Tap the Share button</p>
                      <p className="text-sm text-muted-foreground">
                        Look for the <Share2 className="inline h-4 w-4" /> icon in the Safari toolbar
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Scroll down and tap &quot;Add to Home Screen&quot;</p>
                      <p className="text-sm text-muted-foreground">
                        You might need to scroll down in the share menu to find this option
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                      4
                    </div>
                    <div>
                      <p className="font-medium">Name the app and tap &quot;Add&quot;</p>
                      <p className="text-sm text-muted-foreground">
                        The app will appear on your home screen like any other app
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="android" className="space-y-6 mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Install on Android</h3>
                
                {device_info.platform === 'android' && device_info.browser !== 'chrome' && device_info.browser !== 'samsung' && (
                  <Alert>
                    <AlertDescription>
                      For best results, use Chrome or Samsung Internet browser to install the app.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Open in Chrome</p>
                      <p className="text-sm text-muted-foreground">
                        Make sure you&apos;re using Chrome or Samsung Internet browser
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Tap the menu button</p>
                      <p className="text-sm text-muted-foreground">
                        Look for the <MoreVertical className="inline h-4 w-4" /> three dots icon
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Select &quot;Add to Home screen&quot;</p>
                      <p className="text-sm text-muted-foreground">
                        You may also see &quot;Install app&quot; at the top of the page
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                      4
                    </div>
                    <div>
                      <p className="font-medium">Confirm installation</p>
                      <p className="text-sm text-muted-foreground">
                        Tap &quot;Install&quot; or &quot;Add&quot; to complete the installation
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="desktop" className="space-y-6 mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Install on Desktop</h3>
                
                {device_info.browser !== 'chrome' && device_info.browser !== 'edge' && (
                  <Alert>
                    <AlertDescription>
                      Desktop installation works best in Chrome or Microsoft Edge browsers.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Look for the install icon</p>
                      <p className="text-sm text-muted-foreground">
                        Check the address bar for a <Plus className="inline h-4 w-4" /> or <Download className="inline h-4 w-4" /> icon
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Click the install button</p>
                      <p className="text-sm text-muted-foreground">
                        A popup will appear asking if you want to install VitaK Tracker
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Confirm installation</p>
                      <p className="text-sm text-muted-foreground">
                        Click &quot;Install&quot; to add the app to your computer
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                      4
                    </div>
                    <div>
                      <p className="font-medium">Launch from desktop or taskbar</p>
                      <p className="text-sm text-muted-foreground">
                        The app will be available in your applications menu or taskbar
                      </p>
                    </div>
                  </div>
                </div>

                <Alert>
                  <AlertDescription>
                    <strong>Alternative method:</strong> You can also go to the browser menu (three dots) and look for &quot;Install VitaK Tracker&quot; option.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-1">Is it safe to install?</h4>
            <p className="text-sm text-muted-foreground">
              Yes! VitaK Tracker is a Progressive Web App (PWA) that runs in a secure sandbox, just like your browser. Your data is encrypted and stored locally.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-1">Will it take up storage space?</h4>
            <p className="text-sm text-muted-foreground">
              The app is very lightweight (less than 5MB) and stores data efficiently on your device.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-1">Can I uninstall it later?</h4>
            <p className="text-sm text-muted-foreground">
              Yes, you can uninstall it just like any other app on your device. Long-press the icon and select uninstall or remove.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-1">Will I still get updates?</h4>
            <p className="text-sm text-muted-foreground">
              Yes! The app automatically updates in the background when you&apos;re connected to the internet.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}