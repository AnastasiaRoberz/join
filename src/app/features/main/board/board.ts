import { Component } from '@angular/core';
import { Task } from '../../../interfaces/task';
import { TaskCard } from '../../../shared/task-card/task-card';

@Component({
  imports: [TaskCard],
  selector: 'app-board',
  styleUrl: './board.scss',
  templateUrl: './board.html',
})
export class Board {
  // TEMPORARY test task, will be replaced by the dummy data in step 6
  testTask: Task = {
    title: 'Kochwelt Page & Recipe Recommender',
    description: 'Build start page with recipe recommendation and a lot of other things to do.',
    due_date: '2026-10-30',
    category: 'User Story',
    priority: 'medium',
    status: 'inProgress',
    assigned_to: [],
    subtasks: [
      { title: 'Start page', done: true },
      { title: 'Recipe recommender', done: false },
    ],
  };
}