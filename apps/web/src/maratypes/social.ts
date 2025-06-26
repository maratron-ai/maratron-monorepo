export interface SocialProfile {
  id: string;
  userId: string;
  username: string;
  bio?: string | null;
  profilePhoto?: string | null;
  avatarUrl?: string | null;
  user?: {
    avatarUrl?: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
  name?: string | null;
  runCount?: number;
  totalDistance?: number;
  followerCount?: number;
  followingCount?: number;
  postCount?: number;
  /** Indicates whether the viewer follows this profile */
  following?: boolean;
}

export interface RunPost {
  id: string;
  socialProfileId: string;
  groupId?: string | null;
  distance: number;
  time: string;
  caption?: string | null;
  photoUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
  socialProfile?: SocialProfile & { user?: { avatarUrl?: string } };
  likeCount?: number;
  commentCount?: number;
  /** Indicates whether the current user liked the post */
  liked?: boolean;
  _count?: {
    likes: number;
    comments: number;
  };
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
}

export interface Comment {
  id: string;
  postId: string;
  socialProfileId: string;
  text: string;
  createdAt: Date;
  socialProfile?: SocialProfile;
}

export interface Like {
  id: string;
  postId: string;
  socialProfileId: string;
  createdAt: Date;
}

export interface RunGroup {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  private: boolean;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  memberCount?: number;
  isMember?: boolean;
  postCount?: number;
  /** Total distance from all members' runs */
  totalDistance?: number;
  /** Social profiles of members */
  members?: SocialProfile[];
}

export interface RunGroupMember {
  groupId: string;
  socialProfileId: string;
  joinedAt: Date;
}
