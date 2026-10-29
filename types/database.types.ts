export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'OWNER' | 'MANAGER' | 'STAFF';
export type AccountStatus = 'PENDING' | 'ACTIVE' | 'REJECTED';
export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'REJECTED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type AttachmentFileType = 'DOCUMENT' | 'IMAGE' | 'LINK';
export type ActivityActionType =
  | 'STATUS_CHANGE'
  | 'COMMENT'
  | 'EVIDENCE_UPLOAD'
  | 'APPROVAL_ACC'
  | 'REVISION_REJECT'
  | 'PROGRESS_UPDATE'
  | 'REASSIGN'
  | 'KPI_WEIGHT_CHANGE';

export interface Database {
  public: {
    Tables: {
      divisions: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: Array<{
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }>;
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          whatsapp_number: string;
          role: UserRole;
          division_id: string | null;
          account_status: AccountStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          whatsapp_number: string;
          role?: UserRole;
          division_id?: string | null;
          account_status?: AccountStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          whatsapp_number?: string;
          role?: UserRole;
          division_id?: string | null;
          account_status?: AccountStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: Array<{
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }>;
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          assigner_id: string;
          assignee_id: string;
          division_id: string;
          status: TaskStatus;
          priority: TaskPriority;
          kpi_weight: number;
          progress_percentage: number;
          due_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          assigner_id: string;
          assignee_id: string;
          division_id: string;
          status?: TaskStatus;
          priority?: TaskPriority;
          kpi_weight?: number;
          progress_percentage?: number;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          assigner_id?: string;
          assignee_id?: string;
          division_id?: string;
          status?: TaskStatus;
          priority?: TaskPriority;
          kpi_weight?: number;
          progress_percentage?: number;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: Array<{
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }>;
      };
      task_attachments: {
        Row: {
          id: string;
          task_id: string;
          uploaded_by: string;
          file_url: string;
          file_type: AttachmentFileType;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          uploaded_by: string;
          file_url: string;
          file_type?: AttachmentFileType;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          uploaded_by?: string;
          file_url?: string;
          file_type?: AttachmentFileType;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: Array<{
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }>;
      };
      task_activities: {
        Row: {
          id: string;
          task_id: string;
          user_id: string;
          action_type: ActivityActionType;
          old_value: string | null;
          new_value: string | null;
          comment_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          user_id: string;
          action_type: ActivityActionType;
          old_value?: string | null;
          new_value?: string | null;
          comment_text?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          user_id?: string;
          action_type?: ActivityActionType;
          old_value?: string | null;
          new_value?: string | null;
          comment_text?: string | null;
          created_at?: string;
        };
        Relationships: Array<{
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }>;
      };
      user_kpi_records: {
        Row: {
          id: string;
          user_id: string;
          month_year: string;
          total_tasks_completed: number;
          total_tasks_overdue: number;
          total_kpi_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          month_year: string;
          total_tasks_completed?: number;
          total_tasks_overdue?: number;
          total_kpi_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          month_year?: string;
          total_tasks_completed?: number;
          total_tasks_overdue?: number;
          total_kpi_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: Array<{
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_auth_role: {
        Args: Record<string, never>;
        Returns: UserRole;
      };
      get_auth_division: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: {
      user_role: UserRole;
      task_status: TaskStatus;
      task_priority: TaskPriority;
      attachment_file_type: AttachmentFileType;
      activity_action_type: ActivityActionType;
    };
  };
}

// Domain Model Types
export type Division = Database['public']['Tables']['divisions']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type TaskAttachment = Database['public']['Tables']['task_attachments']['Row'] & {
  uploader?: Profile;
};
export type Task = Database['public']['Tables']['tasks']['Row'] & {
  assignee?: Profile;
  assigner?: Profile;
  division?: Division;
  attachments?: TaskAttachment[];
};
export type TaskActivity = Database['public']['Tables']['task_activities']['Row'] & {
  user?: Profile;
};
export type UserKpiRecord = Database['public']['Tables']['user_kpi_records']['Row'] & {
  user?: Profile;
};
