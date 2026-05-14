import { Setting } from './settings.model';

export class SettingsService {
  /**
   * Get a setting by key
   */
  async getSetting(key: string): Promise<string | null> {
    const setting = await Setting.findOne({ key });
    return setting ? setting.value : null;
  }

  /**
   * Set/update a setting
   */
  async setSetting(key: string, value: string, group = 'general', description = ''): Promise<void> {
    await Setting.findOneAndUpdate(
      { key },
      { key, value, group, description },
      { upsert: true, new: true }
    );
  }

  /**
   * Get all settings, optionally filtered by group
   */
  async getAllSettings(group?: string): Promise<any[]> {
    const filter = group ? { group } : {};
    return Setting.find(filter).sort({ group: 1, key: 1 }).lean();
  }

  /**
   * Get settings by group
   */
  async getSettingsByGroup(group: string): Promise<Record<string, string>> {
    const settings = await Setting.find({ group }).lean();
    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return result;
  }

  /**
   * Delete a setting
   */
  async deleteSetting(key: string): Promise<void> {
    await Setting.deleteOne({ key });
  }

  /**
   * Get pagination defaults from settings
   */
  async getPaginationDefaults(): Promise<{ itemsPerPage: number }> {
    const value = await this.getSetting('pagination_items_per_page');
    return { itemsPerPage: value ? parseInt(value, 10) : 10 };
  }
}

export const settingsService = new SettingsService();