
export interface Chapter {
  id: string;
  number: string;       
  title: string;
  subtitle?: string;    
  duration?: string;     
  audioUrl: string;    
    icon?: string;
}

export interface Story {
  id: string;
  slug: string;
  title: string;
  author: string;
  category: string;
  imageUrl?: string;
  description: string;
  tags?: string[];
  chapters?: Chapter[];

  totalDuration?: string;
  rating?: string;
  reviewCount?: string;
  releaseYear?: string;
}


export interface CategoryType {
  id: string;
  name: string;
  slug: string;
}

export interface HistoryItem {
  _id: string;
  userId: string;
  storyId: {
    _id: string;
    title: string;
    slug: string;
    coverImage?: string;
    author?: string;
    category?: string;
    description?: string;
  };
  chapterId?: {
    _id: string;
    title: string;
    order: number;
    duration?: number;
    audioUrl?: string;

  };
  lastPosition: number;
  duration?: number;
  progressPercent: number;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface SavedStoryItem {
  _id: string;
  userId: string;
  storyId: string | { _id: string; title?: string; slug?: string; coverImage?: string };
  createdAt: string;
  updatedAt: string;
  __v?: number;
}
export interface CreateStoryResponse {
  message: string;
  story: Story;
}
