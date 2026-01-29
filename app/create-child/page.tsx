"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createChild } from "@/lib/api";

const avatars = ["👧", "👦", "👶", "🧒", "👨", "👩"];

export default function CreateChildPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [age, setAge] = useState("4");
  const [avatar, setAvatar] = useState("👧");
  const [learningStyle, setLearningStyle] = useState<
    "visual" | "auditory" | "kinesthetic" | "mixed"
  >("mixed");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await createChild({
        name,
        age: parseInt(age),
        avatar,
        learning_style: learningStyle,
        daily_goal: 5,
        attention_span: 15,
      });

      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to create child profile");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-white to-coral-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Create Child Profile
          </CardTitle>
          <CardDescription className="text-center">
            Let's set up a profile for your little learner
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Child's Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Emma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Select value={age} onValueChange={setAge} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select age" />
                </SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 5, 6].map((a) => (
                    <SelectItem key={a} value={a.toString()}>
                      {a} years old
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Avatar</Label>
              <div className="flex gap-2">
                {avatars.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setAvatar(av)}
                    className={`text-4xl p-2 rounded-lg transition-all ${
                      avatar === av
                        ? "bg-primary/20 scale-110 ring-2 ring-primary"
                        : "hover:bg-gray-100"
                    }`}
                    disabled={loading}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="learningStyle">Learning Style</Label>
              <Select
                value={learningStyle}
                onValueChange={(value: any) => setLearningStyle(value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select learning style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visual">
                    Visual (Pictures & Colors)
                  </SelectItem>
                  <SelectItem value="auditory">
                    Auditory (Sounds & Stories)
                  </SelectItem>
                  <SelectItem value="kinesthetic">
                    Kinesthetic (Movement & Actions)
                  </SelectItem>
                  <SelectItem value="mixed">Mixed (All Styles)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Profile"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
