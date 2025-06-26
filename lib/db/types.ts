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
          created_at?: string;
          updated_at?: string;
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