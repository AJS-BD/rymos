import { getSupabase } from "@/lib/supabase";

export async function getSetting(key: string): Promise<string | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", key)
    .single();

  if (error) {
    console.error(`Error fetching setting ${key}:`, error);
    return null;
  }
  return data?.value ?? null;
}

export async function getSettingsByCategory(
  category: string
): Promise<Record<string, string>> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("settings")
    .select("key, value")
    .eq("category", category);

  if (error) {
    console.error(`Error fetching settings for category ${category}:`, error);
    return {};
  }

  const result: Record<string, string> = {};
  data?.forEach((row) => {
    if (row.value !== null) {
      result[row.key] = row.value;
    }
  });
  return result;
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("settings")
    .select("key, value");

  if (error) {
    console.error("Error fetching all settings:", error);
    return {};
  }

  const result: Record<string, string> = {};
  data?.forEach((row) => {
    if (row.value !== null) {
      result[row.key] = row.value;
    }
  });
  return result;
}

export async function updateSetting(
  key: string,
  value: string
): Promise<boolean> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("settings")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });

  if (error) {
    console.error(`Error updating setting ${key}:`, error);
    return false;
  }
  return true;
}

export async function updateSettings(
  settings: Record<string, string>
): Promise<boolean> {
  const supabase = getSupabase();
  const updates = Object.entries(settings).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("settings")
    .upsert(updates, { onConflict: "key" });

  if (error) {
    console.error("Error updating settings:", error);
    return false;
  }
  return true;
}
