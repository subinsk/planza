import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { MultiDocPayload, Task } from '@planza/api-interfaces';
import { API_TOKEN } from '@planza/web/ui/tokens';
@Injectable({
  providedIn: 'root',
})
export class TasksService {
  myTasks = `${this.baseURL}/tasks/my`;
  constructor(private http: HttpClient, @Inject(API_TOKEN) private baseURL: string) {}

  getMyTasks() {
    return this.http.get<MultiDocPayload<Task>>(this.myTasks);
  }
}


