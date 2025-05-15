import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function MagicLinkTest() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLink, setMagicLink] = useState("");
  const { toast } = useToast();

  const requestMagicLink = async () => {
    if (!username) {
      toast({
        title: "Username required",
        description: "Please enter a username to request a magic link",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/request-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: username }), // Using email field for username
      });

      const data = await response.json();
      
      if (data.devMagicLink) {
        setMagicLink(data.devMagicLink);
        toast({
          title: "Magic link generated",
          description: "Magic link is displayed below for testing",
        });
      } else {
        toast({
          title: "Magic link requested",
          description: "If this was a real system, a magic link would be sent to your email",
        });
      }
    } catch (error) {
      console.error("Error requesting magic link:", error);
      toast({
        title: "Error",
        description: "An error occurred while requesting the magic link",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Magic Link Authentication Test</CardTitle>
          <CardDescription>
            Request a magic link to test the authentication flow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            {magicLink && (
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="magic-link">Magic Link (Development only)</Label>
                <div className="flex gap-2">
                  <Input
                    id="magic-link"
                    value={magicLink}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(magicLink);
                      toast({
                        title: "Copied",
                        description: "Magic link copied to clipboard",
                      });
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Click the link to test the login flow, or copy and paste it into your browser.
                </p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => window.location.href = "/"}>
            Back to Home
          </Button>
          <Button onClick={requestMagicLink} disabled={loading}>
            {loading ? "Requesting..." : "Request Magic Link"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}