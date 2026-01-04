export interface VideoItem {
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl: string;
  creatorId: string;
  createdAt: string;
}

export interface Creator {
  id: string;
  name: string;
  avatarUrl: string;
}
