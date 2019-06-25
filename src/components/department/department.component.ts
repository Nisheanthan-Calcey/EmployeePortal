import { Component } from '@angular/core';

import { DepartmentService } from 'src/services/department.service';

import { IDepartment } from './department.interface';

@Component({
  selector: 'app-department',
  templateUrl: './department.component.html',
  styleUrls: ['./department.component.scss'],
})
export class DepartmentComponent {
  private departments: IDepartment[];

  constructor( private departmentService: DepartmentService) {
    this.departments = this.departmentService.getDepartments();
    this.departmentService.updateServer();
  }
}
