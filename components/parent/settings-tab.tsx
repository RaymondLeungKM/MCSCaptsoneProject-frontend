"use client";

import { useState } from "react";
import { User, Target, Bell, Clock, Shield, Palette, Save } from "lucide-react";
import type { ChildProfile } from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ParentalControlsSettings } from "./parental-controls";

interface SettingsTabProps {
  profile: ChildProfile;
}

const interestOptions = [
  "Animals",
  "Food",
  "Colors",
  "Nature",
  "Vehicles",
  "Family",
  "Space",
  "Music",
];

export function SettingsTab({ profile }: SettingsTabProps) {
  // If we have a real child ID (not mock), use the parental controls component
  const isMockData =
    !profile.id ||
    profile.id === "1" ||
    profile.id === "mock-child-id" ||
    profile.id.length < 10;

  if (!isMockData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Settings for {profile.name}</h2>
            <p className="text-muted-foreground">
              Manage learning preferences and parental controls
            </p>
          </div>
        </div>
        <ParentalControlsSettings childId={profile.id} />
      </div>
    );
  }

  // Otherwise show the mock settings
  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(profile.age);
  const [dailyGoal, setDailyGoal] = useState(profile.dailyGoal);
  const [interests, setInterests] = useState(profile.interests);
  const [notifications, setNotifications] = useState(true);
  const [reminderTime, setReminderTime] = useState("09:00");
  const [screenTimeLimit, setScreenTimeLimit] = useState(30);
  const [parentalControls, setParentalControls] = useState(true);

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest],
    );
  };

  const handleSave = () => {
    // In a real app, this would save to the database
    console.log("[v0] Saving settings:", {
      name,
      age,
      dailyGoal,
      interests,
      notifications,
      reminderTime,
      screenTimeLimit,
      parentalControls,
    });
    alert("Settings saved!");
  };

  return (
    <div className="space-y-6">
      {/* Child Profile */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5 text-primary" />
            Child Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Child's name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                min={2}
                max={7}
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learning Goals */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="w-5 h-5 text-primary" />
            Learning Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Daily Word Goal</Label>
              <span className="font-bold text-foreground">
                {dailyGoal} words
              </span>
            </div>
            <Slider
              value={[dailyGoal]}
              onValueChange={([value]) => setDailyGoal(value)}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Set how many new words your child should learn each day.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Interests */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="w-5 h-5 text-primary" />
            Interests
          </CardTitle>
          <CardDescription>
            Select topics your child enjoys to personalize their learning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {interestOptions.map((interest) => (
              <button
                key={interest}
                onClick={() => toggleInterest(interest)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  interests.includes(interest)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="w-5 h-5 text-primary" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Daily Reminders</p>
              <p className="text-sm text-muted-foreground">
                Get reminded to practice
              </p>
            </div>
            <Switch
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>

          {notifications && (
            <div className="space-y-2">
              <Label htmlFor="reminder-time">Reminder Time</Label>
              <Input
                id="reminder-time"
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-40"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Parental Controls */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5 text-primary" />
            Parental Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Screen Time Limit</p>
              <p className="text-sm text-muted-foreground">
                Limit daily app usage
              </p>
            </div>
            <Switch
              checked={parentalControls}
              onCheckedChange={setParentalControls}
            />
          </div>

          {parentalControls && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Maximum Time</Label>
                <span className="font-bold text-foreground">
                  {screenTimeLimit} minutes
                </span>
              </div>
              <Slider
                value={[screenTimeLimit]}
                onValueChange={([value]) => setScreenTimeLimit(value)}
                min={10}
                max={60}
                step={5}
                className="w-full"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        className="w-full h-12 text-base font-bold gap-2"
        size="lg"
      >
        <Save className="w-5 h-5" />
        Save Changes
      </Button>
    </div>
  );
}
