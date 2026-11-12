export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'OWNER' | 'TEAM';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          whatsapp_number: string | null;
          role: UserRole;
          title: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email: string;
          whatsapp_number?: string | null;
          role?: UserRole;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          whatsapp_number?: string | null;
          role?: UserRole;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      kpi_jobdesks: {
        Row: {
          id: string;
          owner_id: string;
          created_by: string | null;
          title: string;
          weight: number;
          is_completed: boolean;
          period_month: string;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          created_by?: string | null;
          title: string;
          weight?: number;
          is_completed?: boolean;
          period_month?: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          created_by?: string | null;
          title?: string;
          weight?: number;
          is_completed?: boolean;
          period_month?: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      calendar_tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          assignee_id: string | null;
          assigner_id: string | null;
          start_time: string;
          due_date: string;
          status: TaskStatus;
          priority: TaskPriority;
          completed_at: string | null;
          ping_count: number;
          last_pinged_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          assignee_id?: string | null;
          assigner_id?: string | null;
          start_time: string;
          due_date: string;
          status?: TaskStatus;
          priority?: TaskPriority;
          completed_at?: string | null;
          ping_count?: number;
          last_pinged_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          assignee_id?: string | null;
          assigner_id?: string | null;
          start_time?: string;
          due_date?: string;
          status?: TaskStatus;
          priority?: TaskPriority;
          completed_at?: string | null;
          ping_count?: number;
          last_pinged_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      task_pings: {
        Row: {
          id: string;
          task_id: string;
          sender_id: string;
          recipient_id: string;
          message: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          sender_id: string;
          recipient_id: string;
          message?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          sender_id?: string;
          recipient_id?: string;
          message?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type KpiJobdesk = Database['public']['Tables']['kpi_jobdesks']['Row'];
export type CalendarTask = Database['public']['Tables']['calendar_tasks']['Row'];
export type TaskPing = Database['public']['Tables']['task_pings']['Row'];
