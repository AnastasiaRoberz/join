import { Component, computed, inject } from '@angular/core';
import { ResponsiveService } from '../../../services/responsive.service';
import { UserService } from '../../../services/user.service';
import { TaskService } from '../../../services/task.service';
import { getGreeting } from '../../../utils/greeting-utils';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  responsiveService = inject(ResponsiveService);
  isShortHeight = this.responsiveService.isMaxHeight(450);
  hideGreeting = this.responsiveService.observeQuery('(max-width: 451px) and (max-height: 501px)');
  noPrioBg = this.responsiveService.observeQuery('(max-width: 450px) and (max-height: 500px)');
  userService = inject(UserService);
  taskService = inject(TaskService);

  user = computed(() => this.userService.currentContact());

  getDaytime = computed(() => getGreeting(this.user()?.firstname));

  tiles = computed(() => {
    const tasks = this.taskService.tasks();
    const countStatus = (status: string) => tasks.filter((task) => task.status === status).length;

    return [
      { area: 'todo', label: 'To-do', amount: countStatus('To do'), icon: 'edit' },
      { area: 'done', label: 'Done', amount: countStatus('Done'), icon: 'check', bold: true },
      { area: 'total', label: 'Tasks in Board', amount: tasks.length },
      { area: 'progress', label: 'Tasks in Progress', amount: countStatus('In progress') },
      { area: 'feedback', label: 'Awaiting Feedback', amount: countStatus('Await feedback') },
    ];
  });

  priorities = computed(() => {
    const tasks = this.taskService.tasks();
    const countPrio = (prio: string) => tasks.filter((task) => task.priority === prio).length;

    return [
      { icon: 'urgent', amount: countPrio('urgent') },
      { icon: 'medium', amount: countPrio('medium') },
      { icon: 'low', amount: countPrio('low') },
    ];
  });

  deadline() {
    const tasks = this.taskService.tasks();
    const today = new Date().setHours(0, 0, 0, 0);

    const nextTask = tasks
      .filter((task) => task.due_date && task.status !== 'Done')
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];

    if (!nextTask) return null;

    const date = new Date(nextTask.due_date);
    const overdue = date.setHours(0, 0, 0, 0) < today;

    return {
      date: date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      text: overdue ? 'Overdue Deadline' : 'Upcoming Deadline',
      color: overdue ? '#e60026' : null,
    };
  }
}
