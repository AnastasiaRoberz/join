import { Component, computed, inject } from '@angular/core';
import { ResponsiveService } from '../../../services/responsive.service';
import { UserService } from '../../../services/user.service';
import { TaskService } from '../../../services/task.service';
import { TaskInterface } from '../../../interfaces/task.interface';

@Component({
  imports: [],
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  responsiveService = inject(ResponsiveService);
  userService = inject(UserService);
  taskService = inject(TaskService);

  user = computed(() => this.userService.currentContact());

  getDaytime = computed(() => {
    const hour = new Date().getHours();

    if (hour < 12) {
      return 'Good morning,';
    } else if (hour >= 12 && hour < 14) {
      return 'Hey,';
    } else if (hour >= 14 && hour < 18) {
      return 'Good afternoon,';
    } else if (hour >= 18 && hour < 22) {
      return 'Good evening,';
    } else {
      return 'Hey!';
    }
  });

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
      upcomingDeadline: this.upcomingDeadline(tasks),
    };
  });

  upcomingDeadline(tasks: TaskInterface[]) {
    const today = new Date().setHours(0, 0, 0, 0);

    const openTasksWithDate = tasks.filter((task) => {
      if (!task.due_date || task.status === 'Done') return false;

      const taskDate = new Date(task.due_date);
      return taskDate.setHours(0, 0, 0, 0) >= today;
    });
    const sortedTasks = openTasksWithDate.sort(
      (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime(),
    );

    const formatedDate = new Date(sortedTasks[0].due_date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    return formatedDate ?? 'No upcoming deadline.';
  }
}
