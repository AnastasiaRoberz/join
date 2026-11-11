import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  inject,
  OnInit,
  viewChild,
} from '@angular/core';
import { ResponsiveService } from '../../../services/responsive.service';
import { IntroService } from '../../../services/intro.service';
import { UserService } from '../../../services/user.service';
import { BoardFilter, TaskService } from '../../../services/task.service';
import { getGreetingFormatter, GreetingParts } from '../../../utils/greeting-utils';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { DialogService } from '../../../services/dialog.service';
import { TaskInterface } from '../../../interfaces/task.interface';

/** Metric tile model on the dashboard. */
export interface DashboardTile {
  area: string;
  label: string;
  label2?: string;
  amount: number;
  icon?: string;
  bold?: boolean;
  filter: BoardFilter | null;
}

/** Priority summary tile item. */
export interface PriorityItem {
  icon: string;
  amount: number;
  filter: BoardFilter;
}

/** Nearest task deadline summary information. */
export interface DeadlineInfo {
  rawDate: string;
  formattedDate: string;
  text: string;
  overdue: boolean;
}

/**
 * Dashboard summary view presenting task metrics, priority counts, and greeting animation.
 */
@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
  host: {
    '[class.is-greeting]': 'greeterService.isGreeting()',
  },
})
export class Dashboard implements OnInit, AfterViewInit {
  /** Responsive service for viewport layout queries. */
  private readonly responsiveService = inject(ResponsiveService);

  /** Dialog service for opening task detail popup. */
  private readonly dialogService = inject(DialogService);

  /** Intro service managing greeter overlay state and timing. */
  protected readonly greeterService = inject(IntroService);

  /** User service providing the current contact and name for greetings. */
  private readonly userService = inject(UserService);

  /** Task service providing reactive task list and filter state. */
  protected readonly taskService = inject(TaskService);

  /** Router instance for navigation to board with pre-set filters. */
  private readonly router = inject(Router);

  /** Reference to host dashboard container element. */
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Reference to greeting DOM element animated across viewport. */
  private readonly welcome = viewChild<ElementRef<HTMLElement>>('welcome');

  /** Suppresses greeting animation on compact screens. */
  protected readonly hideGreeting = this.responsiveService.observeQuery(
    '(max-width: 768px) and (max-height: 601px)',
  );

  /** Current logged in user contact. */
  protected readonly user = computed(() => this.userService.currentContact());

  /** Stable slogan formatter chosen once per component initialization. */
  private readonly greetingFormatter = getGreetingFormatter();

  /** Formatted daytime greeting object based on stable formatter and current user firstname. */
  protected readonly getDaytime = computed<GreetingParts>(() =>
    this.greetingFormatter(this.user()?.firstname),
  );

  /** Dashboard metrics tiles for task statuses. */
  protected readonly tiles = computed<DashboardTile[]>(() =>
    this.buildDashboardTiles(this.taskService.tasks()),
  );

  /** Task counts grouped by priority. */
  protected readonly priorities = computed<PriorityItem[]>(() =>
    (['urgent', 'medium', 'low'] as const).map((p) =>
      this.createPriorityItem(p, this.taskService.tasks()),
    ),
  );

  /** Starts the greeting animation and ensures dashboard tasks are loaded. */
  public ngOnInit(): void {
    this.greeterService.startGreeting();
    if (this.taskService.tasks().length === 0) {
      this.taskService.getAllTasks();
    }
  }

  /** Schedules fly animation for the greeting box after fonts have loaded. */
  public ngAfterViewInit(): void {
    const welcome = this.welcome()?.nativeElement;
    if (!this.greeterService.isGreeting() || !welcome || this.hideGreeting()) return;

    welcome.style.visibility = 'hidden';
    document.fonts.ready.then(() => this.playFly(welcome));
  }

  /** Filters board by priority and navigates to the board page. */
  protected onPriorityClick(filter: BoardFilter, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.taskService.setBoardFilter(filter);
    this.router.navigate(['/app/board']);
  }

  /** Navigates to board or task dialog when the deadline tile is clicked. */
  protected onDeadlineTileClick(event?: Event): void {
    event?.preventDefault();
    event?.stopImmediatePropagation();
    const currentDeadline = this.deadline();
    if (!currentDeadline) return;

    const tasks = this.taskService
      .tasks()
      .filter(
        (t) =>
          t.due_date?.slice(0, 10) === currentDeadline.rawDate?.slice(0, 10) && t.status !== 'Done',
      );
    this.router.navigate(['/app/board']);
    this.taskService.setBoardFilter({
      type: 'deadline',
      dueDate: currentDeadline.rawDate,
      label: `Deadline: ${currentDeadline.formattedDate}`,
    });
  }

