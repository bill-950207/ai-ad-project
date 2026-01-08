/**
 * 목업 데이터
 *
 * 개발 및 데모용 샘플 데이터를 제공합니다.
 * 실제 운영 환경에서는 데이터베이스에서 데이터를 조회합니다.
 */

import { VideoItem } from "@/types";

/**
 * 샘플 비디오 목록
 * 갤러리 섹션에서 사용되는 데모 비디오 데이터
 */
export const mockVideos: VideoItem[] = [
  {
    id: "1",
    title: "Summer Fashion Collection",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=600&fit=crop",
    creatorId: "user1",
    createdAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "2",
    title: "Tech Product Launch",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=600&fit=crop",
    creatorId: "user2",
    createdAt: "2024-01-14T14:20:00Z",
  },
  {
    id: "3",
    title: "Fitness App Promo",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=600&fit=crop",
    creatorId: "user3",
    createdAt: "2024-01-13T09:15:00Z",
  },
  {
    id: "4",
    title: "Food Delivery Service",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=600&fit=crop",
    creatorId: "user1",
    createdAt: "2024-01-12T16:45:00Z",
  },
  {
    id: "5",
    title: "Travel Experience Ad",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=600&fit=crop",
    creatorId: "user2",
    createdAt: "2024-01-11T11:00:00Z",
  },
  {
    id: "6",
    title: "Beauty Brand Campaign",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=600&fit=crop",
    creatorId: "user3",
    createdAt: "2024-01-10T13:30:00Z",
  },
  {
    id: "7",
    title: "Gaming App Launch",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=600&fit=crop",
    creatorId: "user1",
    createdAt: "2024-01-09T08:00:00Z",
  },
  {
    id: "8",
    title: "E-commerce Flash Sale",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=600&fit=crop",
    creatorId: "user2",
    createdAt: "2024-01-08T15:20:00Z",
  },
];
