
export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export interface SubTask {
  id: string;
  text: string;
  completed: boolean;
  priority?: Priority;
  dueDate?: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: Priority;
  category: string;
  createdAt: number;
  dueDate?: number;
  subTasks: SubTask[];
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  highPriority: number;
}
