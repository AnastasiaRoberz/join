import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  viewChild,
  computed,
  viewChildren,
} from '@angular/core';
import { ResponsiveService } from '../../../services/responsive.service';
import { IntroService } from '../../../services/intro.service';
import { UserService } from '../../../services/user.service';
import { BoardFilter, TaskService } from '../../../services/task.service';
import { getGreeting } from '../../../utils/greeting-utils';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard implements AfterViewInit {
  responsiveService = inject(ResponsiveService);
  hideGreeting = this.responsiveService.observeQuery('(max-width: 451px) and (max-height: 501px)');
  noPrioBg = this.responsiveService.observeQuery('(max-width: 450px) and (max-height: 500px)');

  //to manage intro-animation
  greeterService = inject(IntroService);

  // Reference to <app-dashboard>
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  // Reference to the welcome div box in the template <div #welcome>
  private welcome = viewChild<ElementRef<HTMLElement>>('welcome');

  constructor() {
    // Checks whether a greeting is waiting (after login) and switches it on.
    this.greeterService.startGreeting();
  }

  //
  // Only needed for the "fly" variant: calculate how far the greeting is
  // from the centre of the page, so it can start there.
  ngAfterViewInit(): void {
    const welcome = this.welcome()?.nativeElement;
    if (!this.greeterService.isGreeting() || !welcome || this.hideGreeting()) return;

    // Hide the greeting until the web font has loaded: with the fallback font the text
    // has a different size, so measuring now would give a slightly wrong centre.
    welcome.style.visibility = 'hidden';
    document.fonts.ready.then(() => this.playFly(welcome));
  }

  // Measures the greeting and lets it fly from the centre to its spot
  private playFly(welcome: HTMLElement): void {
    // Greeting box in its final spot (grid cell / above the tiles)
    const rect = welcome.getBoundingClientRect();
    // The page area (right of the sidebar, under the header)
    const area = this.host.nativeElement.getBoundingClientRect();

    // Horizontal target: middle of the visible page area (right of the sidebar, never past the screen edge)
    const left = Math.max(area.left, 0);
    const right = Math.min(area.right, window.innerWidth);
    const centerX = (left + right) / 2;
    // Vertical target: middle of the whole screen
    const centerY = window.innerHeight / 2;

    // How far the greeting's middle has to move to sit on the target
    const toX = centerX - (rect.left + rect.width / 2);
    const toY = centerY - (rect.top + rect.height / 2);

    // Start position as a CSS transform, e.g. "translate(-350px, -80px)"
    const center = `translate(${toX}px, ${toY}px)`;

    const animation = welcome.animate(
      [
        { transform: center }, // start: middle of the screen
        { transform: center, offset: 0.5, easing: 'ease-in-out' }, // halfway: still in the middle, then slide
        { transform: 'translate(0, 0)' }, // end: its spot
      ],
      { duration: 1800, delay: 200, fill: 'backwards' }, // same timing as .greeter-overlay
    );

    // Waiting for the font may take a few ms: start the greeting at the same moment
    // as the overlay, so both stay in sync.
    const overlayAnimation = this.host.nativeElement
      .querySelector('.greeter-overlay')
      ?.getAnimations()[0];

    // wait until the overlay animation has really started (mobiles start later)
    overlayAnimation?.ready.then(() => {
      // then start the greeting at exactly the same moment as the overlay
      animation.startTime = overlayAnimation.startTime;
    });

    welcome.style.visibility = ''; // show it again, now already in the middle
  }

  userService = inject(UserService);
  taskService = inject(TaskService);
  router = inject(Router);

  user = computed(() => this.userService.currentContact());

  getDaytime = computed(() => getGreeting(this.user()?.firstname));

  tiles = computed(() => {
    const tasks = this.taskService.tasks();
    const countStatus = (status: string) => tasks.filter((task) => task.status === status).length;

    return [
      {
        area: 'todo',
        label: 'To-do',
        amount: countStatus('To do'),
        icon: 'edit',
        filter: { type: 'status', status: 'To do', label: 'To-do' } as BoardFilter,
      },
      {
        area: 'done',
        label: 'Done',
        amount: countStatus('Done'),
        icon: 'check',
        bold: true,
        filter: { type: 'status', status: 'Done', label: 'Done' } as BoardFilter,
      },
      {
        area: 'total',
        label: 'Tasks in Board',
        amount: tasks.length,
        filter: null,
      },
      {
        area: 'progress',
        label: 'Tasks in Progress',
        amount: countStatus('In progress'),
        filter: { type: 'status', status: 'In progress', label: 'In Progress' } as BoardFilter,
      },
      {
        area: 'feedback',
        label: 'Awaiting Feedback',
        amount: countStatus('Await feedback'),
        filter: {
          type: 'status',
          status: 'Await feedback',
          label: 'Awaiting Feedback',
        } as BoardFilter,
      },
    ];
  });

  priorities = computed(() => {
    const tasks = this.taskService.tasks();
    const countPrio = (prio: string) => tasks.filter((task) => task.priority === prio).length;

    return [
      {
        icon: 'urgent',
        amount: countPrio('urgent'),
        filter: { type: 'priority', priority: 'urgent', label: 'Urgent' } as BoardFilter,
      },
      {
        icon: 'medium',
        amount: countPrio('medium'),
        filter: { type: 'priority', priority: 'medium', label: 'Medium' } as BoardFilter,
      },
      {
        icon: 'low',
        amount: countPrio('low'),
        filter: { type: 'priority', priority: 'low', label: 'Low' } as BoardFilter,
      },
    ];
  });

  onPriorityClick(filter: BoardFilter, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.taskService.setBoardFilter(filter);
    this.router.navigate(['/app/board']);
  }

  onDeadlineTileClick(): void {
    const currentDeadline = this.deadline();
    this.taskService.setBoardFilter(
      currentDeadline ? { type: 'deadline', label: currentDeadline.text } : null,
    );
  }

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
