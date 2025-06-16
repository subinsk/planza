/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import { Injectable } from '@angular/core';
import { DataLoading, DataLoadingState, Project } from '@planza/api-interfaces';
import { OrgsAction } from '@planza/web/orgs/state/orgs.actions';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { append, patch, removeItem, updateItem } from '@ngxs/store/operators';
import produce from 'immer';
import { tap } from 'rxjs/operators';
import { ProjectsService } from '../projects.service';
import { ProjectsAction } from './projects.actions';
export class ProjectsStateModel {
  public projects: Project[] = [];
  public projectsFetched = false;
  public projectDetail: Project | null = null;
  public projectDetailFetched = false;
  public projectsLoading: DataLoading = { type: DataLoadingState.init };
  public projectDetailLoading: DataLoading = { type: DataLoadingState.init };
}

const defaults: ProjectsStateModel = {
  projects: [],
  projectsFetched: false,
  projectDetailFetched: false,
  projectDetail: null,
  projectsLoading: { type: DataLoadingState.init },
  projectDetailLoading: { type: DataLoadingState.init },
};

@State<ProjectsStateModel>({
  name: 'projects',
  defaults,
})
@Injectable()
export class ProjectsState {
  @Selector()
  static getAllProjects(state: ProjectsStateModel) {
    return state.projects;
  }
  @Selector()
  static projectsFetched(state: ProjectsStateModel) {
    return state.projectsFetched;
  }
  @Selector()
  static projectDetailFetched(state: ProjectsStateModel) {
    return state.projectDetailFetched;
  }
  @Selector()
  static projectsLoading(state: ProjectsStateModel) {
    if (state.projectsFetched && state.projectsLoading.type !== DataLoadingState.error) {
      return { type: DataLoadingState.success };
    }
    return state.projectsLoading;
  }
  @Selector()
  static projectDetailLoading(state: ProjectsStateModel) {
    return state.projectDetailLoading;
  }
  @Selector()
  static getProjectDetail(state: ProjectsStateModel) {
    return state.projectDetail;
  }
  constructor(private projectService: ProjectsService) {}
  @Action(ProjectsAction.Add)
  add({ setState, dispatch }: StateContext<ProjectsStateModel>, { payload }: ProjectsAction.Add) {
    return this.projectService.create(payload).pipe(
      tap((project) => {
        setState(patch({ projects: append([project]) }));
        dispatch(new OrgsAction.AddProject(project, project.org.id));
      }),
    );
  }
  @Action(ProjectsAction.Update)
  update({ setState }: StateContext<ProjectsStateModel>, { payload, id }: ProjectsAction.Update) {
    return this.projectService.update(id, payload).pipe(
      tap((project) => {
        setState(patch({ projects: updateItem<Project>((item) => item?.id === id, project) }));
      }),
    );
  }
  @Action(ProjectsAction.Delete)
  delete({ setState, getState, dispatch }: StateContext<ProjectsStateModel>, { id }: ProjectsAction.Delete) {
    const projects = getState().projects;
    const project = projects.find((item) => item?.id === id);
    if (project) {
      setState(patch({ projects: removeItem<Project>((item) => item?.id === id) }));
      dispatch(new OrgsAction.DeleteProject(project.id, project.org.id));
    }
    return this.projectService.delete(id).pipe(
      tap(
        () => {
          return;
        },
        () => {
          setState(
            patch({
              projects,
            }),
          );
          if (project) {
            dispatch(new OrgsAction.AddProject(project, project.org.id));
          }
        },
      ),
    );
  }
  @Action(ProjectsAction.AddBoard)
  addBoard({ patchState, getState }: StateContext<ProjectsStateModel>, { payload }: ProjectsAction.AddBoard) {
    return this.projectService.createBoard(payload).pipe(
      tap((data) => {
        const { projectDetail } = getState();
        const projectDetailUpdated = produce(projectDetail, (draft) => {
          draft?.boards.push(data);
        });
        patchState({ projectDetail: projectDetailUpdated });
      }),
    );
  }

  @Action(ProjectsAction.UpdateBoard)
  updateBoard({ patchState, getState }: StateContext<ProjectsStateModel>, { id, payload }: ProjectsAction.UpdateBoard) {
    return this.projectService.updateBoard(id, payload).pipe(
      tap((data) => {
        const { projectDetail } = getState();
        const projectDetailUpdated = produce(projectDetail, (draft) => {
          if (draft) {
            const boardIndex = draft.boards.findIndex((item) => item?.id === id);
            if (boardIndex >= 0) {
              draft.boards[boardIndex] = data;
            }
          }
        });
        patchState({ projectDetail: projectDetailUpdated });
      }),
    );
  }

  @Action(ProjectsAction.DeleteBoard)
  deleteBoard({ patchState, getState }: StateContext<ProjectsStateModel>, { id }: ProjectsAction.DeleteBoard) {
    return this.projectService.deleteBoard(id).pipe(
      tap(() => {
        const { projectDetail } = getState();
        const projectDetailUpdated = produce(projectDetail, (draft) => {
          if (draft) {
            const boardsRemaining = draft.boards.filter((item) => item?.id !== id);
            if (boardsRemaining) {
              draft.boards = boardsRemaining;
            }
          }
        });
        patchState({ projectDetail: projectDetailUpdated });
      }),
    );
  }

  @Action(ProjectsAction.GetAll)
  getAll({ patchState }: StateContext<ProjectsStateModel>) {
    patchState({
      projectsLoading: { type: DataLoadingState.loading },
    });
    return this.projectService.getAll().pipe(
      tap(
        ({ payload: projects }) => {
          patchState({ projects, projectsLoading: { type: DataLoadingState.success }, projectsFetched: true });
        },
        () => {
          patchState({
            projectsLoading: { type: DataLoadingState.error },
          });
        },
      ),
    );
  }
  @Action(ProjectsAction.Get)
  get({ patchState }: StateContext<ProjectsStateModel>, { payload }: ProjectsAction.Get) {
    patchState({
      projectDetailLoading: { type: DataLoadingState.loading },
    });
    return this.projectService.getSingle(payload).pipe(
      tap(
        (data) => {
          patchState({
            projectDetail: data,
            projectDetailLoading: { type: DataLoadingState.success },
            projectDetailFetched: true,
          });
        },
        () => {
          patchState({
            projectDetailLoading: { type: DataLoadingState.error },
          });
        },
      ),
    );
  }
  @Action(ProjectsAction.UpdateMembers)
  updateMembers({ patchState }: StateContext<ProjectsStateModel>, { id, payload }: ProjectsAction.UpdateMembers) {
    return this.projectService.updateMembers(id, payload).pipe(
      tap((data) => {
        patchState({ projectDetail: data });
      }),
    );
  }
}


