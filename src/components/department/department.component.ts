import { Component } from '@angular/core';

import { DepartmentService } from 'src/services/department.service';

import { IDepartment } from './department.interface';
import { NetConnectionService } from 'src/services/shared/connection.service';

@Component({
  selector: 'app-department',
  templateUrl: './department.component.html',
  styleUrls: ['./department.component.scss'],
})
export class DepartmentComponent {
  private departments: IDepartment[];

  constructor(
    private departmentService: DepartmentService,
    private netConnectionService: NetConnectionService) {
    this.netConnectionService.getConnectionState().subscribe(online => {
      if (online) {
        console.log('ONLINE');
        this.departmentService.departmentsFromAPI().subscribe(depFromAPI => {
          console.log(depFromAPI, 'check');
          this.departments = depFromAPI;
        });
        this.departmentService.updateServer();
      } else {
        this.departmentService.departmentsFromDB().then(depFromDB => {
          this.departments = depFromDB;
        });
      }
    });
  }
}
