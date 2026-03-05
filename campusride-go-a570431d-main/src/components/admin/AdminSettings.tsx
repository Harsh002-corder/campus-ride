import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Settings, Save, RefreshCw } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { useAppToast } from "@/hooks/use-app-toast";

interface SettingRow {
  id: string;
  key: string;
  value: unknown;
  description?: string | null;
  updatedAt?: string | null;
}

type RideSettingType = "boolean" | "number" | "text";

interface RideSettingField {
  key: string;
  label: string;
  type: RideSettingType;
  description: string;
  defaultValue: boolean | number | string;
  min?: number;
  max?: number;
  step?: number;
}

const rideSettingFields: RideSettingField[] = [
  {
    key: "ride_booking_enabled",
    label: "Allow ride booking",
    type: "boolean",
    description: "Enable or disable new ride requests platform-wide.",
    defaultValue: true,
  },
  {
    key: "ride_max_passengers",
    label: "Maximum passengers per ride",
    type: "number",
    description: "Upper limit for rider count in one booking.",
    defaultValue: 4,
    min: 1,
    max: 6,
    step: 1,
  },
  {
    key: "ride_cancellation_window_minutes",
    label: "Cancellation window (minutes)",
    type: "number",
    description: "Minutes after request when cancellation is allowed without escalation.",
    defaultValue: 10,
    min: 0,
    max: 120,
    step: 1,
  },
  {
    key: "ride_location_sync_interval_seconds",
    label: "Driver GPS sync interval (seconds)",
    type: "number",
    description: "Recommended interval for live location updates during active rides.",
    defaultValue: 5,
    min: 1,
    max: 60,
    step: 1,
  },
  {
    key: "ride_support_phone",
    label: "Ride support contact",
    type: "text",
    description: "Support number shown to users for ride emergencies.",
    defaultValue: "+91 90000 00000",
  },
  {
    key: "ride_security_phone",
    label: "Campus security contact",
    type: "text",
    description: "Security helpline shown in emergency contacts.",
    defaultValue: "+91 100",
  },
  {
    key: "ride_ambulance_phone",
    label: "Ambulance contact",
    type: "text",
    description: "Medical emergency number shown in emergency contacts.",
    defaultValue: "+91 108",
  },
];

const coerceSettingValue = (rawValue: unknown, field: RideSettingField) => {
  if (field.type === "boolean") {
    if (typeof rawValue === "boolean") return rawValue;
    if (typeof rawValue === "string") return rawValue.toLowerCase() === "true";
    return Boolean(field.defaultValue);
  }

  if (field.type === "number") {
    if (typeof rawValue === "number" && Number.isFinite(rawValue)) return rawValue;
    const parsed = Number(rawValue);
    if (Number.isFinite(parsed)) return parsed;
    return Number(field.defaultValue);
  }

  if (typeof rawValue === "string") return rawValue;
  if (rawValue === null || rawValue === undefined) return String(field.defaultValue);
  return JSON.stringify(rawValue);
};

const AdminSettings = () => {
  const toast = useAppToast();
  const [settings, setSettings] = useState<SettingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rideSettings, setRideSettings] = useState<Record<string, boolean | number | string>>({});

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.settings.list() as { settings: SettingRow[] };
      const rows = response.settings || [];
      setSettings(rows);

      const settingsMap = new Map(rows.map((row) => [row.key, row.value]));
      const nextRideSettings = rideSettingFields.reduce<Record<string, boolean | number | string>>((acc, field) => {
        acc[field.key] = coerceSettingValue(settingsMap.get(field.key), field);
        return acc;
      }, {});
      setRideSettings(nextRideSettings);
    } catch (error) {
      toast.error("Unable to load app settings", error, "Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    let mounted = true;

    if (mounted) {
      void loadSettings();
    }

    return () => {
      mounted = false;
    };
  }, [loadSettings]);

  const setRideSettingValue = (key: string, value: boolean | number | string) => {
    setRideSettings((prev) => ({ ...prev, [key]: value }));
  };

  const saveRideSettings = async () => {
    setSaving(true);
    try {
      await Promise.all(
        rideSettingFields.map((field) =>
          apiClient.settings.update({
            key: field.key,
            value: rideSettings[field.key],
            description: field.description,
          }),
        ),
      );

      toast.success("Ride settings saved", "All ride management settings were updated successfully.");
      await loadSettings();
    } catch (error) {
      toast.error("Could not save ride settings", error, "Please review your values and retry.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display mb-1">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage ride behavior and live app configuration from database</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-glass"
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Ride Controls</h3>
              <p className="text-xs text-muted-foreground">{rideSettingFields.length} ride settings</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadSettings()}
              disabled={loading || saving}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-muted/50 hover:bg-muted text-muted-foreground transition-colors flex items-center gap-1 disabled:opacity-60"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <button
              type="button"
              onClick={() => void saveRideSettings()}
              disabled={saving || loading}
              className="btn-primary-gradient px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 disabled:opacity-60"
            >
              <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save Ride Settings"}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {rideSettingFields.map((field) => {
            const value = rideSettings[field.key] ?? field.defaultValue;
            const enabled = value === true;
            return (
              <div key={field.key} className="py-3 border-b border-border/50 last:border-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">{field.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{field.description}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Key: {field.key}</p>
                  </div>

                  <div className="shrink-0 min-w-[160px]">
                    {field.type === "boolean" && (
                      <button
                        type="button"
                        onClick={() => setRideSettingValue(field.key, !enabled)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors w-full ${
                          enabled
                            ? "bg-green-500/20 text-green-400"
                            : "bg-destructive/20 text-destructive"
                        }`}
                      >
                        {enabled ? "Enabled" : "Disabled"}
                      </button>
                    )}

                    {field.type === "number" && (
                      <input
                        type="number"
                        title={field.label}
                        placeholder={field.label}
                        value={Number(value)}
                        min={field.min}
                        max={field.max}
                        step={field.step || 1}
                        onChange={(event) => setRideSettingValue(field.key, Number(event.target.value))}
                        className="w-full bg-muted/50 border border-border rounded-xl py-2 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    )}

                    {field.type === "text" && (
                      <input
                        type="text"
                        title={field.label}
                        placeholder={field.label}
                        value={String(value)}
                        onChange={(event) => setRideSettingValue(field.key, event.target.value)}
                        className="w-full bg-muted/50 border border-border rounded-xl py-2 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-glass"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">App Settings</h3>
            <p className="text-xs text-muted-foreground">{loading ? "Loading..." : `${settings.length} keys loaded`}</p>
          </div>
        </div>

        <div className="space-y-2">
          {settings.length === 0 && <div className="text-sm text-muted-foreground">No settings found in database</div>}
          {settings.map((item) => (
            <div key={item.id} className="py-3 border-b border-border/50 last:border-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">{item.key}</span>
                <span className="text-xs font-medium text-foreground text-right break-all">{typeof item.value === "string" ? item.value : JSON.stringify(item.value)}</span>
              </div>
              {item.description && <p className="text-[11px] text-muted-foreground mt-1">{item.description}</p>}
              <p className="text-[10px] text-muted-foreground mt-1">Updated: {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "—"}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminSettings;
