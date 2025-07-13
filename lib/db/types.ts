export type UserRole = "user" | "admin";

export type Database = {
  public: {
    Tables: {
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          daily_limit: number;
          weekly_limit: number;
          monthly_limit: number;
          tracking_period: "daily" | "weekly" | "monthly";
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          daily_limit?: number;
          weekly_limit?: number;
          monthly_limit?: number;
          tracking_period?: "daily" | "weekly" | "monthly";
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          daily_limit?: number;
          weekly_limit?: number;
          monthly_limit?: number;
          tracking_period?: "daily" | "weekly" | "monthly";
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
      };
      foods: {
        Row: {
          id: string;
          name: string;
          vitamin_k_mcg_per_100g: number;
          category: "vegetables" | "fruits" | "proteins" | "grains" | "dairy" | "fats_oils" | "beverages" | "other";
          common_portion_size_g: number;
          common_portion_name: string;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          vitamin_k_mcg_per_100g: number;
          category: "vegetables" | "fruits" | "proteins" | "grains" | "dairy" | "fats_oils" | "beverages" | "other";
          common_portion_size_g: number;
          common_portion_name: string;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          vitamin_k_mcg_per_100g?: number;
          category?: "vegetables" | "fruits" | "proteins" | "grains" | "dairy" | "fats_oils" | "beverages" | "other";
          common_portion_size_g?: number;
          common_portion_name?: string;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      food_audit_log: {
        Row: {
          id: number;
          food_id: string;
          action: "create" | "update" | "delete";
          changed_by: string;
          changed_at: string;
          old_values: any | null;
          new_values: any | null;
          ip_address: string | null;
          user_agent: string | null;
        };
        Insert: {
          id?: number;
          food_id: string;
          action: "create" | "update" | "delete";
          changed_by: string;
          changed_at?: string;
          old_values?: any | null;
          new_values?: any | null;
          ip_address?: string | null;
          user_agent?: string | null;
        };
        Update: {
          id?: number;
          food_id?: string;
          action?: "create" | "update" | "delete";
          changed_by?: string;
          changed_at?: string;
          old_values?: any | null;
          new_values?: any | null;
          ip_address?: string | null;
          user_agent?: string | null;
        };
      };
      meal_logs: {
        Row: {
          id: string;
          user_id: string;
          food_id: string;
          portion_size_g: number;
          vitamin_k_consumed_mcg: number;
          logged_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          food_id: string;
          portion_size_g: number;
          vitamin_k_consumed_mcg: number;
          logged_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          food_id?: string;
          portion_size_g?: number;
          vitamin_k_consumed_mcg?: number;
          logged_at?: string;
          created_at?: string;
        };
      };
    };
  };
};