  /** Evaluates nearest open deadline across all tasks as a reactive computed signal. */
  protected readonly deadline = computed<DeadlineInfo | null>(() => {
    const tasks = this.taskService.tasks();
    const nextTask = this.findNextOpenTask(tasks);
    if (!nextTask) return null;
    return this.buildDeadlineInfo(nextTask, new Date().setHours(0, 0, 0, 0));
  });

  /** Measures coordinates and runs the fly animation for the greeting box. */
  private playFly(welcome: HTMLElement): void {
    const center = this.calculateFlyCenterTransform(welcome);
    const animation = this.animateWelcomeFly(welcome, center);
    this.syncWithOverlayAnimation(animation);
    welcome.style.visibility = '';
  }

  /** Calculates translation offset from viewport center to final greeting element position. */
  private calculateFlyCenterTransform(welcome: HTMLElement): string {
    const rect = welcome.getBoundingClientRect();
    const area = this.host.nativeElement.getBoundingClientRect();
    const left = Math.max(area.left, 0);
    const right = Math.min(area.right, window.innerWidth);
    const toX = (left + right) / 2 - (rect.left + rect.width / 2);
    const toY = window.innerHeight / 2 - (rect.top + rect.height / 2);
    return `translate(${toX}px, ${toY}px)`;
  }

  /** Runs the CSS keyframe fly animation on the greeting element. */
  private animateWelcomeFly(welcome: HTMLElement, center: string): Animation {
    return welcome.animate(
      [
        { transform: center },
        { transform: center, offset: 0.5, easing: 'ease-in-out' },
        { transform: 'translate(0, 0)' },
      ],
      { duration: 1800, delay: 200, fill: 'backwards' },
    );
  }

  /** Synchronizes greeting movement start time with the backdrop overlay. */
  private syncWithOverlayAnimation(animation: Animation): void {
    const overlay = this.host.nativeElement.querySelector('.greeter-overlay')?.getAnimations()[0];
    overlay?.ready.then(() => {
      animation.startTime = overlay.startTime;
    });
  }

  /** Constructs all five status metric tiles. */
  private buildDashboardTiles(tasks: TaskInterface[]): DashboardTile[] {
    return [
      this.createStatusTile('todo', 'To-do', 'To do', 'edit', tasks),
      this.createStatusTile('done', 'Done', 'Done', 'check', tasks, true),
      { area: 'total', label: 'Tasks in', label2: 'Board', amount: tasks.length, filter: null },
      this.createStatusTile('progress', 'Tasks in', 'In progress', '', tasks, false, 'Progress'),
      this.createStatusTile('feedback', 'Awaiting', 'Await feedback', '', tasks, false, 'Feedback'),
    ];
  }

  /**
   * Builds an individual metric tile configuration for a status.
   *
   * @param area - CSS grid area identifier.
   * @param label - Tile label text.
   * @param status - Task status category.
   * @param icon - Icon name.
   * @param tasks - Full task collection.
   * @param bold - Whether to render text in bold.
   * @returns Configured DashboardTile object.
   */
  private createStatusTile(
    area: string,
    label: string,
    status: TaskInterface['status'],
    icon: string,
    tasks: TaskInterface[],
    bold?: boolean,
    label2?: string,
  ): DashboardTile {
    const amount = tasks.filter((task) => task.status === status).length;
    return {
      area,
      label,
      label2,
      amount,
      icon: icon || undefined,
      bold,
      filter: { type: 'status', status, label },
    };
  }

  /**
   * Maps a priority string to its metric summary object.
   *
   * @param prio - Priority level.
   * @param tasks - Full task collection.
   * @returns Configured PriorityItem object.
   */
  private createPriorityItem(
    prio: 'urgent' | 'medium' | 'low',
    tasks: TaskInterface[],
  ): PriorityItem {
    const label = prio.charAt(0).toUpperCase() + prio.slice(1);
    return {
      icon: prio,
      amount: tasks.filter((task) => task.priority === prio).length,
      filter: { type: 'priority', priority: prio, label },
    };
  }

  /**
   * Finds the next unfinished task with a due date.
   *
   * @param tasks - Full task collection.
   * @returns The earliest upcoming open task or undefined.
   */
  private findNextOpenTask(tasks: TaskInterface[]): TaskInterface | undefined {
    return tasks
      .filter((task) => task.due_date && task.status !== 'Done')
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];
  }

  /** Formats a deadline info object with relative status and text. */
  private buildDeadlineInfo(nextTask: TaskInterface, today: number): DeadlineInfo {
    const date = new Date(nextTask.due_date);
    const overdue = date.setHours(0, 0, 0, 0) < today;
    return {
      rawDate: nextTask.due_date,
      formattedDate: date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      text: overdue ? 'Overdue Deadline' : 'Upcoming Deadline',
      overdue,
    };
  }
}
