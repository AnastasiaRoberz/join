import { Component, computed, inject } from '@angular/core';
import { ResponsiveService } from '../../../services/responsive.service';
import { UserService } from '../../../services/user.service';
import { TaskService } from '../../../services/task.service';
import { TaskInterface } from '../../../interfaces/task.interface';
import { getGreeting } from '../../../utils/greeting-utils';

@Component({
  imports: [],
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  responsiveService = inject(ResponsiveService);
  isShortHeight = this.responsiveService.isMaxHeight(768);
  userService = inject(UserService);
  taskService = inject(TaskService);

  user = computed(() => this.userService.currentContact());

  getDaytime = computed(() => getGreeting(this.user()?.firstname));

  filteredTasks = computed(() => {
    const tasks = this.taskService.tasks();

    return {
      toDo: tasks.filter((task) => task.status === 'To do').length,
      done: tasks.filter((task) => task.status === 'Done').length,
      urgend: tasks.filter((task) => task.priority === 'urgent').length,
      medium: tasks.filter((task) => task.priority === 'medium').length,
      low: tasks.filter((task) => task.priority === 'low').length,
      total: tasks.length,
      inProgress: tasks.filter((task) => task.status === 'In progress').length,
      awaitFeedback: tasks.filter((task) => task.status === 'Await feedback').length,
      deadline: this.deadline(tasks),
    };
  });

  deadline(tasks: TaskInterface[]) {
    const today = new Date().setHours(0, 0, 0, 0);

    const openTasksWithDate = tasks.filter((task) => task.due_date && task.status !== 'Done');

    const sortedTasks = openTasksWithDate.sort(
      (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime(),
    );
    if (!sortedTasks[0]) return null;

    const date = new Date(sortedTasks[0].due_date);
    const overdue = date.setHours(0, 0, 0, 0) < today;
    const deadlineText = overdue ? 'Overdue Deadline' : 'Upcoming Deadline';
    const color = overdue ? '#e60026' : null;

    return {
      date: date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      text: deadlineText,
      color: color,
    };
  }
}
