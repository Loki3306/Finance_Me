import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch } from "@/lib/api";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<any>({ currency: 'INR', dateFormat: 'DD/MM/YYYY', fiscalYearStart: 'April', dashboardWidgets: ['netWorth','quickStats','spendingChart','recentActivity'], notifications: { budgetAlerts: true, goalReminders: true, weeklyReports: false }, privacy: { dataRetention: 365, shareAnalytics: false } });

  useEffect(() => { (async () => { try { const res = await apiFetch('/api/settings/preferences'); if (res.ok) { const d = await res.json(); setPrefs({ ...prefs, ...(d?.preferences||{}) }); } } finally { setLoading(false); } })(); }, []);

  async function save() {
    setSaving(true);
    await apiFetch('/api/settings/preferences', { method: 'PUT', body: JSON.stringify({ preferences: prefs }) });
    setSaving(false);
  }

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="grid gap-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
        <div className="text-sm text-muted-foreground">{saving ? 'Saving…' : 'Saved'}</div>
      </div>

      <section className="rounded-xl border p-4">
        <h2 className="font-semibold mb-3">Financial Preferences</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm">Currency</label>
            <Input value={prefs.currency} onChange={(e)=>setPrefs({ ...prefs, currency: e.target.value })} />
          </div>
          <div>
            <label className="text-sm">Date Format</label>
            <Select value={prefs.dateFormat} onValueChange={(v)=>setPrefs({ ...prefs, dateFormat: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm">Fiscal Year Start</label>
            <Select value={prefs.fiscalYearStart} onValueChange={(v)=>setPrefs({ ...prefs, fiscalYearStart: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="April">April</SelectItem>
                <SelectItem value="January">January</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between border rounded-lg p-3">
            <div>
              <div className="font-medium">Budget Alerts</div>
              <div className="text-xs text-muted-foreground">Notify when approaching limits</div>
            </div>
            <Switch checked={!!prefs.notifications?.budgetAlerts} onCheckedChange={(v)=>setPrefs({ ...prefs, notifications: { ...prefs.notifications, budgetAlerts: v } })} />
          </div>
          <div className="flex items-center justify-between border rounded-lg p-3">
            <div>
              <div className="font-medium">Goal Reminders</div>
              <div className="text-xs text-muted-foreground">Stay on track</div>
            </div>
            <Switch checked={!!prefs.notifications?.goalReminders} onCheckedChange={(v)=>setPrefs({ ...prefs, notifications: { ...prefs.notifications, goalReminders: v } })} />
          </div>
          <div className="flex items-center justify-between border rounded-lg p-3">
            <div>
              <div className="font-medium">Share Anonymous Analytics</div>
              <div className="text-xs text-muted-foreground">Help improve FlowFinance</div>
            </div>
            <Switch checked={!!prefs.privacy?.shareAnalytics} onCheckedChange={(v)=>setPrefs({ ...prefs, privacy: { ...prefs.privacy, shareAnalytics: v } })} />
          </div>
        </div>
        <div className="pt-4 flex justify-end">
          <Button className="bg-primary text-primary-foreground" onClick={save} disabled={saving}>{saving?'Saving…':'Save'}</Button>
        </div>
      </section>

      <section className="rounded-xl border p-4">
        <h2 className="font-semibold mb-3">Data & Privacy</h2>
        <div className="grid gap-3">
          <Button variant="outline" onClick={async()=>{ await apiFetch('/api/settings/export', { method: 'POST' }); }}>Export Preferences JSON</Button>
          <Button variant="destructive" onClick={async()=>{ await apiFetch('/api/settings/reset', { method: 'DELETE' }); location.reload(); }}>Reset Preferences</Button>
        </div>
      </section>
    </div>
  );
}
