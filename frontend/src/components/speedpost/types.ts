export interface ConnectedAccount {
  id: number;
  user_id: string;
  provider: string;
  account_name: string;
  ig_user_id: string;
  access_token: string;
  profile_picture_url?: string;
  status: string;
  created_at?: string;
}

export interface ScheduledPostItem {
  id: number;
  user_id: string;
  ig_user_id: string;
  access_token: string;
  video_url: string;
  caption: string;
  scheduled_at: string;
  status: 'PENDING' | 'PROCESSING' | 'PUBLISHED' | 'FAILED' | 'CANCELLED';
  meta_container_id?: string;
  meta_media_id?: string;
  error_log?: string;
  created_at: string;
}
