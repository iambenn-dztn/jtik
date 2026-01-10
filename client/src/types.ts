
export interface ProcessedLink {
  id: string;
  originalUrl: string;
  smartAlias: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  createdAt: number;
}

export interface ApiResponse {
  title: string;
  description: string;
  category: string;
  tags: string[];
  smartAlias: string;
}
