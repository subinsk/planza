import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { Board, DataLoading, Project, Task } from '@planza/api-interfaces';
import { formatUser } from '@planza/web/ui';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { HomeAction } from './state/home.actions';
import { HomeState } from './state/home.state';

@Component({
  selector: 'planza-home',
  templateUrl: './home.component.html',
  styles: [
    `
      .projects {
        &__container {
        }
        &__list {
          @apply grid gap-4;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
  @Select(HomeState.projectsLoading)
  projectsLoading$!: Observable<DataLoading>;

  @Select(HomeState.boardsLoading)
  boardsLoading$!: Observable<DataLoading>;

  @Select(HomeState.highPriorityTasksLoading)
  highPriorityTasksLoading$!: Observable<DataLoading>;

  @Select(HomeState.recentTasksLoading)
  recentTasksLoading$!: Observable<DataLoading>;

  @Select(HomeState.getProjects)
  projects$!: Observable<Project[]>;

  @Select(HomeState.getBoards)
  boards$!: Observable<Board[]>;

  @Select(HomeState.getHighPriorityTasks)
  hightPriorityTasks$!: Observable<Task[]>;

  @Select(HomeState.getRecentTasks)
  recentTasks$!: Observable<Task[]>;

  user$ = this.auth.user$.pipe(formatUser());

  constructor(private store: Store, private auth: AuthService, private activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.store.dispatch(new HomeAction.GetProjects());
    this.store.dispatch(new HomeAction.GetRecentTasks());
    this.store.dispatch(new HomeAction.GetHighPriorityTasks());
    this.store.dispatch(new HomeAction.GetBoards());

    console.log(this.activatedRoute.snapshot.queryParams);
  }
}


